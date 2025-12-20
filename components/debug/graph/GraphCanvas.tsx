
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { ProcessedGraphData } from '../../../hooks/useGraphData';
import { TooltipData } from './GraphTooltip';
import { useGraphRender } from './hooks/useGraphRender';
import { useGraphInteraction } from './hooks/useGraphInteraction';

interface GraphCanvasProps {
    dimensions: { width: number, height: number };
    data: ProcessedGraphData;
    isDarkMode: boolean;
    onHover: (data: TooltipData | null) => void;
    showCursors: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = React.memo(({ dimensions, data, isDarkMode, onHover, showCursors }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const gRef = useRef<SVGGElement>(null);
    
    // Zoom State Refs
    const zoomHistory = useRef<[[number, number], [number, number]][]>([]);
    const currentDomains = useRef<{ x: [number, number], y: [number, number] } | null>(null);

    // 1. Initial SVG Setup (One-time structure)
    useEffect(() => {
        if (!svgRef.current || !gRef.current) return;
        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);
        
        // Ensure basic group structure exists (idempotent)
        // Order matters: Grid -> Axes -> Content -> Interaction
        if (g.select(".grid").empty()) {
            const margin = { top: 20, right: 30, bottom: 40, left: 60 };
            g.attr("transform", `translate(${margin.left},${margin.top})`);

            // Defs for clipping
            let defs = svg.select("defs");
            if (defs.empty()) defs = svg.append("defs");
            
            defs.append("clipPath")
                .attr("id", "clip-path-graph")
                .append("rect")
                .attr("width", "100%") 
                .attr("height", "100%");

            g.append("g").attr("class", "grid");
            const axes = g.append("g").attr("class", "axes");
            axes.append("g").attr("class", "axis-x");
            axes.append("g").attr("class", "axis-y");
            
            // Y-Axis Label
            axes.append("text")
                .attr("class", "y-label")
                .attr("transform", `rotate(-90)`)
                .attr("y", -45)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-size", "10px")
                .style("font-weight", "bold")
                .style("text-transform", "uppercase")
                .text("Amplitude");

            const content = g.append("g")
                .attr("class", "content-group")
                .attr("clip-path", "url(#clip-path-graph)");
            
            content.append("line")
                .attr("class", "cursor-line")
                .style("opacity", 0)
                .style("pointer-events", "none")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "4 4");
                
            // Interaction group will be handled by useGraphInteraction to ensure it's always on top
        }
    }, []);

    // 2. Render Hook (Draws data lines, axes, grid)
    const { updateChart } = useGraphRender({
        svgRef, gRef, dimensions, data, isDarkMode, currentDomains
    });

    // 3. Interaction Hook (Handles Zoom, Pan, Hover, and creates Overlay/SelectionBox)
    useGraphInteraction({
        svgRef, gRef, dimensions, data, 
        onHover, updateChart, currentDomains, zoomHistory, showCursors
    });

    // Update clipping path when dimensions change
    useEffect(() => {
        if(!gRef.current) return;
        const g = d3.select(gRef.current);
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const w = Math.max(0, dimensions.width - margin.left - margin.right);
        const h = Math.max(0, dimensions.height - margin.top - margin.bottom);
        
        d3.select("#clip-path-graph rect")
            .attr("width", w)
            .attr("height", h);
            
        g.select(".y-label").attr("x", -h/2);

    }, [dimensions.width, dimensions.height]);

    return (
        <svg 
            ref={svgRef}
            width={dimensions.width} 
            height={dimensions.height}
            className="cursor-crosshair block select-none"
        >
            <g ref={gRef} />
        </svg>
    );
});
