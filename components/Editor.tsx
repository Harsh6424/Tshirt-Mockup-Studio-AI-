import React from 'react';
// We are assuming react-rnd is available in the environment.
// In a real project, you would `npm install react-rnd @types/react-rnd`.
import { Rnd } from 'react-rnd';
import { Mockup, DesignProperties, DesignState } from '../types';
import { MAX_EDITOR_SIZE } from '../constants';

interface EditorProps {
  selectedMockup: Mockup | null;
  designs: (DesignState | null)[];
  onDesignChange: (index: number, props: Partial<DesignProperties>) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

const Editor: React.FC<EditorProps> = ({ 
    selectedMockup, 
    designs, 
    onDesignChange, 
    editorRef,
}) => {

  return (
    <div 
        ref={editorRef} 
        className="relative shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-200/50 transform transition-all duration-500 w-full aspect-square" 
        style={{ maxWidth: MAX_EDITOR_SIZE, isolation: 'isolate' }}
    >
      {selectedMockup ? (
        <div className="relative w-full h-full">
            <img src={selectedMockup.imageUrl} alt={selectedMockup.name} className="w-full h-full object-contain" />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-50/50">
          <p className="text-center font-semibold text-lg p-4">Select a T-shirt mockup to begin</p>
        </div>
      )}
      {selectedMockup && designs.map((design, index) => {
        if (!design) return null;
        return (
            <Rnd
                key={index}
                size={{ width: design.props.width, height: design.props.height }}
                position={{ x: design.props.x, y: design.props.y }}
                onDragStop={(e, d) => {
                    onDesignChange(index, { x: d.x, y: d.y });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                    onDesignChange(index, {
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height),
                        ...position,
                    });
                }}
                bounds="parent"
                lockAspectRatio
                className="flex items-center justify-center border-2 border-dashed border-indigo-500/80 bg-white/10 rounded-sm"
            >
                <img 
                    src={design.image} 
                    alt={`Design ${index + 1}`} 
                    className="w-full h-full pointer-events-none" 
                    style={{ 
                        opacity: design.props.opacity,
                        transform: `rotate(${design.props.rotation || 0}deg)`,
                    }}
                />
            </Rnd>
        )
      })}
    </div>
  );
};

export default Editor;