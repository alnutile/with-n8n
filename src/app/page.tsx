"use client";

import { useCoAgent, useCopilotAction } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useState } from "react";
import { AgentState as AgentStateSchema } from "@/backend";
import { z } from "zod";
import { WeatherToolResult, FileUploadResult, PageCreationResult, FileProcessingResult } from "@/backend";

type AgentState = z.infer<typeof AgentStateSchema>;

export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#6366f1");
  const [currentPage, setCurrentPage] = useState<PageCreationResult | null>(null);
  const [fileProcessingResults, setFileProcessingResults] = useState<FileProcessingResult | null>(null);

  // 🪁 Frontend Actions: https://docs.copilotkit.ai/guides/frontend-actions
  useCopilotAction({
    name: "setThemeColor",
    parameters: [{
      name: "themeColor",
      description: "The theme color to set. Make sure to pick nice colors.",
      required: true, 
    }],
    handler({ themeColor }) {
      setThemeColor(themeColor);
    },
  });

  return (
    <main style={{ "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties}>
        <YourMainContent 
          themeColor={themeColor} 
          currentPage={currentPage}
          fileProcessingResults={fileProcessingResults}
          setCurrentPage={setCurrentPage}
          setFileProcessingResults={setFileProcessingResults}
        />
      <CopilotSidebar
        clickOutsideToClose={false}
        defaultOpen={true}
        labels={{
          title: "Popup Assistant",
          initial: "👋 Hi, there! You're chatting with an agent. This agent comes with a few tools to get you started.\n\nFor example you can try:\n- **Frontend Tools**: \"Set the theme to orange\"\n- **Shared State**: \"Write a proverb about AI\"\n- **Generative UI**: \"Get the weather in SF\"\n\nAs you interact with the agent, you'll see the UI update in real-time to reflect the agent's **state**, **tool calls**, and **progress**."
        }}
      />
    </main>
  );
}

function YourMainContent({ 
  themeColor, 
  currentPage, 
  fileProcessingResults,
  setCurrentPage,
  setFileProcessingResults
}: { 
  themeColor: string;
  currentPage: PageCreationResult | null;
  fileProcessingResults: FileProcessingResult | null;
  setCurrentPage: (page: PageCreationResult | null) => void;
  setFileProcessingResults: (results: FileProcessingResult | null) => void;
}) {
  // 🪁 Shared State: https://docs.copilotkit.ai/coagents/shared-state
  const {state, setState} = useCoAgent<AgentState>({
    name: "weatherAgent",
    initialState: {
      proverbs: [
        "CopilotKit may be new, but its the best thing since sliced bread.",
      ],
    },
  })

  //🪁 Generative UI: https://docs.copilotkit.ai/coagents/generative-ui
  useCopilotAction({
    name: "weatherTool",
    description: "Get the weather for a given location.",
    available: "frontend",
    parameters: [
      { name: "location", type: "string", required: true },
    ],
    render: ({ args, result, status }) => {
      return <WeatherCard 
        location={args.location} 
        themeColor={themeColor} 
        result={result} 
        status={status}
      />
    },
  });

  useCopilotAction({
    name: "updateWorkingMemory",
    available: "frontend",
    render: ({ args }) => {
      return <div style={{ backgroundColor: themeColor }} className="rounded-2xl max-w-md w-full text-white p-4">
        <p>✨ Memory updated</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-white">See updates</summary>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} className="overflow-x-auto text-sm bg-white/20 p-4 rounded-lg mt-2">
            {JSON.stringify(args, null, 2)}
          </pre>
        </details>
      </div>
    },
  });

  // File upload action
  useCopilotAction({
    name: "fileUploadTool",
    description: "Upload a file to the backend",
    available: "frontend",
    parameters: [],
    render: ({ args, result, status }) => {
      // Always show the upload widget, ignore the tool result
      return <FileUploadWidget 
        themeColor={themeColor} 
        result={undefined} 
        status="inProgress"
      />
    },
  });

  // Page creation action
  useCopilotAction({
    name: "createPageTool",
    description: "Create a new page for file processing",
    available: "frontend",
    parameters: [
      { name: "pageType", type: "string", required: true },
      { name: "title", type: "string", required: true },
      { name: "description", type: "string", required: false },
    ],
    render: ({ args, result, status }) => {
      if (status === "complete" && result) {
        setCurrentPage(result);
      }
      return <PageCreationWidget 
        themeColor={themeColor} 
        result={result} 
        status={status}
      />
    },
  });

  // File processing action
  useCopilotAction({
    name: "processFileTool",
    description: "Process uploaded file with AI based on user prompt",
    available: "frontend",
    parameters: [
      { name: "fileContent", type: "string", required: true },
      { name: "fileName", type: "string", required: true },
      { name: "fileType", type: "string", required: true },
      { name: "prompt", type: "string", required: true },
      { name: "pageId", type: "string", required: true },
    ],
    render: ({ args, result, status }) => {
      if (status === "complete" && result) {
        setFileProcessingResults(result);
      }
      return <FileProcessingWidget 
        themeColor={themeColor} 
        result={result} 
        status={status}
      />
    },
  });

  // Show dynamic page if one exists, otherwise show default content
  if (currentPage) {
    return (
      <DynamicPage 
        themeColor={themeColor}
        page={currentPage}
        fileProcessingResults={fileProcessingResults}
      />
    );
  }

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="h-screen w-screen flex justify-center items-center flex-col transition-colors duration-300"
    >
      <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">Proverbs</h1>
        <p className="text-gray-200 text-center italic mb-6">This is a demonstrative page, but it could be anything you want! 🪁</p>
        <hr className="border-white/20 my-6" />
        <div className="flex flex-col gap-3">
          {state.proverbs?.map((proverb: string, index: number) => (
            <div 
              key={index} 
              className="bg-white/15 p-4 rounded-xl text-white relative group hover:bg-white/20 transition-all"
            >
              <p className="pr-8">{proverb}</p>
              <button 
                onClick={() => setState({
                  ...state,
                  proverbs: state.proverbs?.filter((_: string, i: number) => i !== index),
                })}
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity 
                  bg-red-500 hover:bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {state.proverbs?.length === 0 && <p className="text-center text-white/80 italic my-8">
          No proverbs yet. Ask the assistant to add some!
        </p>}
        <div className="mt-6 text-white text-sm text-center">
          <p className="font-semibold mb-2">Try saying:</p>
          <p>• "I want to make a page"</p>
          <p>• "Create a file processor page"</p>
          <p>• "Make a document analyzer"</p>
        </div>
      </div>
    </div>
  );
}

// Weather card component where the location and themeColor are based on what the agent
// sets via tool calls.
function WeatherCard({ 
  location, 
  themeColor, 
  result, 
  status 
}: { 
  location?: string, 
  themeColor: string, 
  result: WeatherToolResult, 
  status: "inProgress" | "executing" | "complete" 
}) {
  if (status !== "complete") {
    return (
      <div 
        className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
        style={{ backgroundColor: themeColor }}
      >
        <div className="bg-white/20 p-4 w-full">
          <p className="text-white animate-pulse">Loading weather for {location}...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
    >
      <div className="bg-white/20 p-4 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white capitalize">{location}</h3>
            <p className="text-white">Current Weather</p>
          </div>
          <WeatherIcon conditions={result.conditions} />         
        </div>
        
        <div className="mt-4 flex items-end justify-between">
          <div className="text-3xl font-bold text-white">
            <span className="">
              {result.temperature}° C
            </span>
            <span className="text-sm text-white/50">
              {" / "}
              {((result.temperature * 9) / 5 + 32).toFixed(1)}° F
            </span>
          </div>
          <div className="text-sm text-white">{result.conditions}</div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-white text-xs">Humidity</p>
              <p className="text-white font-medium">{result.humidity}%</p>
            </div>
            <div>
              <p className="text-white text-xs">Wind</p>
              <p className="text-white font-medium">{result.windSpeed} mph</p>
            </div>
            <div>
              <p className="text-white text-xs">Feels Like</p>
              <p className="text-white font-medium">{result.feelsLike}°</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherIcon({ conditions }: { conditions: string }) {
  if (!conditions) return null;

  if (
    conditions.toLowerCase().includes("clear") ||
    conditions.toLowerCase().includes("sunny")
  ) {
    return <SunIcon />;
  }
  
  if (
    conditions.toLowerCase().includes("rain") ||
    conditions.toLowerCase().includes("drizzle") ||
    conditions.toLowerCase().includes("snow") ||
    conditions.toLowerCase().includes("thunderstorm")
  ) {
    return <RainIcon />;
  } 
  
  if (
    conditions.toLowerCase().includes("fog") ||
    conditions.toLowerCase().includes("cloud") ||
    conditions.toLowerCase().includes("overcast")
  ) {
    return <CloudIcon />;
  }

  return <CloudIcon />;
}

// Simple sun icon for the weather card
function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-yellow-200">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" stroke="currentColor" />
    </svg>
  );
}

function RainIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-blue-200">
      {/* Cloud */}
      <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 10 0 4 4 0 0 1 0 8H7z" fill="currentColor" opacity="0.8"/>
      {/* Rain drops */}
      <path d="M8 18l2 4M12 18l2 4M16 18l2 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-gray-200">
      <path d="M7 15a4 4 0 0 1 0-8 5 5 0 0 1 10 0 4 4 0 0 1 0 8H7z" fill="currentColor"/>
    </svg>
  );
}

// File upload widget component
function FileUploadWidget({ 
  themeColor, 
  result, 
  status 
}: { 
  themeColor: string, 
  result: FileUploadResult | undefined, 
  status: "inProgress" | "executing" | "complete" 
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just the base64 content
          const base64Content = result.split(',')[1];
          resolve(base64Content);
        };
        reader.readAsDataURL(selectedFile);
      });

      // Call the upload API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
          fileContent: base64
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Show success state
        setUploadResult(result);
        setIsUploading(false);
        setSelectedFile(null);
      } else {
        throw new Error(result.message);
      }

    } catch (error) {
      console.error('Upload failed:', error);
      setIsUploading(false);
    }
  };

  // Show success message if upload completed
  if (uploadResult && uploadResult.success) {
    return (
      <div
        style={{ backgroundColor: themeColor }}
        className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
      >
        <div className="bg-white/20 p-4 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">📁 File Uploaded</h3>
              <p className="text-white">{uploadResult.fileName}</p>
            </div>
            <FileIcon />
          </div>
          
          <div className="mt-4 flex items-end justify-between">
            <div className="text-sm text-white">
              <span className="font-medium">
                {uploadResult.success ? "✅ Success" : "❌ Failed"}
              </span>
            </div>
            <div className="text-sm text-white">{uploadResult.message}</div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-white">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-white text-xs">Size</p>
                <p className="text-white font-medium">{(uploadResult.fileSize / 1024).toFixed(1)} KB</p>
              </div>
              <div>
                <p className="text-white text-xs">Type</p>
                <p className="text-white font-medium">{uploadResult.fileType}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
      style={{ backgroundColor: themeColor }}
    >
      <div className="bg-white/20 p-4 w-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">📁 Upload File</h3>
            <p className="text-white text-sm">Select a file to upload</p>
          </div>
          <FileIcon />
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <input
              type="file"
              onChange={handleFileSelect}
              className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30"
              disabled={isUploading}
              id="file-upload"
            />
            <label 
              htmlFor="file-upload" 
              className="absolute inset-0 cursor-pointer"
            />
          </div>
          
          {selectedFile ? (
            <div className="text-white text-sm bg-white/10 p-3 rounded-lg">
              <p><strong>Selected:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {(selectedFile.size / 1024).toFixed(1)} KB</p>
              <p><strong>Type:</strong> {selectedFile.type || 'Unknown'}</p>
            </div>
          ) : (
            <div className="text-white/70 text-sm text-center py-2">
              No file selected
            </div>
          )}
          
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isUploading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </div>
            ) : (
              'Upload File'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-white">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
    </svg>
  );
}

