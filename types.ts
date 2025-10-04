import { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

// Fix: Add explicit properties to GraphNode that are provided by d3 simulation.
export interface GraphNode extends SimulationNodeDatum {
  id: string;
  label: string;
  domain?: string;
  sourceText?: string;
  definition?: string;
  x?: number;
  y?: number;
}

// Fix: Add explicit source and target properties to GraphLink.
export interface GraphLink extends SimulationNodeDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
  confidence?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface SearchResult {
  answer: string;
  relevantNodes: GraphNode[];
  relevantLinks: GraphLink[];
}

export type ApiProvider = 'zai' | 'google-gemini' | 'openrouter' | 'ollama';