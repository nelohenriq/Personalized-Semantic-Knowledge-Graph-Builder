import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '../components/Sidebar';
import Graph from '../components/Graph';
import NodeDetailPanel from '../components/NodeDetailPanel';
import { GraphData, GraphNode } from '../types';
import * as d3 from 'd3';
import { FilterIcon } from '../components/icons/FilterIcon';

const defaultColorScale = d3.scaleOrdinal<string>(d3.schemeTableau10);

interface KnowledgeGraphViewProps {
    graphData: GraphData;
    isLoading: boolean;
    statusMessage: string;
    error: string | null;
    onClearGraph: () => void;
}

const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
    graphData, isLoading, statusMessage, error, onClearGraph
}) => {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [domainColors, setDomainColors] = useState<Record<string, string>>({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const storedColors = localStorage.getItem('domainColors');
    if (storedColors) setDomainColors(JSON.parse(storedColors));
  }, []);

  useEffect(() => { localStorage.setItem('domainColors', JSON.stringify(domainColors)); }, [domainColors]);

  const allDomains = useMemo(() => Array.from(new Set(graphData.nodes.map(n => n.domain || 'Unknown'))).sort(), [graphData.nodes]);

  useEffect(() => {
    setDomainColors(prev => {
      const newColors = { ...prev };
      let updated = false;
      allDomains.forEach(domain => {
        if (!newColors[domain]) {
          newColors[domain] = defaultColorScale(domain);
          updated = true;
        }
      });
      return updated ? newColors : prev;
    });
  }, [allDomains]);


  const handleNodeClick = useCallback((node: GraphNode) => setSelectedNode(node), []);
  
  const handleClearGraphWithReset = () => {
    onClearGraph();
    setSelectedNode(null);
    setSearchQuery('');
    setConfidenceThreshold(0);
  };

  const handleDomainColorChange = (domain: string, color: string) => {
    setDomainColors(prev => ({ ...prev, [domain]: color }));
  };

  const filteredGraphData = useMemo(() => {
    const { nodes, links } = graphData;
    if (confidenceThreshold === 0) return graphData;
    const filteredLinks = links.filter(link => (link.confidence ?? 1) >= confidenceThreshold);
    const visibleNodeIds = new Set<string>();
    filteredLinks.forEach(link => {
      visibleNodeIds.add(typeof link.source === 'object' ? link.source.id : link.source as string);
      visibleNodeIds.add(typeof link.target === 'object' ? link.target.id : link.target as string);
    });
    const filteredNodes = nodes.filter(node => visibleNodeIds.has(node.id));
    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, confidenceThreshold]);

  return (
    <div className="flex h-full w-full bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex-1 w-full h-full relative graph-background">
        <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute top-4 right-4 z-20 p-2 bg-card/80 backdrop-blur-sm rounded-full border border-border text-muted-foreground hover:text-foreground"
            aria-label="Toggle filters"
        >
            <FilterIcon className="w-5 h-5" />
        </button>
        {graphData.nodes.length === 0 && !isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center p-8 flex flex-col items-center">
                    <h2 className="text-2xl font-semibold text-muted-foreground mb-2">Graph is Empty</h2>
                    <p className="text-muted-foreground max-w-sm mb-4">Go to the 'Upload' tab to process a document and build your graph.</p>
                    {error && <p className="text-destructive mt-4">{error}</p>}
                </div>
            </div>
        ) : filteredGraphData.nodes.length === 0 && !isLoading ? (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center p-8">
                <h2 className="text-2xl font-semibold text-muted-foreground mb-2">No nodes match filters</h2>
                <p className="text-muted-foreground">Try adjusting the confidence threshold or search query.</p>
              </div>
            </div>
        ) : (
          <Graph 
            graphData={filteredGraphData} 
            onNodeClick={handleNodeClick} 
            selectedNodeId={selectedNode?.id || null} 
            searchQuery={searchQuery}
            domainColors={domainColors}
            colorScale={defaultColorScale}
          />
        )}
         {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="flex flex-col items-center space-y-4">
                 <svg className="w-16 h-16 text-primary animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
                 <p className="text-lg text-foreground">{statusMessage}</p>
              </div>
            </div>
          )}
          <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
      </div>
       <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onClearGraph={handleClearGraphWithReset}
        isLoading={isLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        confidence={confidenceThreshold}
        onConfidenceChange={setConfidenceThreshold}
        domains={allDomains}
        domainColors={domainColors}
        onDomainColorChange={handleDomainColorChange}
      />
    </div>
  );
};

export default KnowledgeGraphView;
