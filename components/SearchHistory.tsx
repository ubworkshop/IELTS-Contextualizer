import React from 'react';

interface SearchHistoryProps {
  history: string[];
  onSelect: (term: string) => void;
  onClear: () => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Recent Searches
        </h3>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="text-[10px] text-slate-400 hover:text-red-500 transition-colors px-1 py-0.5 rounded hover:bg-red-50"
          title="Clear history"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {history.map((term, index) => (
          <button
            key={`${term}-${index}`}
            onClick={() => onSelect(term)}
            className="group relative text-xs bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-300 px-3 py-1.5 rounded-full border border-slate-200 transition-all shadow-sm hover:shadow active:scale-95"
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
};
