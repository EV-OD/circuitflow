
import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { ProcessedGraphData } from '../../../../hooks/useGraphData';

interface UseGraphRenderProps {
    svgRef: React.RefObject<SVGSVGElement>;
    gRef: React.RefObject<SVGGElement>;
    dimensions: { width: number, height: number };
    data: ProcessedGraphData;
    isDarkMode: boolean;
    currentDomains: React.MutableRefObject<{ x: [number, number], y: [number, number] } | null>;
}

export const useGraphRender = ({
    svgRef,
    gRef,
    dimensions,
    data,
    isDarkMode,
    currentDomains
}: UseGraphRenderProps) => {
    const { width, height } = dimensions;

    const updateChart = () => {
        if (!svgRef.current || !gRef.current || width === 0 || height === 0) return;

        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);
        
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Store margin for interaction hook
        (svg.node() as any).__margin = margin;

        // Groups
        const gridG = g.select<SVGGElement>(".grid");
        const xAxisG = g.select<SVGGElement>(".axis-x");
        const yAxisG = g.select<SVGGElement>(".axis-y");
        const contentG = g.select<SVGGElement>(".content-group");

        // Initialize Domains if needed
        if (!currentDomains.current) {
             const { yMin, yMax, xValues } = data;
             let yPadding = (yMax - yMin) * 0.1;
             if (yPadding === 0) yPadding = Math.abs(yMax) * 0.1 || 1;
             
             currentDomains.current = {
                 x: d3.extent(xValues) as [number, number],
                 y: [yMin - yPadding, yMax + yPadding]
             };
        }

        const { x: xDom, y: yDom } = currentDomains.current!;

        // Scales
        const xScale = d3.scaleLinear().domain(xDom).range([0, innerWidth]);
        const yScale = d3.scaleLinear().domain(yDom).range([innerHeight, 0]);

        // Save scales for interaction
        (svg.node() as any).__scales = { x: xScale, y: yScale };

        // Colors
        const axisColor = isDarkMode ? "#9ca3af" : "#4b5563";
        const gridColor = isDarkMode ? "#374151" : "#e5e7eb";
        const cursorColor = isDarkMode ? "#d1d5db" : "#4b5563";

        // Axes
        const xFormat = Math.abs(xDom[1] - xDom[0]) < 1e-3 ? d3.format(".2e") : d3.format(".2s");
        const yFormat = Math.abs(yDom[1] - yDom[0]) < 1e-3 ? d3.format(".2e") : d3.format(".2s");

        xAxisG.attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(xFormat));
        
        yAxisG.call(d3.axisLeft(yScale).ticks(5).tickFormat(yFormat));

        // Grid
        const xTicks = xScale.ticks(5);
        const yTicks = yScale.ticks(5);

        gridG.selectAll(".grid-x").data(xTicks).join("line")
            .attr("class", "grid-x")
            .attr("x1", d => xScale(d)).attr("x2", d => xScale(d))
            .attr("y1", 0).attr("y2", innerHeight)
            .attr("stroke", gridColor).attr("stroke-opacity", 0.1);

        gridG.selectAll(".grid-y").data(yTicks).join("line")
            .attr("class", "grid-y")
            .attr("x1", 0).attr("x2", innerWidth)
            .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
            .attr("stroke", gridColor).attr("stroke-opacity", 0.1);

        // Styling
        svg.selectAll(".domain").attr("stroke", axisColor);
        svg.selectAll(".tick line").attr("stroke", axisColor);
        svg.selectAll(".tick text").attr("fill", axisColor).style("font-family", "monospace").style("font-size", "10px");
        svg.select(".cursor-line").attr("stroke", cursorColor).attr("y2", innerHeight);

        // Lines
        const lineGenerator = d3.line<{x: number, y: number}>()
            .defined(d => !isNaN(d.x) && !isNaN(d.y))
            .x(d => xScale(d.x))
            .y(d => yScale(d.y));

        contentG.selectAll(".data-line")
            .data(data.series)
            .join("path")
            .attr("class", "data-line")
            .attr("fill", "none")
            .attr("stroke", (d: any) => d.color)
            .attr("stroke-width", 2)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", (d: any) => lineGenerator(d.values));
    };

    // Redraw when dependencies change
    useEffect(() => {
        updateChart();
    }, [width, height, data, isDarkMode]);

    return { updateChart };
};
