
import React, { useState, useRef } from 'react';
import { Search, Cpu, Upload, X, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { COMPONENT_LIBRARY } from '../../constants';
import { ComponentCategory, ComponentDefinition } from '../../types';
import { useCircuit } from '../../context/CircuitContext';
import { Modal } from '../ui/Modal';
import { TabButton } from './TabButton';
import { ComponentListItem } from './ComponentListItem';
import { generateComponentFromDatasheet } from '../../app/actions/ai';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { addComponent, customDefinitions, registerComponent } = useCircuit();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ComponentCategory>(ComponentCategory.PRIMARY);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Upload State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [generatedComp, setGeneratedComp] = useState<ComponentDefinition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Merge static library with custom definitions
  const allComponents = [...COMPONENT_LIBRARY, ...customDefinitions];

  const filteredComponents = allComponents.filter(
    c => c.category === activeTab && 
    c.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsAnalyzing(true);
      setUploadError(null);
      setGeneratedComp(null);

      try {
          const formData = new FormData();
          formData.append('datasheet', file);
          
          const result = await generateComponentFromDatasheet(formData);
          
          if (result.success && result.component) {
              setGeneratedComp(result.component as ComponentDefinition);
          } else {
              setUploadError(result.error || "Failed to analyze datasheet");
          }
      } catch (err) {
          setUploadError("An unexpected error occurred");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleAddToLibrary = () => {
      if (generatedComp) {
          registerComponent(generatedComp);
          setIsUploadModalOpen(false);
          setActiveTab(ComponentCategory.REAL_WORLD);
          setGeneratedComp(null);
      }
  };

  return (
    <div 
        className={`bg-gray-50/50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full z-10 transition-all duration-300 overflow-hidden ${isOpen ? 'w-72' : 'w-0 border-r-0'}`}
    >
      <div className="w-72 flex flex-col h-full"> {/* Inner container fixed width to prevent content squash */}
        {/* Header */}
        <div className="px-4 py-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg shadow-sm">
                <Cpu className="text-white w-5 h-5" />
            </div>
            CircuitFlow
            </h1>
            <button 
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full md:hidden"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white dark:bg-gray-900 px-2 border-b border-gray-200 dark:border-gray-800">
            <TabButton 
            label="Basic" 
            isActive={activeTab === ComponentCategory.PRIMARY} 
            onClick={() => setActiveTab(ComponentCategory.PRIMARY)} 
            />
            <TabButton 
            label="Real World" 
            isActive={activeTab === ComponentCategory.REAL_WORLD} 
            onClick={() => setActiveTab(ComponentCategory.REAL_WORLD)} 
            />
        </div>

        {/* Search */}
        <div className="p-3 bg-gray-50/50 dark:bg-gray-850">
            <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
                type="text"
                placeholder="Search components..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
        </div>

        {/* Component Grid */}
        <div className="flex-1 overflow-y-auto p-3">
            {filteredComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-600 text-sm">
                <p>No components found</p>
                {activeTab === ComponentCategory.REAL_WORLD && (
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="mt-2 text-blue-500 hover:text-blue-600 underline"
                    >
                        Create from Datasheet?
                    </button>
                )}
            </div>
            ) : (
            <div className={`grid gap-2 ${activeTab === ComponentCategory.PRIMARY ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {filteredComponents.map(comp => (
                <ComponentListItem 
                    key={comp.type} 
                    comp={comp} 
                    onAdd={() => addComponent(comp.type, 150, 150)} 
                    viewMode={activeTab === ComponentCategory.PRIMARY ? 'grid' : 'list'}
                />
                ))}
            </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-gray-800 text-white py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors shadow-sm text-sm font-medium border border-transparent dark:border-gray-700"
            >
                <Upload className="w-4 h-4" />
                Import Datasheet
            </button>
        </div>

        <Modal 
            isOpen={isUploadModalOpen} 
            onClose={() => { setIsUploadModalOpen(false); setGeneratedComp(null); setUploadError(null); }}
            title="Import Datasheet (AI)"
        >
            <div className="text-center py-4">
                {!isAnalyzing && !generatedComp && (
                    <>
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                        >
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">Click to Upload Datasheet</p>
                            <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG supported</p>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".pdf,image/*" 
                            onChange={handleFileUpload} 
                        />
                    </>
                )}

                {isAnalyzing && (
                    <div className="py-8">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
                        <h4 className="font-medium text-gray-900 dark:text-white">Analyzing Datasheet...</h4>
                        <p className="text-sm text-gray-500 mt-1">Gemini is extracting pinouts and specs.</p>
                    </div>
                )}

                {generatedComp && (
                    <div className="text-left animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-4 justify-center">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">Component Generated!</span>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
                            <h5 className="font-bold text-gray-900 dark:text-white">{generatedComp.label}</h5>
                            <p className="text-xs text-gray-500 mt-1">{generatedComp.description}</p>
                            
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                                    <span className="block text-gray-400 uppercase text-[10px] font-bold">Pins</span>
                                    <span className="font-mono">{generatedComp.ports.length}</span>
                                </div>
                                <div className="bg-white dark:bg-gray-900 p-2 rounded border border-gray-200 dark:border-gray-700">
                                    <span className="block text-gray-400 uppercase text-[10px] font-bold">Symbol</span>
                                    <span className="capitalize">{generatedComp.symbol}</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleAddToLibrary}
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                        >
                            Add to Library
                        </button>
                    </div>
                )}

                {uploadError && (
                    <div className="py-4 text-red-500 text-sm">
                        <p className="font-medium">Error:</p>
                        <p>{uploadError}</p>
                        <button 
                            onClick={() => setUploadError(null)}
                            className="mt-2 text-blue-500 hover:underline"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </Modal>
      </div>
    </div>
  );
};
