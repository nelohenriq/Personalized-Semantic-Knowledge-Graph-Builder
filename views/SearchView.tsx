import React, { useState } from 'react';
import Card from '../components/Card';
import { GraphData, SearchResult, ApiProvider } from '../types';
import { performSemanticSearch } from '../services/geminiService';
import { performSemanticSearchOllama } from '../services/ollamaService';
import { performSemanticSearchOpenRouter } from '../services/openrouterService';
import { SearchIcon } from '../components/icons/SearchIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ConceptsIcon } from '../components/icons/ConceptsIcon';
import { RelationshipsIcon } from '../components/icons/RelationshipsIcon';

interface SearchViewProps {
    graphData: GraphData;
    apiProvider: ApiProvider;
    geminiApiKey: string;
    ollamaModel: string;
    openrouterApiKey: string;
    openrouterModel: string;
}

const SearchView: React.FC<SearchViewProps> = ({ graphData, apiProvider, geminiApiKey, ollamaModel, openrouterApiKey, openrouterModel }) => {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

    const handleSearch = async () => {
        if (!query.trim() || graphData.nodes.length === 0) {
            if (graphData.nodes.length === 0) {
                setError("Cannot search an empty graph. Please upload a document first.");
            }
            return;
        }

        setIsLoading(true);
        setError(null);
        setSearchResult(null);

        try {
            let result;
            switch (apiProvider) {
                case 'zai':
                    result = await performSemanticSearch(query, graphData);
                    break;
                case 'google-gemini':
                    if (!geminiApiKey) {
                        throw new Error("Google Gemini API Key is required. Please add it in the provider settings.");
                    }
                    result = await performSemanticSearch(query, graphData, geminiApiKey);
                    break;
                case 'ollama':
                    result = await performSemanticSearchOllama(query, graphData, ollamaModel);
                    break;
                case 'openrouter':
                     if (!openrouterApiKey) {
                        throw new Error("OpenRouter API Key is required. Please add it in the provider settings.");
                    }
                    result = await performSemanticSearchOpenRouter(query, graphData, openrouterModel, openrouterApiKey);
                    break;
                default:
                    throw new Error("Invalid API provider selected.");
            }
            setSearchResult(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during search.');
        } finally {
            setIsLoading(false);
        }
    };

    const isSearchDisabled = isLoading || graphData.nodes.length === 0;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <h3 className="text-lg font-semibold">Semantic Search</h3>
                <p className="text-sm text-muted-foreground mb-4">Ask a question about your knowledge graph in natural language.</p>
                <div className="flex space-x-2">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !isSearchDisabled && handleSearch()}
                            placeholder="e.g., What is the main theme of the document?"
                            className="w-full pl-10 pr-4 py-2 bg-secondary border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring transition"
                            disabled={isSearchDisabled}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isSearchDisabled}
                        className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                    >
                        Search
                    </button>
                </div>
                 {graphData.nodes.length === 0 && (
                    <p className="text-sm text-amber-600 mt-2">Upload a document to enable search.</p>
                )}
            </Card>

            {isLoading && (
                <div className="flex flex-col items-center justify-center text-center p-8">
                     <svg className="w-12 h-12 text-primary animate-spin mb-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                     </svg>
                    <p className="text-muted-foreground">Analyzing your graph...</p>
                </div>
            )}
            {error && (
                <Card><p className="text-destructive text-center">{error}</p></Card>
            )}

            {!isLoading && !error && searchResult && (
                 <Card>
                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <SparklesIcon className="w-6 h-6 text-primary" />
                                <h3 className="text-lg font-semibold">AI Generated Answer</h3>
                            </div>
                            <p className="text-muted-foreground">{searchResult.answer}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center space-x-3 mb-3">
                                    <ConceptsIcon className="w-5 h-5 text-muted-foreground" />
                                    <h4 className="font-semibold">Relevant Concepts</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {searchResult.relevantNodes.map(node => (
                                        <span key={node.id} className="px-2.5 py-1 text-xs font-medium text-secondary-foreground bg-secondary rounded-full">
                                            {node.label}
                                        </span>
                                    ))}
                                </div>
                                 {searchResult.relevantNodes.length === 0 && <p className="text-xs text-muted-foreground">No specific concepts identified.</p>}
                            </div>
                             <div>
                                <div className="flex items-center space-x-3 mb-3">
                                    <RelationshipsIcon className="w-5 h-5 text-muted-foreground" />
                                    <h4 className="font-semibold">Relevant Relationships</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {searchResult.relevantLinks.map(link => {
                                        const sourceNode = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
                                        const targetNode = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
                                        const linkId = `${sourceNode?.id}-${targetNode?.id}`;
                                        return (
                                             <span key={linkId} className="px-2.5 py-1 text-xs font-medium text-popover-foreground bg-popover border border-border rounded-full">
                                                {sourceNode?.label} &rarr; {targetNode?.label}
                                            </span>
                                        )
                                    })}
                                </div>
                                {searchResult.relevantLinks.length === 0 && <p className="text-xs text-muted-foreground">No specific relationships identified.</p>}
                            </div>
                        </div>
                    </div>
                 </Card>
            )}

             {!isLoading && !searchResult && !error && (
                <div className="text-center p-8">
                    <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                        Your personal knowledge awaits
                    </h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Once you've built a graph, use this page to ask questions and uncover connections within your documents.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchView;