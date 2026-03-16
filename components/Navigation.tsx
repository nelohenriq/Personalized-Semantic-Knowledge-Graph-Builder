import React, { useRef, useEffect } from 'react';
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
    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const slider = navRef.current;
        if (!slider) return;

        let isDown = false;
        let startX: number;
        let scrollLeft: number;

        const handleMouseDown = (e: MouseEvent) => {
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        };

        const handleMouseLeave = () => {
            isDown = false;
            slider.classList.remove('active');
        };

        const handleMouseUp = () => {
            isDown = false;
            slider.classList.remove('active');
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2; //scroll-fast
            slider.scrollLeft = scrollLeft - walk;
        };

        slider.addEventListener('mousedown', handleMouseDown);
        slider.addEventListener('mouseleave', handleMouseLeave);
        slider.addEventListener('mouseup', handleMouseUp);
        slider.addEventListener('mousemove', handleMouseMove);

        return () => {
            slider.removeEventListener('mousedown', handleMouseDown);
            slider.removeEventListener('mouseleave', handleMouseLeave);
            slider.removeEventListener('mouseup', handleMouseUp);
            slider.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);


    return (
        <nav
            ref={navRef}
            className="flex items-center space-x-2 sm:space-x-4 whitespace-nowrap -mb-px px-4 sm:px-8 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
        >
            {TABS.map((tab) => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    // Prevent text selection while dragging
                    onMouseDown={(e) => e.preventDefault()}
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