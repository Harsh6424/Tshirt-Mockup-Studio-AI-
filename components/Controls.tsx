
import React from 'react';
import { Mockup, DesignState, DesignProperties } from '../types';

interface ControlsProps {
  onDesignUpload: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  onCenterDesign: (index: number) => void;
  onGenerate: () => void;
  onIntensityChange: (intensity: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  designs: (DesignState | null)[];
  isLoading: boolean;
  selectedMockup: Mockup | null;
  aiIntensity: string;
  onDesignChange: (index: number, newProps: Partial<DesignProperties>) => void;
  onSave: () => void;
  onLoad: () => void;
  isBlendPreviewActive: boolean;
  onBlendPreviewToggle: () => void;
  onBringForward: (index: number) => void;
  onSendBackward: (index: number) => void;
  onEditApiKey: () => void;
}

const UploadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const CenterIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 18h18" />
    </svg>
);

const MagicIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.8 2.8a1 1 0 011.4 0l1.2 1.2a1 1 0 001.4 0l1.2-1.2a1 1 0 011.4 0l1.2 1.2a1 1 0 001.4 0l1.2-1.2a1 1 0 011.4 0l2.4 2.4a1 1 0 010 1.4l-1.2 1.2a1 1 0 000 1.4l1.2 1.2a1 1 0 010 1.4l-2.4 2.4a1 1 0 01-1.4 0l-1.2-1.2a1 1 0 00-1.4 0l-1.2 1.2a1 1 0 01-1.4 0l-1.2-1.2a1 1 0 00-1.4 0l-1.2 1.2a1 1 0 01-1.4 0L2.8 9.8a1 1 0 010-1.4l1.2-1.2a1 1 0 000-1.4L2.8 5.6a1 1 0 010-1.4l2.4-2.4a1 1 0 011.4 0l1.2 1.2a1 1 0 001.4 0l1.2-1.2z" />
    </svg>
);

const UndoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4l4 4" />
    </svg>
);

const RedoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
       <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m18-10l-4-4m4 4l-4 4" />
    </svg>
);

const SaveIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} viewBox="0 0 20 20" fill="currentColor">
      <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
    </svg>
);

const LoadIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);

const BlendIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1v11z" />
        <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
);

const LayerForwardIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);
  
const LayerBackwardIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5l-9 18 9-2 9 2-9-18zm0 0v8" />
    </svg>
);

const ResetIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0l3.181-3.183m-4.991-2.695a8.25 8.25 0 00-11.664 0l-3.181 3.183" />
    </svg>
);

const KeyIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.623 5.91l-4.63 4.63a2.121 2.121 0 01-3-3l4.63-4.63A6 6 0 0117 9z" />
    </svg>
);


