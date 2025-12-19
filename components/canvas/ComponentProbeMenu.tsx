
import React, { useMemo, useRef, useLayoutEffect, useState } from 'react';
import { X, Microscope } from 'lucide-react';
import { useCircuit } from '../../context/CircuitContext';
import { getModelForComponent } from '../../simulation/models/ModelRegistry';
import { COMPONENT_LIBRARY } from '../../constants';

interface ComponentProbeMenuProps {
    target: { componentId: string, x: number, y: number };
    onClose: () => void;
    onSelect: (variable: string) => void;
}

export const ComponentProbeMenu: React.FC<ComponentProbeMenuProps> = ({ target, onClose, onSelect }) => {
    const { components, customDefinitions, lastNetlistResult } = useCircuit();
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPos, setAdjustedPos] = useState({ left: target.x, top: target.y });

    const probes = useMemo(() => {
        const comp = components.find(c => c.id === target.componentId);
        if (!comp) return [];

        const model = getModelForComponent(comp.definitionType);
        if (!model) return [];

        const spiceName = lastNetlistResult?.componentMap.get(comp.id);
        if (!spiceName) return [];

        // Build node map for model
        const nodeMap = new Map<string, string>();
        const def = COMPONENT_LIBRARY.find(d => d.type === comp.definitionType) || 
                    customDefinitions.find(d => d.type === comp.definitionType);
        
        if (def && lastNetlistResult) {
            def.ports.forEach(p => {
                const key = `${comp.id}:${p.id}`;
                const spiceNode = lastNetlistResult.nodeMap.get(key);
                if (spiceNode) nodeMap.set(p.id, spiceNode);
            });
        }

        // Get available probes from model
        return model.getProbes({
            componentId: comp.id,
            spiceName,
            nodes: nodeMap
        });
    }, [target.componentId, components, customDefinitions, lastNetlistResult]);

    // Bounds checking
    useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let newLeft = target.x + 20;
            let newTop = target.y - 20;

            // Check Right Edge
            if (newLeft + rect.width > viewportWidth - 20) {
                newLeft = target.x - rect.width - 20; // Flip to left
            }

            // Check Bottom Edge
            if (newTop + rect.height > viewportHeight - 20) {
                newTop = viewportHeight - rect.height - 20; // Clamp bottom
            }
            
            // Check Top Edge
            if (newTop < 10) {
                newTop = 10;
            }

            setAdjustedPos({ left: newLeft, top: newTop });
        }
    }, [target.x, target.y]);

    return (
        <div 
            ref={menuRef}
            className="fixed z-50 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
            style={{
                left: adjustedPos.left,
                top: adjustedPos.top,
            }}
            onMouseDown={(e) => e.stopPropagation()} 
        >
            <div className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-t-lg">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <Microscope className="w-3 h-3 text-purple-500" />
                    Inspect
                </span>
                <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500">
                    <X className="w-3 h-3" />
                </button>
            </div>
            
            <div className="p-1 max-h-48 overflow-y-auto custom-scrollbar">
                {probes.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400 italic">
                        No variables available. <br/> Run simulation first?
                    </div>
                ) : (
                    probes.map((probe) => (
                        <button
                            key={probe}
                            onClick={() => onSelect(probe)}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded font-mono transition-colors"
                        >
                            {probe}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};
