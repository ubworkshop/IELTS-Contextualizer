import React from 'react';

interface ModelSettingsProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  apiKeyConfigured: boolean;
}

export const ModelSettings: React.FC<ModelSettingsProps> = ({ currentModel, onModelChange, apiKeyConfigured }) => {
  return (
    <div className="flex items-center space-x-4 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm">
      <div className="flex items-center space-x-2 border-r border-slate-200 pr-4">
        <div 
            className={`flex items-center space-x-1.5 cursor-help ${!apiKeyConfigured ? 'animate-pulse' : ''}`}
            title={apiKeyConfigured ? "Authenticated via system environment variables" : "Error: API_KEY environment variable is not set. Please configure your backend environment."}
        >
          <span className="relative flex h-2.5 w-2.5">
            {apiKeyConfigured && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${apiKeyConfigured ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span className={`font-medium text-xs ${apiKeyConfigured ? 'text-slate-600' : 'text-red-600 font-bold'}`}>
            {apiKeyConfigured ? 'System API Ready' : 'API Key Missing'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <label htmlFor="model-select" className="text-slate-500 text-xs font-medium uppercase tracking-wide">
          Model:
        </label>
        <select
          id="model-select"
          value={currentModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="bg-white border border-slate-300 text-slate-700 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-48 p-1.5 cursor-pointer outline-none hover:border-indigo-400 transition-colors"
        >
          <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
          <option value="gemini-2.5-flash-lite-latest">Gemini 2.5 Flash Lite</option>
          <option value="gemini-3-pro-preview">Gemini 3 Pro (High IQ)</option>
        </select>
      </div>
    </div>
  );
};