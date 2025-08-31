import React, { useState, useCallback, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Controls from './components/Controls';
import ResultDisplay from './components/ResultDisplay';
import ApiKeyModal from './components/ApiKeyModal';
import { Mockup, DesignProperties, DesignState } from './types';
import { attachDesignToMockup } from './services/geminiService';
import { TSHIRT_MOCKUPS, MAX_EDITOR_SIZE } from './constants';

const createCompositeImage = (mockup: Mockup, designs: (DesignState | null)[], editorSize: { width: number; height: number; }): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error("Could not create canvas context."));
        }

        const baseImage = new Image();
        baseImage.crossOrigin = "anonymous";
        baseImage.src = mockup.imageUrl;

        baseImage.onload = () => {
            canvas.width = baseImage.width;
            canvas.height = baseImage.height;
            ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

            const validDesigns = designs.filter((d): d is DesignState => d !== null);
            if (validDesigns.length === 0) {
                 // Still resolve with the base image
                return resolve(canvas.toDataURL('image/png').split(',')[1]);
            }

            const designImagePromises = designs.map(design => 
                new Promise<HTMLImageElement | null>((resolveImg, rejectImg) => {
                    if (!design) return resolveImg(null); // Resolve with null for empty slots
                    const img = new Image();
                    img.src = design.image;
                    img.onload = () => resolveImg(img);
                    img.onerror = () => rejectImg(new Error("Failed to load a design image for processing."));
                })
            );

            Promise.all(designImagePromises).then(loadedImages => {
                const mockupAspectRatio = baseImage.width / baseImage.height;
                const editorAspectRatio = editorSize.width / editorSize.height;

                let displayedWidth, displayedHeight, offsetX, offsetY;
                if (mockupAspectRatio > editorAspectRatio) {
                    displayedWidth = editorSize.width;
                    displayedHeight = editorSize.width / mockupAspectRatio;
                    offsetX = 0;
                    offsetY = (editorSize.height - displayedHeight) / 2;
                } else {
                    displayedWidth = editorSize.height * mockupAspectRatio;
                    displayedHeight = editorSize.height;
                    offsetX = (editorSize.width - displayedWidth) / 2;
                    offsetY = 0;
                }
                
                const scale = baseImage.width / displayedWidth;

                loadedImages.forEach((designImg, index) => {
                    if (!designImg) return; // Skip empty slots
                    const designProps = designs[index]!.props;
                    const relativeX = designProps.x - offsetX;
                    const relativeY = designProps.y - offsetY;
                    
                    ctx.save();
                    
                    ctx.globalAlpha = designProps.opacity;

                    const canvasX = relativeX * scale;
                    const canvasY = relativeY * scale;
                    const canvasWidth = designProps.width * scale;
                    const canvasHeight = designProps.height * scale;
                    const centerX = canvasX + canvasWidth / 2;
                    const centerY = canvasY + canvasHeight / 2;

                    ctx.translate(centerX, centerY);
                    ctx.rotate((designProps.rotation || 0) * Math.PI / 180);
                    ctx.drawImage(
                        designImg,
                        -canvasWidth / 2,
                        -canvasHeight / 2,
                        canvasWidth,
                        canvasHeight
                    );
                    
                    ctx.restore();
                });

                const compositeImageBase64 = canvas.toDataURL('image/png').split(',')[1];
                resolve(compositeImageBase64);

            }).catch(reject);
        };
        baseImage.onerror = () => reject(new Error(`Failed to load mockup image for processing: ${mockup.name}`));
    });
};

const applySharpenFilter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const outputData = new Uint8ClampedArray(data);

    // Sharpening convolution kernel
    const kernel = [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ];
    const kernelSize = 3;
    const halfKernel = Math.floor(kernelSize / 2);

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let r = 0, g = 0, b = 0;

            for (let ky = 0; ky < kernelSize; ky++) {
                for (let kx = 0; kx < kernelSize; kx++) {
                    const px = x + kx - halfKernel;
                    const py = y + ky - halfKernel;
                    const idx = (py * width + px) * 4;
                    const weight = kernel[ky][kx];

                    r += data[idx] * weight;
                    g += data[idx + 1] * weight;
                    b += data[idx + 2] * weight;
                }
            }

            const outputIdx = (y * width + x) * 4;
            outputData[outputIdx] = r;
            outputData[outputIdx + 1] = g;
            outputData[outputIdx + 2] = b;
            outputData[outputIdx + 3] = data[outputIdx + 3];
        }
    }
    
    const newImageData = new ImageData(outputData, width, height);
    ctx.putImageData(newImageData, 0, 0);
};

