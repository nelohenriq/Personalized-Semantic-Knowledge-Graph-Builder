import React, { useState } from 'react';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { CloseIcon } from './icons/CloseIcon';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onClearGraph: () => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  confidence: number;
  onConfidenceChange: (value: number) => void;
  domains: string[];
  domainColors: Record<string, string>;
  onDomainColorChange: (domain: string, color: string) => void;
}

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-border last:border-b-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-3 text-left">
                <h2 className="font-semibold text-foreground uppercase text-xs tracking-wider">{title}</h2>
                <ChevronDownIcon className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && <div className="pb-4 space-y-4">{children}</div>}
        </div>
    );
};

const Sidebar: React.FC<SidebarProps> = ({ 
    isOpen, onClose, onClearGraph, isLoading, searchQuery, onSearchChange, confidence, onConfidenceChange, domains,
    domainColors, onDomainColorChange
}) => {
  return (
    <>
      <div 
        className={`md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <aside className={`
        fixed md:relative 
        inset-y-0 right-0 
        w-80 bg-card border-l border-border 
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        z-40 md:z-auto
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        md:translate-x-0
        md:w-80
      `}>
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border">
            <h2 className="font-semibold">Filters & Appearance</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-secondary">
                <CloseIcon className="w-5 h-5" />
            </button>
        </div>

        <div className="flex-grow p-4 space-y-2 overflow-y-auto">
          <AccordionSection title="Filters" defaultOpen>
              <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input
                      type="text"
                      placeholder="Search nodes..."
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-secondary border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition"
                      disabled={isLoading}
                  />
              </div>
              <div>
                  <label htmlFor="confidence-slider" className="font-medium mb-2 flex justify-between text-sm">
                      <span>Min. Confidence</span>
                      <span>{confidence.toFixed(2)}</span>
                  </label>
                  <input
                      id="confidence-slider"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={confidence}
                      onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      disabled={isLoading}
                  />
              </div>
          </AccordionSection>
          
          {domains.length > 0 && (
            <AccordionSection title="Appearance" defaultOpen>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                  {domains.map(domain => (
                    <div key={domain} className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted-foreground" title={domain}>{domain}</span>
                      <input 
                        type="color"
                        value={domainColors[domain] || '#cccccc'}
                        onChange={e => onDomainColorChange(domain, e.target.value)}
                        className="w-6 h-6 p-0 border-none rounded cursor-pointer bg-transparent"
                        disabled={isLoading}
                      />
                    </div>
                  ))}
                </div>
            </AccordionSection>
          )}
        </div>
        
        <div className="p-4 border-t border-border">
          <button
              onClick={onClearGraph}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 font-semibold transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
          >
            Clear Graph
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
