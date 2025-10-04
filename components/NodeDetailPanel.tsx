import React from 'react';
import { GraphNode } from '../types';

interface NodeDetailPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ node, onClose }) => {
  if (!node) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-96 max-w-full md:max-w-sm bg-card/80 backdrop-blur-md border border-border rounded-xl shadow-2xl p-4 z-10 transition-transform transform-gpu animate-slide-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold" style={{color: 'var(--accent-green)'}}>{node.label}</h3>
        <button onClick={onClose} className="p-1 rounded-full text-muted-foreground hover:bg-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-4 text-sm text-foreground">
        <div>
          <h4 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Domain</h4>
          <p className="p-2 bg-secondary rounded-md mt-1">{node.domain || 'N/A'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Definition</h4>
          <p className="mt-1 text-muted-foreground">{node.definition || 'No definition available.'}</p>
        </div>
        <div>
          <h4 className="font-semibold text-muted-foreground uppercase text-xs tracking-wider">Source Snippet</h4>
          <blockquote className="border-l-4 pl-3 italic text-muted-foreground mt-1" style={{borderColor: 'var(--accent-green)'}}>
            "{node.sourceText || 'No source text available.'}"
          </blockquote>
        </div>
      </div>
       <style>{`
        @keyframes slide-in {
            from {
                transform: translateY(100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        .animate-slide-in {
            animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default NodeDetailPanel;
