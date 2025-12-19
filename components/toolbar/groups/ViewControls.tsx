
import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Moon, Sun, Camera, FileImage, Download, ChevronDown, BoxSelect } from 'lucide-react';
import { useCircuit } from '../../../context/CircuitContext';
import { captureCanvas, captureCanvasToSVG } from '../../../services/image/captureService';

export const ViewControls: React.FC = () => {
  const { zoomIn, zoomOut, isDarkMode, toggleTheme, canvasRef, showBoundingBoxes, setShowBoundingBoxes } = useCircuit();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Define colors for export based on theme
  const bgColor = isDarkMode ? '#111827' : '#ffffff';

  const handleCapturePNG = async () => {
      if (!canvasRef.current || isCapturing) return;
      setIsCapturing(true);
      setIsExportOpen(false);
      try {
          const base64 = await captureCanvas(canvasRef.current, bgColor);
          const link = document.createElement('a');
          link.href = base64;
          link.download = `circuit_snapshot_${Date.now()}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      } catch (e) {
          console.error("Capture PNG failed", e);
          alert("Failed to capture circuit image.");
      } finally {
          setIsCapturing(false);
      }
  };

  const handleCaptureSVG = async () => {
      if (!canvasRef.current || isCapturing) return;
      setIsCapturing(true);
      setIsExportOpen(false);
      try {
          const url = await captureCanvasToSVG(canvasRef.current, bgColor);
          const link = document.createElement('a');
          link.href = url;
          link.download = `circuit_diagram_${Date.now()}.svg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) {
          console.error("Capture SVG failed", e);
          alert("Failed to export circuit SVG.");
      } finally {
          setIsCapturing(false);
      }
  };

  return (
    <>
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 space-x-1 transition-colors">
          <button onClick={zoomOut} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow transition-all" title="Zoom Out">
              <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={zoomIn} className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow transition-all" title="Zoom In">
              <ZoomIn className="w-5 h-5" />
          </button>
      </div>
      
      <div className="h-8 w-px bg-gray-300 dark:bg-gray-700 mx-1" />

      {/* Export Dropdown */}
      <div className="relative" ref={exportRef}>
        <button 
            onClick={() => setIsExportOpen(!isExportOpen)}
            className={`flex items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all ${isCapturing ? 'opacity-50 cursor-wait' : ''} ${isExportOpen ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            title="Export Circuit"
            disabled={isCapturing}
        >
            <Download className="w-5 h-5" />
            <ChevronDown className="w-3 h-3" />
        </button>

        {isExportOpen && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button 
                    onClick={handleCapturePNG}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <Camera className="w-4 h-4 text-blue-500" />
                    <span>Download PNG</span>
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-800" />
                <button 
                    onClick={handleCaptureSVG}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <FileImage className="w-4 h-4 text-orange-500" />
                    <span>Download SVG</span>
                </button>
            </div>
        )}
      </div>

      <button 
        onClick={() => setShowBoundingBoxes(!showBoundingBoxes)} 
        className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${showBoundingBoxes ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 dark:text-gray-400'}`}
        title="Toggle Bounding Boxes"
      >
        <BoxSelect className="w-5 h-5" />
      </button>

      <button onClick={toggleTheme} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400" title="Toggle Theme">
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </>
  );
};