const upscaleImageClientSide = (base64Image: string, scaleFactor: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context for upscaling.'));
      }
      
      const newWidth = img.width * scaleFactor;
      const newHeight = img.height * scaleFactor;

      canvas.width = newWidth;
      canvas.height = newHeight;

      // Use high-quality interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the scaled image
      ctx.drawImage(img, 0, 0, newWidth, newHeight); 

      // Apply sharpening filter to enhance details
      try {
        applySharpenFilter(ctx, newWidth, newHeight);
      } catch (e) {
        console.error("Failed to apply sharpen filter, returning unsharpened image.", e);
      }

      const mimeType = base64Image.match(/data:(image\/[a-zA-Z]+);base64,/)?.[1] || 'image/png';
      
      resolve(canvas.toDataURL(mimeType));
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for client-side upscaling.'));
    };
    img.src = base64Image;
  });
};

const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const UploadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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

const MagicIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5 mr-2"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.8 2.8a1 1 0 011.4 0l1.2 1.2a1 1 0 001.4 0l1.2-1.2a1 1 0 011.4 0l1.2 1.2a1 1 0 001.4 0l1.2-1.2a1 1 0 011.4 0l2.4 2.4a1 1 0 010 1.4l-1.2 1.2a1 1 0 000 1.4l1.2 1.2a1 1 0 010 1.4l-2.4 2.4a1 1 0 01-1.4 0l-1.2-1.2a1 1 0 00-1.4 0l-1.2 1.2a1 1 0 01-1.4 0l-1.2-1.2a1 1 0 00-1.4 0l-1.2 1.2a1 1 0 01-1.4 0L2.8 9.8a1 1 0 010-1.4l1.2-1.2a1 1 0 000-1.4L2.8 5.6a1 1 0 010-1.4l2.4-2.4a1 1 0 011.4 0l1.2 1.2a1 1 0 001.4 0l1.2-1.2z" />
    </svg>
);


