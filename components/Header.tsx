import React from 'react';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ApiProvider } from '../types';
import { AICloudIcon } from './icons/AICloudIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { ZaiIcon } from './icons/ZaiIcon';
import { GeminiIcon } from './icons/GeminiIcon';
import { OpenRouterIcon } from './icons/OpenRouterIcon';
import { OllamaIcon } from './icons/OllamaIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  apiProvider: ApiProvider;
  onOpenProviderModal: () => void;
}

const PROVIDER_DETAILS: Record<ApiProvider, { name: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }> = {
  'zai': { name: 'Z.ai', icon: ZaiIcon },
  'google-gemini': { name: 'Google Gemini', icon: GeminiIcon },
  'openrouter': { name: 'OpenRouter', icon: OpenRouterIcon },
  'ollama': { name: 'Ollama', icon: OllamaIcon },
};

const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, apiProvider, onOpenProviderModal }) => {
  const currentProvider = PROVIDER_DETAILS[apiProvider];

  return (
    <header className="flex-shrink-0 bg-card border-b border-border h-20 z-20 overflow-x-auto no-scrollbar">
      <div className="h-full w-max min-w-full flex items-center justify-between px-4 sm:px-8 space-x-4">
      
        <div className="flex items-center space-x-4 flex-shrink-0">
          <AICloudIcon className="w-10 h-10 text-foreground flex-shrink-0" />
          <div className="whitespace-nowrap">
            <h1 className="text-sm sm:text-base md:text-lg font-semibold text-foreground">
              Semantic Knowledge Graph Builder
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Transform learning materials into interconnected knowledge
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          <div 
              className="hidden md:flex items-center space-x-2 text-sm font-medium text-muted-foreground border border-dashed border-border rounded-full px-3 py-1.5 whitespace-nowrap"
              title="All processing happens locally in your browser. Your data is never sent to a server unless you configure a cloud provider."
          >
              <ShieldCheckIcon className="w-4 h-4 text-green-500" />
              <span>Local & Private</span>
          </div>
          
          <div className="flex items-center rounded-lg border border-border text-sm overflow-hidden whitespace-nowrap">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-secondary">
              <span className="text-muted-foreground hidden lg:inline">Provider:</span>
              <currentProvider.icon className="w-5 h-5 md:w-4 md:h-4 text-foreground" />
              <span className="font-semibold text-foreground hidden lg:inline">{currentProvider.name}</span>
            </div>

            <button
              onClick={onOpenProviderModal}
              className="flex items-center space-x-2 px-3 py-1.5 bg-card text-muted-foreground border-l border-border hover:bg-muted hover:text-foreground transition-colors"
              title="Configure AI Provider"
            >
              <SettingsIcon className="w-5 h-5 md:w-4 md:h-4" />
              <span className="font-medium hidden lg:inline">Settings</span>
            </button>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
          >
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;