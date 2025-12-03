import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { DocumentList } from './components/DocumentList';
import { ResultCard } from './components/ResultCard';
import { SearchHistory } from './components/SearchHistory';
import { ModelSettings } from './components/ModelSettings';
import { UploadedDocument, AnalysisState } from './types';
import { extractRelevantSentences, analyzeVocabularyInContext } from './services/geminiService';

export default function App() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [copyAllState, setCopyAllState] = useState<'idle' | 'copied'>('idle');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isLoading: false,
    error: null,
    results: [],
    searchedWord: '',
  });

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('ielts_search_history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse search history", e);
      }
    }
  }, []);

  const updateSearchHistory = useCallback((term: string) => {
    setSearchHistory((prev) => {
      // Remove the term if it exists, then add to front to keep most recent first
      const filtered = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
      const newHistory = [term, ...filtered].slice(0, 10); // Keep last 10
      localStorage.setItem('ielts_search_history', JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('ielts_search_history');
  }, []);

  const handleFileUpload = useCallback(async (files: FileList) => {
    const newDocs: UploadedDocument[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      const type = file.name.endsWith('.md') ? 'markdown' : 'text';
      
      newDocs.push({
        id: crypto.randomUUID(),
        name: file.name,
        content: text,
        type,
        uploadDate: Date.now(),
      });
    }

    setDocuments((prev) => [...prev, ...newDocs]);
  }, []);

  const handleRemoveDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  }, []);

  const executeSearch = async (term: string) => {
    if (!term.trim() || documents.length === 0) return;

    // Update input to reflect the term being searched (useful when clicking history)
    setSearchInput(term);
    
    // Save to history
    updateSearchHistory(term.trim());

    setAnalysisState({
      isLoading: true,
      error: null,
      results: [],
      searchedWord: term,
    });
    setCopyAllState('idle');

    try {
      // 1. Find raw examples locally first
      const rawExamples = extractRelevantSentences(documents, term.trim());

      if (rawExamples.length === 0) {
        setAnalysisState((prev) => ({
          ...prev,
          isLoading: false,
          error: `No examples found for "${term}" in your documents. Try another word.`,
        }));
        return;
      }

      // 2. Ask Gemini to analyze context and translate, using selected model
      const analyzedResults = await analyzeVocabularyInContext(term.trim(), rawExamples, selectedModel);

      setAnalysisState((prev) => ({
        ...prev,
        isLoading: false,
        results: analyzedResults,
      }));

    } catch (err: any) {
      setAnalysisState((prev) => ({
        ...prev,
        isLoading: false,
        error: err.message || "An unexpected error occurred.",
      }));
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSearch(searchInput);
  };

  const handleCopyAll = async () => {
    if (analysisState.results.length === 0) return;

    const textToCopy = analysisState.results.map((result, index) => {
      return `[${index + 1}] Source: ${result.sourceDocName}\n` +
             `Context: ${result.originalSentence}\n` +
             `Translation: ${result.chineseTranslation}\n` +
             `Meaning: ${result.wordMeaningInContext}\n`;
    }).join('\n----------------------------------------\n\n');

    const header = `IELTS Vocabulary Analysis for "${analysisState.searchedWord}"\n\n`;
    
    try {
        await navigator.clipboard.writeText(header + textToCopy);
        setCopyAllState('copied');
        setTimeout(() => setCopyAllState('idle'), 2000);
    } catch (err) {
        console.error('Failed to copy all', err);
    }
  };

  const handleExportCSV = () => {
    if (analysisState.results.length === 0) return;

    // Helper to escape CSV fields
    const escapeCsvField = (field: string) => {
      if (!field) return '""';
      const escaped = field.replace(/"/g, '""'); // Escape double quotes
      return `"${escaped}"`; // Wrap in double quotes
    };

    const headers = ['Source Document Name', 'Original Sentence', 'Translation', 'Contextual Meaning'];
    const csvContent = [
      headers.join(','),
      ...analysisState.results.map(r => [
        escapeCsvField(r.sourceDocName),
        escapeCsvField(r.originalSentence),
        escapeCsvField(r.chineseTranslation),
        escapeCsvField(r.wordMeaningInContext)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ielts_vocabulary_${analysisState.searchedWord}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Library */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 p-6 flex flex-col h-auto md:h-screen sticky top-0">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1 text-indigo-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <title>IELTS Contextualizer Logo</title>
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">IELTS Contextualizer</h1>
          </div>
          <p className="text-xs text-slate-500 pl-8">Master vocabulary in context.</p>
        </div>

        <div className="mb-6">
          <FileUpload onUpload={handleFileUpload} />
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <DocumentList documents={documents} onRemove={handleRemoveDocument} />
          
          <SearchHistory 
            history={searchHistory} 
            onSelect={executeSearch} 
            onClear={clearSearchHistory} 
          />
        </div>
        
        <div className="mt-6 pt-6 border-t border-slate-100 text-xs text-slate-400 text-center">
          Powered by Gemini 2.5
        </div>
      </aside>

      {/* Main Content - Search & Results */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header / Search Bar */}
        <div className="bg-white border-b border-slate-200 p-6 shadow-sm z-10 flex flex-col gap-4">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-end">
             <ModelSettings 
                currentModel={selectedModel} 
                onModelChange={setSelectedModel} 
                apiKeyConfigured={!!process.env.API_KEY}
             />
          </div>
          <div className="max-w-4xl mx-auto w-full">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <title>Search Icon</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={documents.length > 0 ? "Search for an IELTS core word (e.g., 'ambitious', 'mitigate')..." : "Upload documents to start searching"}
                disabled={documents.length === 0}
                className="block w-full pl-12 pr-4 py-4 border-transparent bg-slate-100 text-slate-900 placeholder-slate-500 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 rounded-xl transition-all duration-200 text-lg shadow-inner"
              />
              <button
                type="submit"
                disabled={!searchInput.trim() || documents.length === 0 || analysisState.isLoading}
                className="absolute inset-y-2 right-2 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors shadow-md flex items-center"
                title="Start search"
              >
                {analysisState.isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <title>Loading...</title>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "Find Examples"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-4xl mx-auto w-full">
            {analysisState.error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <title>Error</title>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{analysisState.error}</p>
                  </div>
                </div>
              </div>
            )}

            {!analysisState.isLoading && !analysisState.error && analysisState.results.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-20 opacity-60">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                  <svg className="w-16 h-16 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <title>No results found</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-slate-600 mb-2">Ready to Study</h3>
                <p className="text-slate-400 text-center max-w-md">
                  Upload your IELTS magazines or text files on the left, then search for a vocabulary word to see how it's used in real contexts.
                </p>
              </div>
            )}

            {analysisState.results.length > 0 && (
              <div className="space-y-6 pb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">
                    Results for "<span className="text-indigo-600">{analysisState.searchedWord}</span>"
                  </h2>
                  <div className="flex items-center gap-3">
                      <button
                        onClick={handleCopyAll}
                        className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium border rounded-lg transition-all shadow-sm active:scale-95 ${
                            copyAllState === 'copied' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                        }`}
                        title="Copy all results to clipboard"
                      >
                        {copyAllState === 'copied' ? (
                             <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Copied!</span>
                             </>
                        ) : (
                             <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>Copy All</span>
                             </>
                        )}
                      </button>
                      
                      <button
                        onClick={handleExportCSV}
                        className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm active:scale-95"
                        title="Export results to CSV"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                         <span>Export CSV</span>
                      </button>

                      <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
                        {analysisState.results.length} examples found
                      </span>
                  </div>
                </div>
                
                <div className="grid gap-6">
                  {analysisState.results.map((result, idx) => (
                    <ResultCard 
                      key={`${result.sourceDocId}-${idx}`} 
                      data={result} 
                      keyword={analysisState.searchedWord}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}