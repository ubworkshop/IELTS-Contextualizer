import React, { useState } from 'react';
import { VocabularyAnalysis } from '../types';

interface ResultCardProps {
  data: VocabularyAnalysis;
  keyword: string;
}

const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 inline-flex items-center justify-center p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all focus:outline-none"
      title={`Copy ${label}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      )}
    </button>
  );
};

export const ResultCard: React.FC<ResultCardProps> = ({ data, keyword }) => {
  // Utility to escape regex characters to prevent crashes on special chars like "?" or "+"
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Highlight keyword in the original sentence
  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    
    const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-indigo-100 text-indigo-700 font-bold px-1 rounded mx-0.5 border-b-2 border-indigo-200">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
             📄 {data.sourceDocName}
          </span>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4 relative group">
           <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <CopyButton text={data.originalSentence} label="original text" />
           </div>
          <p className="text-base text-slate-800 leading-relaxed font-serif italic">
            "{getHighlightedText(data.originalSentence, keyword)}"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-2 border-t border-slate-50">
          <div>
            <div className="flex items-center mb-1">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Translation</h4>
                <CopyButton text={data.chineseTranslation} label="translation" />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{data.chineseTranslation}</p>
          </div>
          <div>
            <div className="flex items-center mb-1">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Contextual Meaning</h4>
                <CopyButton text={data.wordMeaningInContext} label="meaning" />
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">{data.wordMeaningInContext}</p>
          </div>
        </div>
      </div>
    </div>
  );
};