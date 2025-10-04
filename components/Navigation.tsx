import React from 'react';
import { Tab } from '../App';

interface NavigationProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'upload', label: 'Upload' },
    { id: 'graph', label: 'Knowledge Graph' },
    { id: 'search', label: 'Search' },
    { id: 'learningPaths', label: 'Learning Paths' },
    { id: 'insights', label: 'Insights' },
];

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="flex items-center space-x-2 sm:space-x-4 whitespace-nowrap -mb-px px-4 sm:px-8">
            {TABS.map((tab) => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-3 py-4 text-sm font-medium relative transition-colors ${
                        activeTab === tab.id 
                        ? 'text-primary' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full"></span>
                    )}
                </button>
            ))}
        </nav>
    );
}

export default Navigation;