
import React, { useState } from 'react';
import { Bot, Sparkles, X, Trash2, Info, Camera, Hammer, ShieldCheck } from 'lucide-react';
import { UsageInfoModal } from '../modals/UsageInfoModal';
import { captureCanvas } from '../../services/image/captureService';
import { useAgent } from '../../hooks/useAgent';

interface ChatHeaderProps {
    onClose: () => void;
    onClear: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose, onClear }) => {
    const { agentMode, setAgentMode } = useAgent();
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    const handleManualDebugCapture = async () => {
        if (isCapturing) return;
        setIsCapturing(true);
        const svg = document.querySelector('#canvas-container svg');
        if (svg) {
            try {
                const base64 = await captureCanvas(svg as SVGSVGElement);
                const link = document.createElement('a');
                link.href = base64;
                link.download = `debug_circuit_vision_${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (e: any) {
                console.error("Manual debug capture failed:", e);
                alert(`Capture failed: ${e.message || "Unknown error"}`);
            }
        } else {
            alert("Could not find circuit canvas. Ensure the canvas is visible.");
        }
        setIsCapturing(false);
    };

    const toggleMode = () => {
        setAgentMode(agentMode === 'builder' ? 'auditor' : 'builder');
    };

    return (
        <>
            <div className="bg-gradient-to-r from-violet-900 to-fuchsia-900 p-3 flex justify-between items-center text-white shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm border border-white/10">
                        <Bot className="w-4 h-4" />
                    </div>
                    
                    {/* Mode Switcher */}
                    <button 
                        onClick={toggleMode}
                        className="flex items-center bg-black/20 rounded-full p-0.5 border border-white/10 hover:bg-black/30 transition-colors"
                        title={`Current Mode: ${agentMode.toUpperCase()}. Click to switch.`}
                    >
                        <div className={`
                            flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all
                            ${agentMode === 'builder' ? 'bg-blue-500 text-white shadow-sm' : 'text-white/60 hover:text-white'}
                        `}>
                            <Hammer className="w-3 h-3" />
                            {agentMode === 'builder' && <span>Builder</span>}
                        </div>
                        <div className={`
                            flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all
                            ${agentMode === 'auditor' ? 'bg-emerald-500 text-white shadow-sm' : 'text-white/60 hover:text-white'}
                        `}>
                            <ShieldCheck className="w-3 h-3" />
                            {agentMode === 'auditor' && <span>Auditor</span>}
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-1">
                    <button 
                        onClick={handleManualDebugCapture} 
                        className={`p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white ${isCapturing ? 'animate-pulse opacity-50' : ''}`}
                        title="Debug Vision: Capture & Download Image"
                        disabled={isCapturing}
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setIsInfoOpen(true)} 
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white" 
                        title="Usage Limits & Info"
                    >
                        <Info className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onClear} 
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white" 
                        title="Clear Chat"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white/80 hover:text-white"
                        title="Close Panel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <UsageInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
        </>
    );
};
