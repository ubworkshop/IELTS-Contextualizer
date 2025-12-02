import React from 'react';
import { VocabularyAnalysis } from '../types';

interface ResultCardProps {
  data: VocabularyAnalysis;
  keyword: string;
}

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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
             📄 {data.sourceDocName}
          </span>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
          <p className="text-base text-slate-800 leading-relaxed font-serif italic">
            "{getHighlightedText(data.originalSentence, keyword)}"
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-2">
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Translation</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{data.chineseTranslation}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wide mb-1">Contextual Meaning</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{data.wordMeaningInContext}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
