
import React, { useCallback } from 'react';
import { GRID_SIZE } from '../../../../constants';
import { XY } from '../../../../types';

interface UseDragDropProps {
    svgRef: React.RefObject<SVGSVGElement>;
    screenToWorld: (x: number, y: number) => XY;
    addComponent: (type: string, x: number, y: number) => void;
}

export const useDragDrop = ({ svgRef, screenToWorld, addComponent }: UseDragDropProps) => {
    
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('circuit/component-type');
        if (type) {
            const rect = svgRef.current?.getBoundingClientRect();
            if (rect) {
                const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
                const snappedX = Math.round(worldPos.x / GRID_SIZE) * GRID_SIZE;
                const snappedY = Math.round(worldPos.y / GRID_SIZE) * GRID_SIZE;
                addComponent(type, snappedX, snappedY);
            }
        }
    }, [svgRef, screenToWorld, addComponent]);

    return { handleDragOver, handleDrop };
};
