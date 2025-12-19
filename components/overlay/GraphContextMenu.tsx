
import React, { useRef, useEffect } from 'react';
import { SplitSquareHorizontal, SplitSquareVertical, Trash2, XCircle } from 'lucide-react';

interface GraphContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onSplitHorizontal: () => void;
    onSplitVertical: () => void;
    onClear: () => void;
    onDelete: () => void;
}

export const GraphContextMenu: React.FC<GraphContextMenuProps> = ({
    x, y, onClose, onSplitHorizontal, onSplitVertical, onClear, onDelete
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [onClose]);

    return (
        <div 
            ref={menuRef}
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-md py-1 w-48 text-sm"
            style={{ left: x, top: y }}
        >
            <button 
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                onClick={onSplitHorizontal}
            >
                <SplitSquareVertical className="w-4 h-4" />
                Split Horizontal
            </button>
            <button 
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                onClick={onSplitVertical}
            >
                <SplitSquareHorizontal className="w-4 h-4" />
                Split Vertical
            </button>
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
            <button 
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                onClick={onClear}
            >
                <Trash2 className="w-4 h-4" />
                Clear Data
            </button>
            <button 
                className="w-full text-left px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                onClick={onDelete}
            >
                <XCircle className="w-4 h-4" />
                Delete Pane
            </button>
        </div>
    );
};
