
import React from 'react';
import { captureCanvas } from '../../../services/image/captureService';

export const handleCaptureCircuit = async (canvasRef: React.RefObject<SVGSVGElement>) => {
    if (!canvasRef.current) {
        return { error: "Canvas element not found. Please ensure the circuit board is visible." };
    }

    try {
        const base64Image = await captureCanvas(canvasRef.current);
        // We return the base64 string in a special property `_imageData` which `useAgentCore` 
        // will look for to inject into the multimodal context.
        return { 
            message: "Circuit snapshot captured successfully.",
            _imageData: base64Image.split(',')[1] // Remove data:image/png;base64, prefix for API
        };
    } catch (e: any) {
        console.error("Capture failed:", e);
        return { error: `Failed to capture circuit image: ${e.message || "Unknown error"}` };
    }
};
