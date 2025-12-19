
import React, { useMemo } from 'react';
import { CircuitComponent, ComponentDefinition } from '../../../../types';
import { SimulationRunResult } from '../../../types';
import { generateComponentReport } from '../../../analyzers/ComponentReporter';
import { AlertTriangle, CheckCircle2, XCircle, Activity, Info } from 'lucide-react';
import { ComponentChat } from './ComponentChat';

interface ComponentAnalysisProps {
    component: CircuitComponent;
    definition: ComponentDefinition;
    customDefinitions: ComponentDefinition[];
    result: SimulationRunResult;
}

export const ComponentAnalysis: React.FC<ComponentAnalysisProps> = ({
    component,
    definition,
    customDefinitions,
    result
}) => {
    const report = useMemo(() => {
        return generateComponentReport(result, component.id, definition, customDefinitions);
    }, [result, component, definition, customDefinitions]);

    const statusCounts = {
        normal: report.metrics.filter(m => m.status === 'normal').length,
        warning: report.metrics.filter(m => m.status === 'warning').length,
        danger: report.metrics.filter(m => m.status === 'danger').length,
    };

    const overallStatus = statusCounts.danger > 0 ? 'danger' : statusCounts.warning > 0 ? 'warning' : 'normal';

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-gray-900/30">
            {/* Header Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            {component.designator || 'Component'}
                            <span className="text-base font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full font-mono">
                                {definition.label}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {definition.description || "No description available."}
                        </p>
                    </div>
                    <div className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium ${
                        overallStatus === 'danger' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        overallStatus === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                        {overallStatus === 'danger' && <XCircle className="w-5 h-5" />}
                        {overallStatus === 'warning' && <AlertTriangle className="w-5 h-5" />}
                        {overallStatus === 'normal' && <CheckCircle2 className="w-5 h-5" />}
                        {overallStatus === 'danger' ? 'Critical Issues' : overallStatus === 'warning' ? 'Warnings' : 'Operating Normally'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
                {/* Left Column: Metrics & Events */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Electrical Metrics</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {report.metrics.map((metric, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-4 rounded-xl border bg-white dark:bg-gray-800 shadow-sm transition-all hover:shadow-md ${
                                        metric.status === 'danger' ? 'border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-900/20' :
                                        metric.status === 'warning' ? 'border-amber-300 dark:border-amber-800' :
                                        'border-gray-200 dark:border-gray-700'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{metric.label}</span>
                                        {metric.status !== 'normal' && (
                                            <Activity className={`w-4 h-4 ${
                                                metric.status === 'danger' ? 'text-red-500' : 'text-amber-500'
                                            }`} />
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-bold font-mono ${
                                            metric.status === 'danger' ? 'text-red-600 dark:text-red-400' :
                                            metric.status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                                            'text-gray-900 dark:text-gray-100'
                                        }`}>
                                            {metric.value}
                                        </span>
                                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.unit}</span>
                                    </div>
                                    {metric.description && (
                                        <div className={`mt-3 text-xs px-2 py-1 rounded ${
                                            metric.status === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
                                            metric.status === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' :
                                            'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                                        }`}>
                                            {metric.description}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {report.metrics.length === 0 && (
                                <div className="col-span-full p-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm">
                                    No specific metrics available for this component type.
                                </div>
                            )}
                        </div>
                    </div>

                    {report.events.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Timing Events</h3>
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                                <div className="space-y-4">
                                    {report.events.map((event, i) => (
                                        <div key={i} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                                                {i < report.events.length - 1 && <div className="w-px h-full bg-gray-200 dark:bg-gray-700 my-1" />}
                                            </div>
                                            <div className="text-sm text-gray-700 dark:text-gray-300 pb-2">
                                                {event}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Chatbot (Sticky) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6"> 
                        <ComponentChat 
                            component={component} 
                            definition={definition} 
                            report={report} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
