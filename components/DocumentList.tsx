import React from 'react';
import { UploadedDocument } from '../types';

interface DocumentListProps {
  documents: UploadedDocument[];
  onRemove: (id: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onRemove }) => {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 px-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
        <p>No documents uploaded yet.</p>
        <p className="mt-1 text-xs">Upload .md or .txt files to start.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Your Library ({documents.length})
      </h3>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="group flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              <div 
                className={`p-2 rounded-md ${doc.type === 'markdown' ? 'bg-sky-100 text-sky-600' : 'bg-emerald-100 text-emerald-600'}`}
                title={doc.type === 'markdown' ? "Markdown Document" : "Text Document"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate" title={doc.name}>{doc.name}</p>
                <p className="text-xs text-slate-400">{(doc.content.length / 1000).toFixed(1)}k chars</p>
              </div>
            </div>
            <button
              onClick={() => onRemove(doc.id)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
              title={`Remove ${doc.name}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};