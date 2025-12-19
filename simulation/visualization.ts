
import { SimulationRunResult, GraphImageOptions } from './types';
import { getTableData } from './analysis';

export const generateGraphImage = (
    result: SimulationRunResult,
    xAxisVar: string,
    yAxisVars: string[],
    options: GraphImageOptions
): string => {
    const table = getTableData(result, xAxisVar, yAxisVars);
    if (!table || table.rows.length === 0) return '';

    const canvas = document.createElement('canvas');
    canvas.width = options.width;
    canvas.height = options.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Styles
    const padding = 40;
    const graphWidth = options.width - padding * 2;
    const graphHeight = options.height - padding * 2;
    
    // Background
    ctx.fillStyle = options.bgColor || '#ffffff';
    ctx.fillRect(0, 0, options.width, options.height);

    // Find Scales
    const xValues = table.rows.map(r => r[0]);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const xRange = xMax - xMin || 1;

    // Determine Global Y Min/Max across all series
    let yMin = Infinity;
    let yMax = -Infinity;
    
    // Table structure: [x, y1, y2, ...]
    for (let i = 0; i < table.rows.length; i++) {
        for (let j = 1; j < table.rows[i].length; j++) {
            const val = table.rows[i][j];
            if (!isNaN(val)) {
                yMin = Math.min(yMin, val);
                yMax = Math.max(yMax, val);
            }
        }
    }
    
    // Add padding to Y range
    const yRangePadding = (yMax - yMin) * 0.1 || 1;
    yMin -= yRangePadding;
    yMax += yRangePadding;
    const yRange = yMax - yMin;

    const mapX = (val: number) => padding + ((val - xMin) / xRange) * graphWidth;
    const mapY = (val: number) => (options.height - padding) - ((val - yMin) / yRange) * graphHeight;

    // Draw Axes
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    // Y Axis
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, options.height - padding);
    // X Axis
    ctx.lineTo(options.width - padding, options.height - padding);
    ctx.stroke();

    // Draw Lines
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#9333ea'];
    
    yAxisVars.forEach((_, index) => {
        ctx.beginPath();
        ctx.strokeStyle = colors[index % colors.length];
        ctx.lineWidth = 2;
        
        let first = true;
        for (let i = 0; i < table.rows.length; i++) {
            const x = table.rows[i][0];
            const y = table.rows[i][index + 1];
            
            if (isNaN(y)) continue;

            const cx = mapX(x);
            const cy = mapY(y);

            if (first) {
                ctx.moveTo(cx, cy);
                first = false;
            } else {
                ctx.lineTo(cx, cy);
            }
        }
        ctx.stroke();
    });

    // Simple Labels
    ctx.fillStyle = '#000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(xAxisVar, options.width / 2, options.height - 10);
    
    ctx.save();
    ctx.translate(10, options.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Amplitude', 0, 0);
    ctx.restore();

    // Title
    if (options.title) {
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(options.title, options.width / 2, 20);
    }

    return canvas.toDataURL('image/png');
};
