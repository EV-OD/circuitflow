
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, X, Zap, Activity, Microscope } from 'lucide-react';
import { createPortal } from 'react-dom';

interface GraphAxisControlProps {
    type: 'X' | 'Y';
    currentLabel: string;
    variables?: string[];
    onSelectVariable?: (v: string) => void;
    onRemoveVariable?: (v: string) => void; 
    onAddVoltageProbe?: () => void;
    onAddCurrentProbe?: () => void;
    onAddComponentProbe?: () => void; // New prop
    activeVariables?: string[]; 
    minimal?: boolean; 
}

export const GraphAxisControl: React.FC<GraphAxisControlProps> = ({
    type,
    currentLabel,
    variables = [],
    onSelectVariable,
    onAddVoltageProbe,
    onAddCurrentProbe,
    onAddComponentProbe,
    activeVariables = [],
    minimal = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({});

    // Filter out variables that are already active (case insensitive)
    const availableVariables = variables.filter(v => 
        !activeVariables.some(active => active.toLowerCase() === v.toLowerCase())
    );

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;
            
            // Default: Bottom Placement
            let top: number | string = rect.bottom + 4;
            let bottom: number | string = 'auto';
            let maxHeight = Math.min(400, spaceBelow - 10);
            let transformOrigin = 'top left';

            // Flip to Top if constrained below
            if (spaceBelow < 200 && spaceAbove > spaceBelow) {
                top = 'auto';
                bottom = viewportHeight - rect.top + 4;
                maxHeight = Math.min(400, spaceAbove - 10);
                transformOrigin = 'bottom left';
            }

            // Constrain Width / Horizontal Position
            const left = rect.left;
            
            setStyle({
                position: 'fixed',
                top: top === 'auto' ? undefined : top,
                bottom: bottom === 'auto' ? undefined : bottom,
                left,
                maxHeight, // Applies to the root container
                minWidth: Math.max(220, rect.width),
                maxWidth: '300px',
                transformOrigin,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column'
            });
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
                const portal = document.getElementById('graph-axis-dropdown-portal');
                if (portal && !portal.contains(e.target as Node)) {
                    setIsOpen(false);
                }
            }
        };
        
        const handleScroll = (e: Event) => {
             const portal = document.getElementById('graph-axis-dropdown-portal');
             // If the scroll event target is inside the portal, do NOT close
             if (portal && e.target instanceof Node && portal.contains(e.target)) {
                 return;
             }
             if(isOpen) setIsOpen(false); 
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isOpen]);

    const renderDropdown = () => {
        if (!isOpen) return null;

        return createPortal(
            <div 
                id="graph-axis-dropdown-portal"
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-md animate-in fade-in zoom-in-95 duration-100 overflow-hidden"
                style={style}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {/* Fixed Header Section (Probes) */}
                {type === 'Y' && (
                    <div className="shrink-0 p-1 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex flex-col gap-0.5">
                            {onAddVoltageProbe && (
                                <button onClick={() => { onAddVoltageProbe(); setIsOpen(false); }} className="w-full text-left px-2 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded flex items-center gap-2 h-8">
                                    <Activity className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Add Voltage Probe</span>
                                </button>
                            )}
                            {onAddCurrentProbe && (
                                <button onClick={() => { onAddCurrentProbe(); setIsOpen(false); }} className="w-full text-left px-2 py-2 text-xs hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded flex items-center gap-2 h-8">
                                    <Zap className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Add Current Probe</span>
                                </button>
                            )}
                            {onAddComponentProbe && (
                                <button onClick={() => { onAddComponentProbe(); setIsOpen(false); }} className="w-full text-left px-2 py-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded flex items-center gap-2 h-8">
                                    <Microscope className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">Add from Component Detail...</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Flexible Scrollable Section (Variables) */}
                <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar flex flex-col">
                    {/* Sticky Header inside scroll view */}
                    {availableVariables.length > 0 && (
                        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase bg-white/95 dark:bg-gray-900/95 shrink-0 sticky top-0 backdrop-blur-sm z-10 border-b border-gray-100 dark:border-gray-800">
                            Available Variables
                        </div>
                    )}

                    {/* Wrapper for List Items */}
                    <div className="p-1 flex flex-col gap-0.5">
                        {availableVariables.map(v => (
                            <button
                                key={v}
                                onClick={() => { onSelectVariable && onSelectVariable(v); setIsOpen(false); }}
                                className={`w-full text-left px-2 py-1.5 text-xs rounded font-mono truncate hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors h-8 flex items-center
                                    ${type === 'X' && v === currentLabel ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}
                                `}
                                title={v}
                            >
                                {v}
                            </button>
                        ))}

                        {availableVariables.length === 0 && (
                            <div className="px-2 py-4 text-center text-xs text-gray-400 italic">
                                No other variables found.
                            </div>
                        )}
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center gap-1.5 rounded-md text-xs font-medium shadow-sm transition-colors border select-none
                    ${minimal ? 'p-1' : 'px-2 py-1.5'}
                    ${type === 'X' 
                        ? 'bg-blue-50/90 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/60' 
                        : 'bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                `}
                title={minimal ? "Add Trace" : undefined}
            >
                {type === 'Y' && <Plus className="w-3.5 h-3.5" />}
                {!minimal && <span className="font-mono">{currentLabel}</span>}
                {!minimal && <ChevronDown className="w-3 h-3 opacity-50" />}
            </button>
            {renderDropdown()}
        </>
    );
};
