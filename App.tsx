import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import OverviewView from './views/OverviewView';
import UploadView from './views/UploadView';
import KnowledgeGraphView from './views/KnowledgeGraphView';
import SearchView from './views/SearchView';
import LearningPathsView from './views/LearningPathsView';
import InsightsView from './views/InsightsView';
import { GraphData, GraphLink, ApiProvider } from './types';
import { extractKnowledgeGraph } from './services/geminiService';
import { extractKnowledgeGraphOllama } from './services/ollamaService';
import { extractKnowledgeGraphOpenRouter } from './services/openrouterService';
import { extractKnowledgeGraphZai } from './services/zaiService';
import AIProviderModal from './components/AIProviderModal';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker from a CDN. This is required for the library to work.
// Using a specific version for the worker for stability.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs`;

export type Tab = 'overview' | 'upload' | 'graph' | 'search' | 'learningPaths' | 'insights';

const CHUNK_SIZE = 32000;
const CHUNK_OVERLAP = 1000;

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);

  // Global state for graph data and processing
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Upload documents to get started.");
  
  // AI Provider State
  const [apiProvider, setApiProvider] = useState<ApiProvider>('zai');
  const [zaiApiKey, setZaiApiKey] = useState<string>('');
  const [zaiModel, setZaiModel] = useState<string>('glm-4.6');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [ollamaModel, setOllamaModel] = useState<string>('llama3');
  const [openrouterApiKey, setOpenrouterApiKey] = useState<string>('');
  const [openrouterModel, setOpenrouterModel] = useState<string>('google/gemma-2-9b-it:free');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme || 'light';
    document.documentElement.classList.add(initialTheme);
    if(initialTheme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    setTheme(initialTheme);

    // Load API settings
    setApiProvider(localStorage.getItem('apiProvider') as ApiProvider || 'zai');
    setZaiApiKey(localStorage.getItem('zaiApiKey') || '');
    setZaiModel(localStorage.getItem('zaiModel') || 'glm-4.6');
    setGeminiApiKey(localStorage.getItem('geminiApiKey') || '');
    setOllamaModel(localStorage.getItem('ollamaModel') || 'llama3');
    setOpenrouterApiKey(localStorage.getItem('openrouterApiKey') || '');
    setOpenrouterModel(localStorage.getItem('openrouterModel') || 'google/gemma-2-9b-it:free');
  }, []);

  useEffect(() => { localStorage.setItem('apiProvider', apiProvider); }, [apiProvider]);
  useEffect(() => { localStorage.setItem('zaiApiKey', zaiApiKey); }, [zaiApiKey]);
  useEffect(() => { localStorage.setItem('zaiModel', zaiModel); }, [zaiModel]);
  useEffect(() => { localStorage.setItem('geminiApiKey', geminiApiKey); }, [geminiApiKey]);
  useEffect(() => { localStorage.setItem('ollamaModel', ollamaModel); }, [ollamaModel]);
  useEffect(() => { localStorage.setItem('openrouterApiKey', openrouterApiKey); }, [openrouterApiKey]);
  useEffect(() => { localStorage.setItem('openrouterModel', openrouterModel); }, [openrouterModel]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', newTheme);
      return newTheme;
    });
  };
  
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (apiProvider === 'zai' && !zaiApiKey) {
      setError("Z.ai API Key is required. Please add it via the provider settings in the header.");
      setIsProviderModalOpen(true);
      return;
    }
    if (apiProvider === 'openrouter' && !openrouterApiKey) {
      setError("OpenRouter API Key is required. Please add it via the provider settings in the header.");
      setIsProviderModalOpen(true);
      return;
    }
    if (apiProvider === 'google-gemini' && !geminiApiKey) {
      setError("Google Gemini API Key is required. Please add it via the provider settings in the header.");
      setIsProviderModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage("Reading and preparing document...");
    setGraphData({ nodes: [], links: [] }); // Clear previous graph

    let text = '';
    try {
      if (file.type === 'application/pdf') {
        setStatusMessage("Extracting text from PDF...");
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        let fullText = '';
        for (let i = 1; i <= numPages; i++) {
          setStatusMessage(`Reading page ${i} of ${numPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
          fullText += pageText + '\n\n'; // Add double newline between pages
        }
        text = fullText;
      } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
        text = await file.text();
      } else {
        throw new Error(`Unsupported file type: ${file.type}. Please upload a PDF, TXT, or MD file.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while reading the file.';
      setError(`Failed to read or parse the file. ${errorMessage}`);
      setIsLoading(false);
      setStatusMessage("Error reading file.");
      console.error(err);
      return;
    }

    if (!text.trim()) {
      setError("The document appears to be empty or contains no text.");
      setIsLoading(false);
      setStatusMessage("Processing failed: empty document.");
      return;
    }

    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
      chunks.push(text.substring(i, i + CHUNK_SIZE));
    }
    
    const providerNameMap: Record<ApiProvider, string> = {
      'zai': 'Z.ai',
      'google-gemini': 'Google Gemini',
      'openrouter': 'OpenRouter',
      'ollama': 'Ollama'
    };
    const providerName = providerNameMap[apiProvider];
    setStatusMessage(`Document split into ${chunks.length} parts. Starting analysis with ${providerName}...`);

    try {
      for (const [index, chunk] of chunks.entries()) {
        setStatusMessage(`Processing chunk ${index + 1} of ${chunks.length} with ${providerName}...`);
        let newGraphData;
        switch (apiProvider) {
          case 'zai': newGraphData = await extractKnowledgeGraphZai(chunk, zaiModel, zaiApiKey); break;
          case 'google-gemini': newGraphData = await extractKnowledgeGraph(chunk, geminiApiKey); break;
          case 'ollama': newGraphData = await extractKnowledgeGraphOllama(chunk, ollamaModel); break;
          case 'openrouter': newGraphData = await extractKnowledgeGraphOpenRouter(chunk, openrouterModel, openrouterApiKey); break;
          default: throw new Error("Invalid API provider");
        }
        setGraphData(prev => {
          const existingNodeIds = new Set(prev.nodes.map(n => n.id));
          const newNodes = newGraphData.nodes.filter(n => !existingNodeIds.has(n.id));
          const getLinkId = (l: GraphLink) => `${typeof l.source === 'object' ? l.source.id : l.source}-${typeof l.target === 'object' ? l.target.id : l.target}`;
          const existingLinkIds = new Set(prev.links.map(getLinkId));
          const newLinks = newGraphData.links.filter(l => !existingLinkIds.has(getLinkId(l)));
          return { nodes: [...prev.nodes, ...newNodes], links: [...prev.links, ...newLinks] };
        });
      }
      setStatusMessage("Graph successfully built. View it in the 'Knowledge Graph' tab.");
      setActiveTab('graph');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(`Failed to extract knowledge graph. ${errorMessage}`);
      setStatusMessage("An error occurred during processing.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearGraph = () => {
    setGraphData({ nodes: [], links: [] });
    setStatusMessage("Graph cleared. Upload a new document to begin.");
  };
  
  const stats = useMemo(() => {
    const domains = new Set(graphData.nodes.map(n => n.domain).filter(Boolean));
    return {
      concepts: graphData.nodes.length,
      relationships: graphData.links.length,
      domains: domains.size,
      documents: graphData.nodes.length > 0 ? 1 : 0, // Simplified for now
    };
  }, [graphData]);


  const renderActiveView = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewView stats={stats} />;
      case 'upload':
        return <UploadView 
            onFileUpload={handleFileUpload} 
            isLoading={isLoading} 
            statusMessage={statusMessage} 
            error={error}
        />;
      case 'graph':
        return <KnowledgeGraphView 
          graphData={graphData}
          isLoading={isLoading}
          statusMessage={statusMessage}
          error={error}
          onClearGraph={handleClearGraph}
        />;
      case 'search':
        return <SearchView 
          graphData={graphData} 
          apiProvider={apiProvider} 
          zaiApiKey={zaiApiKey}
          zaiModel={zaiModel}
          geminiApiKey={geminiApiKey}
          ollamaModel={ollamaModel} 
          openrouterApiKey={openrouterApiKey} 
          openrouterModel={openrouterModel} 
        />;
      case 'learningPaths':
        return <LearningPathsView />;
      case 'insights':
        return <InsightsView stats={stats} />;
      default:
        return <OverviewView stats={stats} />;
    }
  };

  return (
    <div className={`h-full w-full font-sans flex flex-col bg-background text-foreground`}>
      <Header 
        theme={theme} 
        toggleTheme={toggleTheme} 
        apiProvider={apiProvider}
        onOpenProviderModal={() => setIsProviderModalOpen(true)}
      />
      <div className='border-b border-border'>
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <main className="flex-1 overflow-auto p-4 sm:p-8 bg-muted/30">
        {renderActiveView()}
      </main>
      <AIProviderModal 
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
        apiProvider={apiProvider} onApiProviderChange={setApiProvider}
        zaiApiKey={zaiApiKey} onZaiApiKeyChange={setZaiApiKey}
        zaiModel={zaiModel} onZaiModelChange={setZaiModel}
        geminiApiKey={geminiApiKey} onGeminiApiKeyChange={setGeminiApiKey}
        ollamaModel={ollamaModel} onOllamaModelChange={setOllamaModel}
        openrouterApiKey={openrouterApiKey} onOpenrouterApiKeyChange={setOpenrouterApiKey}
        openrouterModel={openrouterModel} onOpenrouterModelChange={setOpenrouterModel}
      />
    </div>
  );
};

export default App;