const App: React.FC = () => {
  const [mockups, setMockups] = useState<Mockup[]>(TSHIRT_MOCKUPS);
  const [selectedMockup, setSelectedMockup] = useState<Mockup | null>(null);
  const [designs, setDesigns] = useState<(DesignState | null)[]>([null]);
  const [history, setHistory] = useState<(DesignState | null)[][]>([[null]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUpscaling, setIsUpscaling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [aiIntensity, setAiIntensity] = useState<string>('Medium');
  
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini-api-key');
    if (savedKey) {
        setApiKey(savedKey);
    } else {
        setIsApiKeyModalOpen(true);
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini-api-key', key);
    setIsApiKeyModalOpen(false);
  };

  const pushHistory = (newDesigns: (DesignState | null)[]) => {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newDesigns);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setDesigns(newDesigns);
  };

  const handleMockupSelect = useCallback((mockup: Mockup) => {
    setSelectedMockup(mockup);
    const initialDesigns = new Array(mockup.designAreas || 1).fill(null);
    setDesigns(initialDesigns);
    setHistory([initialDesigns]);
    setHistoryIndex(0);
    setGeneratedImage(null);
    setError(null);
  }, []);
  
  const handleMockupUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const newMockup: Mockup = {
          id: `custom-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, "") || 'Custom Mockup',
          imageUrl: result,
          designAreas: 1, // Custom mockups default to 1 design area
        };
        setMockups(prevMockups => [newMockup, ...prevMockups]);
        handleMockupSelect(newMockup);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }, [handleMockupSelect]);

  const handleDesignUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
            const editorWidth = editorRef.current?.clientWidth || MAX_EDITOR_SIZE;
            const aspectRatio = img.width / img.height;
            const maxDimension = editorWidth * 0.5;

            let newWidth, newHeight;
            if (aspectRatio > 1) {
                newWidth = maxDimension;
                newHeight = newWidth / aspectRatio;
            } else {
                newHeight = maxDimension;
                newWidth = newHeight * aspectRatio;
            }

            const newDesign: DesignState = {
                image: result,
                props: {
                    width: newWidth,
                    height: newHeight,
                    x: (editorWidth - newWidth) / 2,
                    y: (editorWidth - newHeight) / 2,
                    opacity: 1,
                    rotation: 0,
                }
            };
            
            const updatedDesigns = [...designs];
            updatedDesigns[index] = newDesign;
            pushHistory(updatedDesigns);

            setGeneratedImage(null);
            setError(null);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
     event.target.value = '';
  }, [designs, history, historyIndex]);

  const handleDesignChange = useCallback((index: number, newProps: Partial<DesignProperties>) => {
      const updatedDesigns = [...designs];
      const currentDesign = updatedDesigns[index];
      if (currentDesign) {
          updatedDesigns[index] = { 
              ...currentDesign, 
              props: { ...currentDesign.props, ...newProps }
            };
      }
      pushHistory(updatedDesigns);
  }, [designs, history, historyIndex]);
  
  const handleCenterDesign = useCallback((index: number) => {
    if (!editorRef.current) return;
    const editorRect = editorRef.current.getBoundingClientRect();

    const currentDesign = designs[index];
    if (currentDesign) {
        handleDesignChange(index, {
            x: (editorRect.width - currentDesign.props.width) / 2,
            y: (editorRect.height - currentDesign.props.height) / 2,
        });
    }
  }, [designs, handleDesignChange]);

  const handleBringForward = useCallback((index: number) => {
    if (index < designs.length - 1) {
        const updatedDesigns = [...designs];
        [updatedDesigns[index], updatedDesigns[index + 1]] = [updatedDesigns[index + 1], updatedDesigns[index]];
        pushHistory(updatedDesigns);
    }
  }, [designs, history, historyIndex]);

  const handleSendBackward = useCallback((index: number) => {
      if (index > 0) {
          const updatedDesigns = [...designs];
          [updatedDesigns[index], updatedDesigns[index - 1]] = [updatedDesigns[index - 1], updatedDesigns[index]];
          pushHistory(updatedDesigns);
      }
  }, [designs, history, historyIndex]);

  const handleIntensityChange = (intensity: string) => setAiIntensity(intensity);
  
  const handleUndo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setDesigns(history[newIndex]);
    }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setDesigns(history[newIndex]);
      }
  };

    const handleSave = () => {
        if (!selectedMockup) {
            alert("Please select a mockup to save.");
            return;
        }
        const stateToSave = {
            selectedMockupId: selectedMockup.id,
            designs,
        };
        localStorage.setItem('tshirtMockupState', JSON.stringify(stateToSave));
        alert("Design saved successfully!");
    };

    const handleLoad = () => {
        const savedStateJSON = localStorage.getItem('tshirtMockupState');
        if (savedStateJSON) {
            try {
                const savedState = JSON.parse(savedStateJSON);
                const mockup = mockups.find(m => m.id === savedState.selectedMockupId);
                if (mockup) {
                    setSelectedMockup(mockup);
                    const loadedDesigns = savedState.designs.map((d: DesignState | null) => {
                        if (!d) return null;
                        return { ...d, props: { ...d.props, opacity: d.props.opacity ?? 1, rotation: d.props.rotation ?? 0 }};
                    });
                    setDesigns(loadedDesigns);
                    setHistory([loadedDesigns]);
                    setHistoryIndex(0);
                    setGeneratedImage(null);
                    setError(null);
                    alert("Design loaded successfully!");
                } else {
                    alert("Could not find the saved mockup. It may have been removed.");
                }
            } catch (e) {
                alert("Failed to load saved design. The data may be corrupt.");
                localStorage.removeItem('tshirtMockupState');
            }
        } else {
            alert("No saved design found.");
        }
    };

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError("API key not set. Please set your Gemini API key.");
      setIsApiKeyModalOpen(true);
      return;
    }
    if (!selectedMockup) {
      setError("Please select a mockup first.");
      return;
    }
    const isAnyDesignLoaded = designs.some(d => d !== null);
    if (!isAnyDesignLoaded) {
      setError("Please upload at least one design.");
      return;
    }
    if (!editorRef.current) {
        setError("Editor is not available.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const editorRect = editorRef.current.getBoundingClientRect();
      const compositeImageBase64 = await createCompositeImage(selectedMockup, designs, { width: editorRect.width, height: editorRect.height });
      const compositeImageMimeType = 'image/png';

      const resultBase64 = await attachDesignToMockup(compositeImageBase64, compositeImageMimeType, aiIntensity, apiKey);
      
      setGeneratedImage(`data:image/png;base64,${resultBase64}`);

    } catch (e: any) {
      const errorMessage = e.message || `Failed to generate mockup for "${selectedMockup.name}".`;
      setError(errorMessage);
      console.error(`Generation failed for ${selectedMockup.name}:`, e);
    }

    setIsLoading(false);
  }, [selectedMockup, designs, aiIntensity, apiKey]);
  
  const handleUpscale = useCallback(async () => {
    if (!generatedImage) {
      setError("There is no generated image to upscale.");
      return;
    }

    setIsUpscaling(true);
    setError(null);

    try {
      const upscaledDataUrl = await upscaleImageClientSide(generatedImage, 2);
      setGeneratedImage(upscaledDataUrl);
    } catch (e: any) {
      const errorMessage = e.message || `Failed to upscale the image.`;
      setError(errorMessage);
      console.error(`Client-side upscaling failed:`, e);
    }
    
    setIsUpscaling(false);
  }, [generatedImage]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const isAnyDesignLoaded = designs.some(d => d !== null);

  const closeAllPanels = () => {
    setIsSidebarOpen(false);
    setIsControlsOpen(false);
  }

  return (
    <>
      {isApiKeyModalOpen && <ApiKeyModal onSave={handleSaveApiKey} initialApiKey={apiKey || ''} />}
      <div className="h-screen w-screen flex flex-col text-gray-900 overflow-hidden bg-gradient-to-br from-gray-50 to-indigo-50">
        <header className="bg-white/60 backdrop-blur-lg border-b border-gray-200/80 z-20 flex-shrink-0">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                <div className="w-10">
                    <button 
                        onClick={() => setIsSidebarOpen(true)} 
                        className="lg:hidden p-2 -ml-2 rounded-full text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Open mockups panel"
                    >
                        <MenuIcon />
                    </button>
                </div>
                <div className="flex-1 text-center lg:text-left">
                    <span className="font-extrabold text-xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">AI Mockup Studio</span>
                </div>
                 <div className="w-10 flex justify-end">
                    <button 
                        onClick={() => setIsControlsOpen(true)} 
                        className="lg:hidden p-2 -mr-2 rounded-full text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        aria-label="Open controls panel"
                    >
                        <SettingsIcon />
                    </button>
                </div>
            </div>
        </header>

        <div className="flex-grow flex lg:flex-row overflow-hidden relative">
          {(isSidebarOpen || isControlsOpen) && (
            <div 
                className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                onClick={closeAllPanels}
                aria-hidden="true"
            />
          )}

          <div className={`hidden lg:flex fixed lg:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
             <Sidebar 
                mockups={mockups}
                selectedMockupId={selectedMockup?.id || null} 
                onSelectMockup={handleMockupSelect} 
                onMockupUpload={handleMockupUpload}
                onClose={() => setIsSidebarOpen(false)}
              />
          </div>

          <div className="flex-grow flex flex-col overflow-hidden">
             <main className="flex-grow p-4 sm:p-6 flex flex-col items-center overflow-y-auto">
              <div className="flex flex-col items-center w-full">
                <Editor
                  selectedMockup={selectedMockup}
                  designs={designs}
                  onDesignChange={handleDesignChange}
                  editorRef={editorRef}
                />
                {selectedMockup && (
                  <ResultDisplay 
                      generatedImage={generatedImage} 
                      selectedMockup={selectedMockup}
                      isLoading={isLoading}
                      isUpscaling={isUpscaling}
                      onUpscale={handleUpscale}
                      error={error} 
                  />
                )}
              </div>
            </main>

            {/* Mobile Bottom Bar */}
            <div className="lg:hidden flex-shrink-0 flex flex-col p-3 border-t bg-white/80 backdrop-blur-lg z-10 space-y-3">
              <div>
                  <h3 className="text-xs font-bold text-gray-500 mb-2 px-1 uppercase tracking-wider">Select Mockup</h3>
                  <div className="flex items-center space-x-3 overflow-x-auto pb-2 -mb-2">
                      <label htmlFor="mobile-mockup-upload" className="flex-shrink-0 w-20 h-20 flex flex-col items-center justify-center p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer transition-colors">
                          <UploadIcon className="h-6 w-6 mb-1"/>
                          <span className="text-xs text-center font-medium">Upload</span>
                      </label>
                      <input id="mobile-mockup-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleMockupUpload} />
                      {mockups.map((mockup) => (
                          <div
                              key={mockup.id}
                              onClick={() => handleMockupSelect(mockup)}
                              className={`flex-shrink-0 w-20 h-20 p-1 rounded-lg cursor-pointer transition-all duration-200 ${selectedMockup?.id === mockup.id ? 'bg-indigo-600 shadow-md ring-2 ring-white/80' : 'bg-white shadow-sm'}`}
                              aria-label={mockup.name}
                          >
                              <img src={mockup.imageUrl} alt={mockup.name} className="w-full h-full object-cover rounded-md"/>
                          </div>
                      ))}
                  </div>
              </div>
              {selectedMockup && (
                  <div className="pt-3 border-t border-gray-200/80 space-y-3">
                      <div className="flex items-center justify-between space-x-2">
                          <label htmlFor="mobile-design-upload" className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                              <UploadIcon className="h-5 w-5 mr-1.5"/>
                               {designs.every(d => d === null) ? 'Upload Design' : 'Add/Change'}
                          </label>
                          <input 
                              id="mobile-design-upload" 
                              type="file" 
                              accept="image/png, image/jpeg" 
                              className="hidden" 
                              onChange={(e) => {
                                  const firstEmptyIndex = designs.findIndex(d => d === null);
                                  const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
                                  handleDesignUpload(e, targetIndex);
                              }}
                          />
                          <div className="flex items-center space-x-2">
                              <button onClick={handleUndo} disabled={!canUndo} className="p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50" aria-label="Undo">
                                  <UndoIcon />
                              </button>
                              <button onClick={handleRedo} disabled={!canRedo} className="p-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-100 disabled:opacity-50" aria-label="Redo">
                                  <RedoIcon />
                              </button>
                          </div>
                      </div>
                      {isAnyDesignLoaded && (
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading}
                            className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                        >
                            <MagicIcon />
                            {isLoading ? 'Generating...' : 'Attach with AI'}
                        </button>
                      )}
                  </div>
              )}
            </div>
          </div>
          
          <div className={`fixed lg:relative inset-y-0 right-0 z-40 transform transition-transform duration-300 ease-in-out ${isControlsOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
            <Controls
                selectedMockup={selectedMockup}
                onDesignUpload={handleDesignUpload}
                onCenterDesign={handleCenterDesign}
                onGenerate={handleGenerate}
                onIntensityChange={handleIntensityChange}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                designs={designs}
                isLoading={isLoading}
                aiIntensity={aiIntensity}
                onDesignChange={handleDesignChange}
                onSave={handleSave}
                onLoad={handleLoad}
                onBringForward={handleBringForward}
                onSendBackward={handleSendBackward}
                onEditApiKey={() => setIsApiKeyModalOpen(true)}
                onClose={() => setIsControlsOpen(false)}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default App;