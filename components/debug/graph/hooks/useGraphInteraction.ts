
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
    showCursors?: boolean;
}

export const useGraphInteraction = ({
    svgRef,
    gRef,
    dimensions,
    data,
    onHover,
    updateChart,
    currentDomains,
    zoomHistory,
    showCursors = false
}: UseGraphInteractionProps) => {
    const { width, height } = dimensions;
    const dragStartCoords = useRef<[number, number] | null>(null);
    const onHoverRef = useRef(onHover);
    
    // Cursor State (Store X-Domain Values)
    const cursor1Val = useRef<number | null>(null);
    const cursor2Val = useRef<number | null>(null);

    // Keep hover callback fresh
    useEffect(() => { onHoverRef.current = onHover; }, [onHover]);

    // Initialize Cursors when enabled
    useEffect(() => {
        if (showCursors) {
            // If cursors are not initialized OR if they are off-screen (optional, but good for UX), reset them to view
            // For now, we just initialize if null.
            // To fix "initial cursor goes out of screen" when zooming then enabling:
            // We use the CURRENT view domain, not the global data domain.
            
            if (cursor1Val.current === null) {
                let min, max;
                if (currentDomains.current) {
                    min = currentDomains.current.x[0];
                    max = currentDomains.current.x[1];
                } else if (data.xValues.length > 0) {
                    min = data.xValues[0];
                    max = data.xValues[data.xValues.length - 1];
                } else {
                    return;
                }

                const range = max - min;
                cursor1Val.current = min + range * 0.25;
                cursor2Val.current = min + range * 0.75;
                updateChart();
            }
        } else {
            // Reset cursors when disabled so they re-initialize in view next time
            cursor1Val.current = null;
            cursor2Val.current = null;
        }
    }, [showCursors, data, updateChart]); // currentDomains is ref

    useEffect(() => {
        if (!svgRef.current || !gRef.current || width === 0 || height === 0) return;

        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);
        
        // Define margins (must match Render hook)
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // --- Interaction Elements Setup ---
        let interactionG = g.select<SVGGElement>(".interaction-group");
        if (interactionG.empty()) {
            interactionG = g.append("g").attr("class", "interaction-group");
        }
        interactionG.raise();

        let selectionBox = interactionG.select<SVGRectElement>(".selection-box");
        if (selectionBox.empty()) {
            selectionBox = interactionG.append("rect")
                .attr("class", "selection-box")
                .attr("fill", "rgba(37, 99, 235, 0.15)")
                .attr("stroke", "#2563eb")
                .attr("stroke-width", 1)
                .style("opacity", 0)
                .style("pointer-events", "none");
        }

        let overlay = interactionG.select<SVGRectElement>(".overlay-rect");
        if (overlay.empty()) {
            overlay = interactionG.append("rect")
                .attr("class", "overlay-rect")
                .style("fill", "transparent")
                .style("cursor", "crosshair");
        }
        overlay.attr("width", Math.max(0, innerWidth)).attr("height", Math.max(0, innerHeight));

        // --- Cursors Setup ---
        let cursorsG = interactionG.select<SVGGElement>(".cursors-group");
        if (cursorsG.empty()) {
            cursorsG = interactionG.append("g").attr("class", "cursors-group");
        }

        // Helper to update cursor visuals
        const updateCursors = () => {
            const scales = (svg.node() as any).__scales;
            if (!scales || !showCursors || cursor1Val.current === null || cursor2Val.current === null) {
                cursorsG.style("display", "none");
                return;
            }
            cursorsG.style("display", null);

            const x1 = scales.x(cursor1Val.current);
            const x2 = scales.x(cursor2Val.current);

            // Draw Cursor 1
            const c1 = cursorsG.selectAll(".cursor-1").data([0]);
            const c1Enter = c1.enter().append("g").attr("class", "cursor-1").style("cursor", "ew-resize");
            c1Enter.append("line").attr("stroke", "#ef4444").attr("stroke-width", 1).attr("stroke-dasharray", "4 2");
            c1Enter.append("text").attr("fill", "#ef4444").attr("font-size", "10px").attr("y", -5).attr("text-anchor", "middle").text("1");
            c1Enter.append("rect").attr("fill", "transparent").attr("width", 10).attr("x", -5).attr("height", innerHeight + 20).attr("y", -10); // Hit area

            const c1Merge = c1.merge(c1Enter as any);
            c1Merge.attr("transform", `translate(${x1}, 0)`);
            c1Merge.select("line").attr("y2", innerHeight);

            // Draw Cursor 2
            const c2 = cursorsG.selectAll(".cursor-2").data([0]);
            const c2Enter = c2.enter().append("g").attr("class", "cursor-2").style("cursor", "ew-resize");
            c2Enter.append("line").attr("stroke", "#22c55e").attr("stroke-width", 1).attr("stroke-dasharray", "4 2");
            c2Enter.append("text").attr("fill", "#22c55e").attr("font-size", "10px").attr("y", -5).attr("text-anchor", "middle").text("2");
            c2Enter.append("rect").attr("fill", "transparent").attr("width", 10).attr("x", -5).attr("height", innerHeight + 20).attr("y", -10); // Hit area

            const c2Merge = c2.merge(c2Enter as any);
            c2Merge.attr("transform", `translate(${x2}, 0)`);
            c2Merge.select("line").attr("y2", innerHeight);

            // Drag Behavior
            const drag = d3.drag()
                .on("drag", (event, d) => {
                    const newX = Math.max(0, Math.min(innerWidth, event.x));
                    const newVal = scales.x.invert(newX);
                    
                    // Determine which cursor is being dragged based on class
                    const isC1 = d3.select(event.sourceEvent.target.parentNode).classed("cursor-1");
                    if (isC1) cursor1Val.current = newVal;
                    else cursor2Val.current = newVal;
                    
                    updateCursors();
                });

            c1Merge.call(drag as any);
            c2Merge.call(drag as any);

            // Info Box
            let infoBox = cursorsG.select<SVGGElement>(".cursor-info");
            if (infoBox.empty()) {
                infoBox = cursorsG.append("g").attr("class", "cursor-info");
                infoBox.append("rect").attr("fill", "rgba(255, 255, 255, 0.8)").attr("stroke", "#ccc").attr("rx", 4);
                infoBox.append("text").attr("font-family", "monospace").attr("font-size", "10px").attr("fill", "#333");
            }

            const dt = Math.abs(cursor2Val.current - cursor1Val.current);
            const freq = dt === 0 ? 0 : 1 / dt;
            
            const format = (n: number) => n.toExponential(3);
            const text = `Δt: ${format(dt)}s | f: ${format(freq)}Hz`;
            
            const textEl = infoBox.select("text").text(text);
            const bbox = (textEl.node() as SVGTextElement).getBBox();
            
            infoBox.select("rect")
                .attr("x", bbox.x - 4)
                .attr("y", bbox.y - 2)
                .attr("width", bbox.width + 8)
                .attr("height", bbox.height + 4);

            // Position info box at top right
            infoBox.attr("transform", `translate(${innerWidth - bbox.width - 10}, 15)`);
        };

        // Hook into the render cycle to update cursors when chart updates (zoom/pan)
        // We can't easily hook into `updateChart` directly from here without passing a callback ref or similar.
        // Instead, we can use a MutationObserver or just rely on the fact that this effect runs when `data` changes.
        // But `updateChart` is called imperatively.
        // A simple hack is to attach the update function to the SVG node so the render hook can call it?
        // Or better: The render hook updates the scales on the SVG node. We can use `requestAnimationFrame` loop or similar?
        // Actually, `useGraphRender` updates the chart. We need to update cursors AFTER chart update.
        // Let's expose `updateCursors` to the outside or run it here.
        // Since `updateChart` is passed IN, we can't modify it.
        // However, `useGraphRender` runs synchronously.
        // We can use a `useEffect` that depends on `currentDomains.current`? No, that's a ref.
        // We can add a listener?
        
        // Let's just run updateCursors immediately.
        updateCursors();

        // And also whenever the component re-renders (which happens on zoom end via state update if we had one, but we don't).
        // Wait, `useGraphInteraction` is called on every render.
        // So `updateCursors()` here is correct for React updates.
        // But for D3 zoom updates (which don't trigger React render), we need to hook into the zoom event.
        // The zoom behavior is handled below.

        // --- Event Handlers ---

        const handleMouseDown = (event: any) => {
            if (event.button !== 0) return;
            // Ignore if clicking on cursors
            if (d3.select(event.target.parentNode).classed("cursor-1") || d3.select(event.target.parentNode).classed("cursor-2")) return;

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

                const valX0 = scales.x.invert(x0);
                const valX1 = scales.x.invert(x1);
                const valYMax = scales.y.invert(y0);
                const valYMin = scales.y.invert(y1);

                if (currentDomains.current) {
                    zoomHistory.current.push([currentDomains.current.x, currentDomains.current.y]);
                }
                
                currentDomains.current = { 
                    x: [valX0, valX1], 
                    y: [valYMin, valYMax]
                };
                
                updateChart();
                updateCursors(); // Update cursors after zoom
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

    }, [width, height, data, showCursors]); // Re-bind if dimensions/data/cursors change

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
