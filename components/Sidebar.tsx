import React from 'react';
import { Mockup } from '../types';

interface SidebarProps {
  mockups: Mockup[];
  selectedMockupId: string | null;
  onSelectMockup: (mockup: Mockup) => void;
  onMockupUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);


const Sidebar: React.FC<SidebarProps> = ({ 
    mockups, 
    selectedMockupId, 
    onSelectMockup, 
    onMockupUpload
}) => {
  return (
    <aside className="w-80 bg-white/80 backdrop-blur-lg p-4 flex flex-col border-r border-gray-200/80">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 px-2">Mockups</h2>
      
      <div className="px-2 mb-4">
        <label htmlFor="mockup-upload" className="group w-full inline-flex items-center justify-center px-4 py-2.5 border-2 border-dashed border-gray-300 text-sm font-medium rounded-xl text-gray-600 bg-transparent hover:border-indigo-500 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-300">
            <UploadIcon />
            Upload Mockup
        </label>
        <input id="mockup-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={onMockupUpload} />
      </div>

      <div className="space-y-2 flex-grow overflow-y-auto pr-2 -mr-2">
        {mockups.map((mockup) => (
          <div
            key={mockup.id}
            onClick={() => onSelectMockup(mockup)}
            className={`cursor-pointer p-2.5 rounded-xl flex items-center space-x-4 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md ${
              selectedMockupId === mockup.id
                ? 'bg-indigo-600 shadow-lg'
                : 'hover:bg-indigo-50'
            }`}
            aria-selected={selectedMockupId === mockup.id}
            role="option"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && onSelectMockup(mockup)}
          >
            <img src={mockup.imageUrl} alt={mockup.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border-2 border-white/50 shadow-sm" />
            <span className={`text-sm break-words ${selectedMockupId === mockup.id ? 'text-white font-semibold' : 'text-gray-700 font-medium'}`}>
              {mockup.name}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;