// Page creation widget component
function PageCreationWidget({ 
  themeColor, 
  result, 
  status 
}: { 
  themeColor: string, 
  result: PageCreationResult | undefined, 
  status: "inProgress" | "executing" | "complete" 
}) {
  if (status !== "complete" || !result) {
    return (
      <div 
        className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
        style={{ backgroundColor: themeColor }}
      >
        <div className="bg-white/20 p-4 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Creating Page</h3>
              <p className="text-white">Setting up your new page...</p>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
    >
      <div className="bg-white/20 p-4 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">📄 Page Created</h3>
            <p className="text-white">{result.title}</p>
          </div>
          <div className="text-2xl">📄</div>
        </div>
        
        <div className="mt-4 text-sm text-white">
          <p><strong>Type:</strong> {result.pageType}</p>
          <p><strong>Description:</strong> {result.description}</p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white">
          <div className="text-sm text-white text-center">
            <span className="font-medium">✅ Page is now active in the main content area</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// File processing widget component
function FileProcessingWidget({ 
  themeColor, 
  result, 
  status 
}: { 
  themeColor: string, 
  result: FileProcessingResult | undefined, 
  status: "inProgress" | "executing" | "complete" 
}) {
  if (status !== "complete" || !result) {
    return (
      <div 
        className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
        style={{ backgroundColor: themeColor }}
      >
        <div className="bg-white/20 p-4 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Processing File</h3>
              <p className="text-white">AI is analyzing your file...</p>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
    >
      <div className="bg-white/20 p-4 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">🤖 File Processed</h3>
            <p className="text-white">{result.fileName}</p>
          </div>
          <div className="text-2xl">🤖</div>
        </div>
        
        <div className="mt-4 text-sm text-white">
          <p><strong>Prompt:</strong> {result.prompt}</p>
          <p><strong>Result:</strong> {result.result}</p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white">
          <div className="text-sm text-white text-center">
            <span className="font-medium">✅ Results displayed in main content area</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dynamic page component for main content area
function DynamicPage({ 
  themeColor, 
  page, 
  fileProcessingResults 
}: { 
  themeColor: string;
  page: PageCreationResult;
  fileProcessingResults: FileProcessingResult | null;
}) {
  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="h-screen w-screen flex flex-col transition-colors duration-300"
    >
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="bg-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">{page.title}</h1>
            <p className="text-gray-200 mb-4">{page.description}</p>
            <div className="flex items-center gap-4 text-sm text-white">
              <span className="bg-white/20 px-3 py-1 rounded-full">{page.pageType}</span>
              <span>ID: {page.pageId}</span>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="bg-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl mb-6">
            <h2 className="text-xl font-bold text-white mb-4">📁 File Upload</h2>
            <p className="text-gray-200 mb-4">Upload a file and tell me how to process it!</p>
            <div className="text-sm text-white">
              <p className="mb-2"><strong>Try saying:</strong></p>
              <p>• "Upload this file and make a TLDR"</p>
              <p>• "Process this file and create charts"</p>
              <p>• "Analyze this document and summarize it"</p>
            </div>
          </div>

          {/* Results Section */}
          {fileProcessingResults && (
            <div className="bg-white/20 backdrop-blur-md p-6 rounded-2xl shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4">📊 Processing Results</h2>
              <div className="bg-white/10 p-4 rounded-lg mb-4">
                <div className="text-sm text-white mb-2">
                  <p><strong>File:</strong> {fileProcessingResults.fileName}</p>
                  <p><strong>Prompt:</strong> {fileProcessingResults.prompt}</p>
                  <p><strong>Result:</strong> {fileProcessingResults.result}</p>
                </div>
              </div>
              <div className="bg-white/10 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Processed Content:</h3>
                <div className="prose prose-invert max-w-none">
                  <pre className="text-white whitespace-pre-wrap text-sm">
                    {fileProcessingResults.processedContent}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