const Controls: React.FC<ControlsProps> = ({ 
    onDesignUpload, 
    onCenterDesign, 
    onGenerate, 
    onIntensityChange, 
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    designs, 
    isLoading, 
    selectedMockup, 
    aiIntensity,
    onDesignChange,
    onSave,
    onLoad,
    isBlendPreviewActive,
    onBlendPreviewToggle,
    onBringForward,
    onSendBackward,
    onEditApiKey,
}) => {
  const designAreas = selectedMockup?.designAreas || 1;
  const designLabels = ['Front Design', 'Back Design'];
  const loadedDesigns = designs.map(d => !!d);
  const isAnyDesignLoaded = loadedDesigns.some(loaded => loaded);
  const loadedDesignsCount = loadedDesigns.filter(Boolean).length;
  
  const intensityLevels = ['Low', 'Medium', 'High'];
  
  const primaryButtonClass = "w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105";
  const secondaryButtonClass = "w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200";
  const iconButtonClass = "p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-100 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110";

  const ControlCard: React.FC<{title: string, children: React.ReactNode, className?: string}> = ({ title, children, className }) => (
    <div className={`bg-white/60 backdrop-blur-lg p-4 rounded-xl border border-gray-200/80 shadow-sm fade-in-up ${className}`}>
      <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
  
  return (
    <aside className="w-80 bg-gray-50/50 backdrop-blur-lg p-4 border-l border-gray-200/80 flex flex-col">
      <div className="flex-grow overflow-y-auto space-y-4 pr-2 -mr-2">
        {Array.from({ length: designAreas }).map((_, index) => (
          <ControlCard key={index} title={designAreas > 1 ? designLabels[index] : 'Design'}>
            <label htmlFor={`design-upload-${index}`} className={secondaryButtonClass + ' cursor-pointer'}>
              <UploadIcon />
              Upload Design
            </label>
            <input id={`design-upload-${index}`} type="file" accept="image/png, image/jpeg" className="hidden" onChange={(e) => onDesignUpload(e, index)} />
          
            {loadedDesigns[index] && (
              <>
                <div className="flex space-x-2">
                  <button onClick={() => onCenterDesign(index)} className={secondaryButtonClass} title="Center Align">
                    <CenterIcon /> Center
                  </button>
                   {loadedDesignsCount > 1 && (
                      <>
                          <button onClick={() => onBringForward(index)} disabled={index === designAreas - 1} className={iconButtonClass} title="Bring Forward">
                              <LayerForwardIcon />
                          </button>
                           <button onClick={() => onSendBackward(index)} disabled={index === 0} className={iconButtonClass} title="Send Backward">
                              <LayerBackwardIcon />
                          </button>
                      </>
                  )}
                </div>
                <div>
                    <label htmlFor={`opacity-slider-${index}`} className="block text-sm font-medium text-gray-600 mb-2">Opacity</label>
                    <input
                        id={`opacity-slider-${index}`}
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={designs[index]?.props.opacity || 1}
                        onChange={(e) => onDesignChange(index, { opacity: parseFloat(e.target.value)})}
                    />
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-2">
                        <label htmlFor={`rotation-slider-${index}`} className="block text-sm font-medium text-gray-600">Rotation</label>
                        <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{designs[index]?.props.rotation || 0}°</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            id={`rotation-slider-${index}`}
                            type="range"
                            min="-180"
                            max="180"
                            step="1"
                            value={designs[index]?.props.rotation || 0}
                            onChange={(e) => onDesignChange(index, { rotation: parseFloat(e.target.value)})}
                        />
                        <button onClick={() => onDesignChange(index, { rotation: 0 })} className={iconButtonClass} title="Reset Rotation">
                            <ResetIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
              </>
            )}
          </ControlCard>
        ))}
        {isAnyDesignLoaded && (
            <>
                <ControlCard title="Live Preview" className="animate-delay-100">
                     <button
                        onClick={onBlendPreviewToggle}
                        className={secondaryButtonClass}
                    >
                        <BlendIcon />
                        {isBlendPreviewActive ? 'Hide Blend' : 'Show Blend'}
                    </button>
                </ControlCard>
                
                <ControlCard title="Project & History" className="animate-delay-200">
                    <div className="grid grid-cols-2 gap-2">
                         <button onClick={onSave} className={secondaryButtonClass}>
                           <SaveIcon /> Save
                        </button>
                         <button onClick={onLoad} className={secondaryButtonClass}>
                           <LoadIcon /> Load
                        </button>
                    </div>
                    <button onClick={onEditApiKey} className={secondaryButtonClass}>
                        <KeyIcon /> Change API Key
                    </button>
                     <div className="flex items-center justify-center space-x-2">
                        <button onClick={onUndo} disabled={!canUndo} className={iconButtonClass + " flex-1"} aria-label="Undo" title="Undo">
                            <UndoIcon />
                        </button>
                        <button onClick={onRedo} disabled={!canRedo} className={iconButtonClass + " flex-1"} aria-label="Redo" title="Redo">
                            <RedoIcon />
                        </button>
                    </div>
                </ControlCard>

                <ControlCard title="AI Settings" className="animate-delay-300">
                    <div>
                      <label htmlFor="intensity-slider" className="block text-sm font-medium text-gray-600 mb-2">
                          Effect Intensity: <span className="font-bold text-indigo-600">{aiIntensity}</span>
                      </label>
                      <input 
                          id="intensity-slider"
                          type="range"
                          min="0"
                          max="2"
                          step="1"
                          value={intensityLevels.findIndex(level => level === aiIntensity)}
                          onChange={(e) => onIntensityChange(intensityLevels[parseInt(e.target.value)])}
                          aria-label="AI effect intensity"
                      />
                    </div>
                </ControlCard>
            </>
        )}
      </div>
      <div className="pt-4 mt-4 border-t border-gray-200/80">
       {isAnyDesignLoaded && (
          <button 
            onClick={onGenerate} 
            disabled={isLoading}
            className={primaryButtonClass}
          >
            <MagicIcon />
            {isLoading ? 'Generating...' : 'Attach with AI'}
          </button>
       )}
       </div>
    </aside>
  );
};

export default Controls;