import React, { useState } from 'react';
import { ApiProvider } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { ZaiIcon } from './icons/ZaiIcon';
import { GeminiIcon } from './icons/GeminiIcon';
import { OpenRouterIcon } from './icons/OpenRouterIcon';
import { OllamaIcon } from './icons/OllamaIcon';
import { getOllamaModels } from '../services/ollamaService';
import { RefreshIcon } from './icons/RefreshIcon';

const openRouterFreeModels = [ 'google/gemma-2-9b-it:free', 'deepseek/deepseek-chat-v3.1:free', 'tngtech/deepseek-r1t2-chimera:free', 'z-ai/glm-4.5-air:free', 'deepseek/deepseek-r1-0528:free', 'deepseek/deepseek-chat-v3-0324:free', 'tngtech/deepseek-r1t-chimera:free', 'qwen/qwen3-coder:free', 'deepseek/deepseek-r1:free', 'microsoft/mai-ds-r1:free', 'qwen/qwen3-235b-a22b:free', 'google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.3-70b-instruct:free', 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', 'deepseek/deepseek-r1-distill-llama-70b:free', 'mistralai/mistral-small-3.2-24b-instruct:free', 'qwen/qwen2.5-vl-72b-instruct:free', 'deepseek/deepseek-r1-0528-qwen3-8b:free', 'openai/gpt-oss-20b:free', 'mistralai/mistral-nemo:free', 'nvidia/nemotron-nano-9b-v2:free', 'qwen/qwen3-14b:free', 'qwen/qwen3-30b-a3b:free', 'google/gemma-3-27b-it:free', 'mistralai/mistral-small-3.1-24b-instruct:free', 'meta-llama/llama-4-maverick:free', 'moonshotai/kimi-dev-72b:free', 'meituan/longcat-flash-chat:free', 'mistralai/mistral-7b-instruct:free', 'qwen/qwen-2.5-coder-32b-instruct:free', 'qwen/qwen-2.5-72b-instruct:free', 'agentica-org/deepcoder-14b-preview:free', 'alibaba/tongyi-deepresearch-30b-a3b:free', 'qwen/qwen3-4b:free', 'meta-llama/llama-4-scout:free', 'shisa-ai/shisa-v2-llama3.3-70b:free', 'qwen/qwen3-8b:free', 'mistralai/devstral-small-2505:free', 'cognitivecomputations/dolphin3.0-mistral-24b:free', 'qwen/qwen2.5-vl-32b-instruct:free', 'moonshotai/kimi-k2:free', 'nousresearch/deephermes-3-llama-3-8b-preview:free', 'meta-llama/llama-3.3-8b-instruct:free', 'moonshotai/kimi-vl-a3b-thinking:free', 'mistralai/mistral-small-24b-instruct-2501:free', 'tencent/hunyuan-a13b-instruct:free', 'google/gemma-3-12b-it:free', 'meta-llama/llama-3.2-3b-instruct:free', 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free', 'arliai/qwq-32b-arliai-rpr-v1:free', 'google/gemma-3n-e2b-it:free', 'google/gemma-3n-e4b-it:free', 'google/gemma-3-4b-it:free'];

interface ProviderOption {
  id: ApiProvider;
  name: string;
  description: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  status: 'ready' | 'key_required' | 'local';
}

const PROVIDERS: ProviderOption[] = [
  { id: 'zai', name: 'Z.ai', description: 'Built-in AI provider for web development', icon: ZaiIcon, status: 'ready' },
  { id: 'google-gemini', name: 'Google Gemini', description: "Google's powerful AI model", icon: GeminiIcon, status: 'key_required' },
  { id: 'openrouter', name: 'OpenRouter', description: 'Access to multiple AI models including free options', icon: OpenRouterIcon, status: 'key_required' },
  { id: 'ollama', name: 'Ollama (Local)', description: 'Run AI models locally - fetches available models', icon: OllamaIcon, status: 'ready' }
];

