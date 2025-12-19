
import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { ProcessedGraphData } from '../../../../hooks/useGraphData';
import { TooltipData } from '../GraphTooltip';

interface UseGraphInteractionProps {
    svgRef: React.RefObject<SVGSVGElement>;
    gRef: React.RefObject<SVGGElement>;
    dimensions: { width: number, height: number };
    data: ProcessedGraphData;
    onHover: (data: TooltipData | null) => void;
    updateChart: () => void;
    currentDomains: React.MutableRefObject<{ x: [number, number], y: [number, number] } | null>;
    zoomHistory: React.MutableRefObject<[[number, number], [number, number]][]>;
}

export const useGraphInteraction = ({
    svgRef,
    gRef,
    dimensions,
    data,
    onHover,
    updateChart,
    currentDomains,
    zoomHistory
}: UseGraphInteractionProps) => {
    const { width, height } = dimensions;
    const dragStartCoords = useRef<[number, number] | null>(null);
    const onHoverRef = useRef(onHover);

    // Keep hover callback fresh
    useEffect(() => { onHoverRef.current = onHover; }, [onHover]);

    useEffect(() => {
        if (!svgRef.current || !gRef.current || width === 0 || height === 0) return;

        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);
        
        // Define margins (must match Render hook)
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // --- Interaction Elements Setup ---
        // We manage these via D3 to prevent React reconciliation from wiping active drag states
        let interactionG = g.select<SVGGElement>(".interaction-group");
        if (interactionG.empty()) {
            interactionG = g.append("g").attr("class", "interaction-group");
        }
        // Ensure it's on top
        interactionG.raise();

        let selectionBox = interactionG.select<SVGRectElement>(".selection-box");
        if (selectionBox.empty()) {
            selectionBox = interactionG.append("rect")
                .attr("class", "selection-box")
                .attr("fill", "rgba(37, 99, 235, 0.15)")
                .attr("stroke", "#2563eb")
                .attr("stroke-width", 1)
                .style("opacity", 0)
                .style("pointer-events", "none"); // Let events pass through to overlay
        }

        let overlay = interactionG.select<SVGRectElement>(".overlay-rect");
        if (overlay.empty()) {
            overlay = interactionG.append("rect")
                .attr("class", "overlay-rect")
                .style("fill", "transparent")
                .style("cursor", "crosshair");
        }

        // Update Overlay Size
        overlay.attr("width", Math.max(0, innerWidth)).attr("height", Math.max(0, innerHeight));

        // --- Event Handlers ---

        const handleMouseDown = (event: any) => {
            if (event.button !== 0) return;
            dragStartCoords.current = d3.pointer(event, g.node());
            
            // Initialize visual box
            selectionBox
                .attr("x", dragStartCoords.current[0])
                .attr("y", dragStartCoords.current[1])
                .attr("width", 0)
                .attr("height", 0)
                .style("opacity", 1);
            
            event.preventDefault();
        };

        const handleMouseMove = (event: any) => {
            const [mx, my] = d3.pointer(event, g.node());
            
            // Attempt to retrieve scales attached to SVG by render hook
            const scales = (svg.node() as any).__scales;

            if (!dragStartCoords.current && scales) {
                // --- HOVER MODE ---
                if (mx >= 0 && mx <= innerWidth && my >= 0 && my <= innerHeight) {
                    const xVal = scales.x.invert(mx);
                    const bisect = d3.bisector((d: number) => d).center;
                    const idx = bisect(data.xValues, xVal);
                    
                    if (idx >= 0 && idx < data.xValues.length) {
                        const currentX = data.xValues[idx];
                        const cx = scales.x(currentX);
                        
                        svg.select(".cursor-line")
                            .attr("x1", cx).attr("x2", cx)
                            .attr("y1", 0).attr("y2", innerHeight)
                            .style("opacity", 1);
                        
                        const tooltipSeries = data.series.map(s => ({
                            label: s.label,
                            color: s.color,
                            value: s.values[idx].y
                        }));
                        onHoverRef.current({ xVal: currentX, series: tooltipSeries });
                    }
                } else {
                    onHoverRef.current(null);
                    svg.select(".cursor-line").style("opacity", 0);
                }
            } else if (dragStartCoords.current) {
                // --- DRAG MODE ---
                svg.select(".cursor-line").style("opacity", 0);
                onHoverRef.current(null); // Hide tooltip during drag

                const start = dragStartCoords.current;
                
                // Constrain to chart area
                const curX = Math.max(0, Math.min(innerWidth, mx));
                const curY = Math.max(0, Math.min(innerHeight, my));

                const x = Math.min(start[0], curX);
                const y = Math.min(start[1], curY);
                const w = Math.abs(curX - start[0]);
                const h = Math.abs(curY - start[1]);

                selectionBox
                    .attr("x", x)
                    .attr("y", y)
                    .attr("width", w)
                    .attr("height", h);
            }
        };

        const handleMouseUp = (event: any) => {
            if (!dragStartCoords.current) return;
            
            const start = dragStartCoords.current;
            const [mx, my] = d3.pointer(event, g.node());
            const scales = (svg.node() as any).__scales;

            const end = [
                Math.max(0, Math.min(innerWidth, mx)), 
                Math.max(0, Math.min(innerHeight, my))
            ];
            
            const dx = Math.abs(end[0] - start[0]);
            const dy = Math.abs(end[1] - start[1]);

            // Reset Box
            selectionBox.style("opacity", 0).attr("width", 0).attr("height", 0);
            dragStartCoords.current = null;

            // Trigger Zoom if drag was significant (>5px)
            if (dx > 5 && dy > 5 && scales) {
                const x0 = Math.min(start[0], end[0]);
                const x1 = Math.max(start[0], end[0]);
                const y0 = Math.min(start[1], end[1]);
                const y1 = Math.max(start[1], end[1]);

                // Invert pixel coordinates to domain values
                // For Y: 0 (top) is max value, Height (bottom) is min value usually in inverted axis
                // But d3.scaleLinear().range([height, 0]) means invert(0) = max, invert(height) = min.
                // So invert(y0) is Max, invert(y1) is Min.
                const valX0 = scales.x.invert(x0);
                const valX1 = scales.x.invert(x1);
                const valYMax = scales.y.invert(y0);
                const valYMin = scales.y.invert(y1);

                if (currentDomains.current) {
                    zoomHistory.current.push([currentDomains.current.x, currentDomains.current.y]);
                }
                
                currentDomains.current = { 
                    x: [valX0, valX1], 
                    y: [valYMin, valYMax] // Ensure [min, max] order
                };
                
                updateChart();
            }
        };

        const handleMouseLeave = () => {
            if (!dragStartCoords.current) {
                onHoverRef.current(null);
                svg.select(".cursor-line").style("opacity", 0);
            } else {
                // Cancel drag if leaving area
                selectionBox.style("opacity", 0);
                dragStartCoords.current = null;
            }
        };

        // Bind events
        overlay.on("mousedown", handleMouseDown);
        overlay.on("mousemove", handleMouseMove);
        overlay.on("mouseup", handleMouseUp);
        overlay.on("mouseleave", handleMouseLeave);

        return () => {
            overlay.on("mousedown", null);
            overlay.on("mousemove", null);
            overlay.on("mouseup", null);
            overlay.on("mouseleave", null);
        };

    }, [width, height, data]); // Re-bind if dimensions/data structure changes

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!currentDomains.current) return;
            
            if (e.code === 'Space') {
                e.preventDefault(); 
                if (e.ctrlKey) {
                    // Reset
                    zoomHistory.current = [];
                    currentDomains.current = null;
                    updateChart();
                } else {
                    // Step Back
                    if (zoomHistory.current.length > 0) {
                        const prev = zoomHistory.current.pop();
                        if (prev) {
                            currentDomains.current = { x: prev[0], y: prev[1] };
                            updateChart();
                        }
                    } else {
                        currentDomains.current = null;
                        updateChart();
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [updateChart]);
};
