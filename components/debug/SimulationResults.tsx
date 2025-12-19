
import React from 'react';
import { SimulationData } from '../../types';

interface SimulationResultsProps {
  data: SimulationData | null;
  compact?: boolean;
}

export const SimulationResults: React.FC<SimulationResultsProps> = ({ data, compact = false }) => {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p>No simulation data available.</p>
        <p className="text-xs mt-2">Run a simulation to generate results.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header Info */}
      {!compact && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{data.title}</h4>
            <div className="flex gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400 font-mono">
            <span>Type: {data.analysisType}</span>
            <span>Points: {data.data.length}</span>
            <span>Variables: {data.variables.length}</span>
            </div>
        </div>
      )}

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 w-20 text-center">
                #
              </th>
              {data.variables.map((v, i) => (
                <th key={i} className="p-3 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 border-l border-gray-200 dark:border-gray-700 font-mono">
                  {v}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-xs">
            {data.data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <td className="p-2 text-center text-gray-400 dark:text-gray-600 border-r border-gray-100 dark:border-gray-800">
                    {rowIndex}
                </td>
                {row.map((val, colIndex) => (
                  <td key={colIndex} className="p-2 text-gray-800 dark:text-gray-300 border-r border-gray-100 dark:border-gray-800">
                    {val.toExponential(4)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
