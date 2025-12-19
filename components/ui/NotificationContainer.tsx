
import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useCircuit } from '../../context/CircuitContext';

export const NotificationContainer: React.FC = () => {
    const { notifications } = useCircuit();

    if (notifications.length === 0) return null;

    return (
        <div className="absolute bottom-20 left-4 z-50 flex flex-col gap-2 pointer-events-none">
            {notifications.map((n) => (
                <div 
                    key={n.uniqueId} 
                    className={`
                        animate-in slide-in-from-left-5 fade-in duration-300 
                        max-w-xs p-3 rounded-lg shadow-lg border backdrop-blur-md
                        flex items-start gap-3 pointer-events-auto
                        ${n.severity === 'error' ? 'bg-red-50/90 dark:bg-red-900/80 border-red-200 dark:border-red-800 text-red-800 dark:text-red-100' : 
                          n.severity === 'warning' ? 'bg-amber-50/90 dark:bg-amber-900/80 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-100' :
                          'bg-blue-50/90 dark:bg-blue-900/80 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-100'}
                    `}
                >
                    <div className="shrink-0 mt-0.5">
                        {n.severity === 'error' && <AlertCircle className="w-4 h-4" />}
                        {n.severity === 'warning' && <AlertTriangle className="w-4 h-4" />}
                        {n.severity === 'info' && <Info className="w-4 h-4" />}
                    </div>
                    <div>
                        <div className="font-bold text-xs uppercase opacity-80">{n.rule}</div>
                        <div className="text-xs font-medium leading-tight">{n.message}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};