interface AIProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiProvider: ApiProvider;
  onApiProviderChange: (provider: ApiProvider) => void;
  geminiApiKey: string;
  onGeminiApiKeyChange: (key: string) => void;
  ollamaModel: string;
  onOllamaModelChange: (model: string) => void;
  openrouterApiKey: string;
  onOpenrouterApiKeyChange: (key: string) => void;
  openrouterModel: string;
  onOpenrouterModelChange: (model: string) => void;
}

const ProviderCard: React.FC<{ provider: ProviderOption; isActive: boolean; onClick: () => void }> = ({ provider, isActive, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className={`relative p-4 border rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'border-primary ring-2 ring-primary/50' : 'border-border hover:border-primary/50 bg-secondary/50'}`}
        >
            {isActive && <div className="absolute top-3 right-3 px-2 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">Active</div>}
            <div className="flex items-center space-x-3 mb-2">
                <provider.icon className="w-6 h-6" />
                <h3 className="font-semibold">{provider.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{provider.description}</p>
            {provider.status === 'ready' && <div className="text-xs font-medium text-green-500">Ready to Use</div>}
            {provider.status === 'key_required' && <div className="text-xs font-medium text-amber-500">API Key Required</div>}
        </div>
    );
};


const AIProviderModal: React.FC<AIProviderModalProps> = ({
    isOpen, onClose, apiProvider, onApiProviderChange,
    geminiApiKey, onGeminiApiKeyChange,
    ollamaModel, onOllamaModelChange, openrouterApiKey, onOpenrouterApiKeyChange,
    openrouterModel, onOpenrouterModelChange
}) => {
    // State for Ollama connection and models
    const [ollamaModels, setOllamaModels] = useState<string[]>([]);
    const [ollamaStatus, setOllamaStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [ollamaError, setOllamaError] = useState<string | null>(null);

    const providersWithStatus = React.useMemo(() => {
        return PROVIDERS.map(p => {
            if (p.id === 'google-gemini') {
                return { ...p, status: geminiApiKey ? 'ready' : 'key_required' };
            }
            if (p.id === 'openrouter') {
                return { ...p, status: openrouterApiKey ? 'ready' : 'key_required' };
            }
            return p;
        });
    }, [geminiApiKey, openrouterApiKey]);

    const fetchAndSetOllamaModels = async () => {
        setOllamaStatus('loading');
        setOllamaError(null);
        try {
            const models = await getOllamaModels();
            if (models.length > 0) {
                setOllamaModels(models);
                setOllamaStatus('success');
                if (!models.includes(ollamaModel)) {
                    onOllamaModelChange(models[0]);
                }
            } else {
                 setOllamaStatus('error');
                 setOllamaError("Connection successful, but no models found on your Ollama server.");
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setOllamaStatus('error');
            setOllamaError(errorMessage);
        }
    };
    
    React.useEffect(() => {
        // Fetch models when modal is opened for Ollama provider
        if (isOpen && apiProvider === 'ollama' && ollamaStatus === 'idle') {
            fetchAndSetOllamaModels();
        }
        // Reset status if modal is closed or provider changes away from Ollama
        if (!isOpen || apiProvider !== 'ollama') {
            setOllamaStatus('idle');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, apiProvider]);

    if (!isOpen) return null;

    const handleProviderClick = (providerId: ApiProvider) => {
        onApiProviderChange(providerId); // Make selection active immediately
    };
    
    const currentConfig = {
        provider: PROVIDERS.find(p => p.id === apiProvider)?.name || 'N/A',
        model: apiProvider === 'ollama' ? ollamaModel : apiProvider === 'openrouter' ? openrouterModel.replace(':free', '') : 'gemini-2.5-flash',
        apiUrl: apiProvider === 'ollama' ? 'http://localhost:11434' : apiProvider === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://generativelanguage.googleapis.com'
    };
    
    const renderOllamaStatus = () => {
        switch (ollamaStatus) {
            case 'loading':
                return <p className="text-xs text-muted-foreground mt-1">Testing connection and fetching models...</p>;
            case 'success':
                return <p className="text-xs text-green-500 mt-1">Successfully connected. {ollamaModels.length} models found.</p>;
            case 'error':
                return <p className="text-xs text-destructive mt-1">{ollamaError}</p>;
            default:
                return <p className="text-xs text-muted-foreground mt-1">Ensure Ollama server is running locally.</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
            <div 
                className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl p-4 sm:p-6 flex flex-col max-h-[90vh] animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold">AI Provider Configuration</h2>
                        <p className="text-sm text-muted-foreground">Choose and configure your preferred AI provider for concept extraction</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-muted-foreground hover:bg-secondary">
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold mb-3">Select AI Provider</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {providersWithStatus.map(p => <ProviderCard key={p.id} provider={p} isActive={apiProvider === p.id} onClick={() => handleProviderClick(p.id)} />)}
                        </div>
                    </div>
                
                    <div className="space-y-4">
                        {apiProvider === 'google-gemini' && (
                            <div>
                                <label htmlFor="gemini-apikey" className="font-medium mb-2 text-sm block">Google Gemini API Key</label>
                                <input
                                    type="password"
                                    id="gemini-apikey"
                                    value={geminiApiKey}
                                    onChange={e => onGeminiApiKeyChange(e.target.value)}
                                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition"
                                    placeholder="Enter your Gemini API Key"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Stored locally in your browser.</p>
                            </div>
                        )}
                        {apiProvider === 'ollama' && (
                             <div>
                                <label htmlFor="ollama-model" className="font-medium mb-2 text-sm flex items-center justify-between">
                                    <span>Ollama Model</span>
                                    <button 
                                        onClick={fetchAndSetOllamaModels} 
                                        disabled={ollamaStatus === 'loading'}
                                        className="p-1 rounded-full text-muted-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-wait"
                                        title="Refresh model list"
                                    >
                                        <RefreshIcon className={`w-4 h-4 ${ollamaStatus === 'loading' ? 'animate-spin' : ''}`} />
                                    </button>
                                </label>
                                <select
                                    id="ollama-model"
                                    value={ollamaModel}
                                    onChange={e => onOllamaModelChange(e.target.value)}
                                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition"
                                    disabled={ollamaStatus !== 'success' || ollamaModels.length === 0}
                                >
                                    {ollamaModels.length > 0 ? (
                                        ollamaModels.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))
                                    ) : (
                                        <option disabled value="">{ollamaStatus === 'loading' ? 'Loading...' : 'No models available'}</option>
                                    )}
                                </select>
                                {renderOllamaStatus()}
                            </div>
                        )}
                        {apiProvider === 'openrouter' && (
                            <>
                                <div>
                                    <label htmlFor="openrouter-apikey" className="font-medium mb-2 text-sm block">OpenRouter API Key</label>
                                    <input
                                        type="password"
                                        id="openrouter-apikey"
                                        value={openrouterApiKey}
                                        onChange={e => onOpenrouterApiKeyChange(e.target.value)}
                                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition"
                                        placeholder="sk-or-..."
                                    />
                                     <p className="text-xs text-muted-foreground mt-1">Stored locally in your browser.</p>
                                </div>
                                 <div>
                                    <label htmlFor="openrouter-model" className="font-medium mb-2 text-sm block">OpenRouter Model</label>
                                     <select 
                                        id="openrouter-model" 
                                        value={openrouterModel} 
                                        onChange={e => onOpenrouterModelChange(e.target.value)}
                                        className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition"
                                    >
                                        {openRouterFreeModels.map(model => (
                                            <option key={model} value={model}>{model.replace(':free', '')}</option>
                                        ))}
                                    </select>
                                     <p className="text-xs text-muted-foreground mt-1">Only free models are listed.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 mt-6 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold mb-3">Current Configuration</h3>
                    <div className="text-sm bg-secondary p-4 rounded-lg space-y-2 font-mono">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Provider:</span>
                            <span>{currentConfig.provider}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Model:</span>
                            <span className="truncate max-w-[60%]">{currentConfig.model}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">API URL:</span>
                            <span className="truncate max-w-[60%]">{currentConfig.apiUrl}</span>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
              @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
              .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
              @keyframes slide-up { from { transform: translateY(20px); opacity: 0.8; } to { transform: translateY(0); opacity: 1; } }
              .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default AIProviderModal;
