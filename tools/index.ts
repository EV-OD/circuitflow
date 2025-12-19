
import { 
    addComponentTool, 
    deleteComponentTool, 
    connectComponentsTool, 
    getCircuitStateTool
} from './circuit';
import { rotateComponentTool, moveComponentTool } from './manipulation';
import { analyzeCircuitTool } from './simulation';
import { googleSearchTool } from './search';
import { captureCircuitTool } from './capture';
import { createLayoutGridTool } from './layout';
import { runElectricalAnalysisTool } from './analysis';
import { submitCircuitReportTool } from './reporting';
import { checkDesignRulesTool } from './design_check';

export const tools = [
    addComponentTool,
    deleteComponentTool,
    connectComponentsTool,
    rotateComponentTool,
    moveComponentTool,
    getCircuitStateTool,
    analyzeCircuitTool,
    googleSearchTool,
    captureCircuitTool,
    createLayoutGridTool,
    runElectricalAnalysisTool,
    checkDesignRulesTool,
    submitCircuitReportTool
];
