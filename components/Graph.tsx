import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { GraphData, GraphNode, GraphLink } from '../types';

interface GraphProps {
  graphData: GraphData;
  onNodeClick: (node: GraphNode) => void;
  selectedNodeId: string | null;
  searchQuery: string;
  domainColors: Record<string, string>;
  colorScale: d3.ScaleOrdinal<string, string, never>;
}

const Graph: React.FC<GraphProps> = ({ graphData, onNodeClick, selectedNodeId, searchQuery, domainColors, colorScale }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !svgRef.current.parentElement || !tooltipRef.current) return;
    const svgElement = svgRef.current;
    const parentElement = svgElement.parentElement;
    const tooltipElement = tooltipRef.current;

    const svg = d3.select(svgElement);
    const mainContainer = svg.select<SVGGElement>('.main-container');
    const width = parentElement.clientWidth;
    const height = parentElement.clientHeight;
    svg.attr('width', width).attr('height', height);

    const tooltip = d3.select(tooltipElement);

    let link = mainContainer.select<SVGGElement>('.links').selectAll<SVGPathElement, GraphLink>('path');
    let node = mainContainer.select<SVGGElement>('.nodes').selectAll<SVGGElement, GraphNode>('g');
    let text = mainContainer.select<SVGGElement>('.texts').selectAll<SVGTextElement, GraphNode>('text');

    const updateGraph = () => {
      const nodes: GraphNode[] = graphData.nodes.map(d => ({ ...d }));
      const links: GraphLink[] = graphData.links.map(d => ({ ...d }));

      if (!simulationRef.current) {
        simulationRef.current = d3.forceSimulation<GraphNode, GraphLink>()
          .force('link', d3.forceLink().id((d: any) => d.id).distance(100))
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(width / 2, height / 2));
      }
      const simulation = simulationRef.current;
      
      simulation.nodes(nodes);
      (simulation.force('link') as d3.ForceLink<GraphNode, GraphLink>)!.links(links);

      link = link
        .data(links, d => {
            const sourceId = typeof d.source === 'object' && d.source !== null ? d.source.id : d.source;
            const targetId = typeof d.target === 'object' && d.target !== null ? d.target.id : d.target;
            return `${sourceId}-${targetId}`;
        })
        .join('path')
        .attr('stroke', 'var(--border)')
        .attr('stroke-opacity', 0.6)
        .attr('fill', 'none')
        .style('vector-effect', 'non-scaling-stroke');

      node = node
        .data(nodes, d => d.id)
        .join(enter => {
          const g = enter.append('g')
            .call(drag(simulation) as any)
            .on('mouseover', (event, d) => {
              tooltip.style('opacity', 1)
                     .html(`<strong class="text-foreground">${d.label}</strong><br/><span class="text-xs text-muted-foreground">${d.domain || 'Unknown'}</span>`);
            })
            .on('mousemove', (event) => {
              tooltip.style('left', (event.pageX + 15) + 'px')
                     .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
              tooltip.style('opacity', 0);
            });
          
          g.append('circle')
            .attr('r', 10)
            .attr('stroke', 'var(--card)')
            .attr('stroke-width', 2)
            .style('vector-effect', 'non-scaling-stroke')
            .on('click', (event, d) => {
              event.stopPropagation();
              onNodeClick(d);
            });

          return g;
        });

      node.select('circle')
        .attr('fill', d => domainColors[d.domain || 'Unknown'] || colorScale(d.domain || 'Unknown'));
      
      text = text
        .data(nodes, d => d.id)
        .join('text')
          .attr('x', 15)
          .attr('y', '0.31em')
          .attr('font-size', '11px')
          .attr('fill', 'var(--muted-foreground)')
          .text(d => d.label);

      const ticked = () => {
        link.attr('d', d => {
            const source = d.source as GraphNode;
            const target = d.target as GraphNode;
            return `M${source.x || 0},${source.y || 0} L${target.x || 0},${target.y || 0}`;
        });
        node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
        text.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
      };

      simulation.on('tick', ticked);
      simulation.alpha(1).restart();
    };

    updateGraph();
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        mainContainer.attr('transform', event.transform);
      });
    
    svg.call(zoom);

    const resizeObserver = new ResizeObserver(() => {
        if (!svgElement.parentElement) return;
        const newWidth = svgElement.parentElement.clientWidth;
        const newHeight = svgElement.parentElement.clientHeight;
        svg.attr('width', newWidth).attr('height', newHeight);
        simulationRef.current?.force('center', d3.forceCenter(newWidth / 2, newHeight / 2)).restart();
    });
    resizeObserver.observe(parentElement);

    return () => resizeObserver.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphData, onNodeClick, domainColors]); // dependency on domainColors to re-render fill

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const lowerCaseQuery = searchQuery.trim().toLowerCase();

    const nodes = svg.select('.nodes').selectAll<SVGGElement, GraphNode>('g');
    nodes
      .style('opacity', d => {
        if (!lowerCaseQuery) return 1;
        return d.label.toLowerCase().includes(lowerCaseQuery) ? 1 : 0.1;
      })
      .select('circle')
      .transition().duration(200)
      .attr('r', d => selectedNodeId === d.id ? 15 : 10)
      .attr('fill', d => {
        const isSelected = d.id === selectedNodeId;
        const isLinked = graphData.links.some(l => {
          if (!l.source || !l.target || !selectedNodeId) return false;
          const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
          const targetId = typeof l.target === 'object' ? l.target.id : l.target;
          return (sourceId === selectedNodeId && targetId === d.id) || (targetId === selectedNodeId && sourceId === d.id);
        });

        if (isSelected) return 'var(--accent-green)';
        if (isLinked) return 'blue'; // highlight color
        return domainColors[d.domain || 'Unknown'] || colorScale(d.domain || 'Unknown');
      });

    svg.select('.links').selectAll<SVGPathElement, GraphLink>('path')
      .transition().duration(200)
      .attr('stroke', d => {
        const sourceId = typeof d.source === 'object' && d.source !== null ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' && d.target !== null ? d.target.id : d.target;
        return (sourceId === selectedNodeId || targetId === selectedNodeId) ? 'var(--accent-green)' : 'var(--border)';
      })
      .attr('stroke-width', d => {
        const sourceId = typeof d.source === 'object' && d.source !== null ? d.source.id : d.source;
        const targetId = typeof d.target === 'object' && d.target !== null ? d.target.id : d.target;
        return (sourceId === selectedNodeId || targetId === selectedNodeId) ? 2 : 1;
      })
      .style('opacity', d => {
        if (!lowerCaseQuery) return 0.6;
        const sourceNode = d.source as GraphNode;
        const targetNode = d.target as GraphNode;
        if (!sourceNode.label || !targetNode.label) return 0.05;
        const sourceMatch = sourceNode.label.toLowerCase().includes(lowerCaseQuery);
        const targetMatch = targetNode.label.toLowerCase().includes(lowerCaseQuery);
        return (sourceMatch && targetMatch) ? 0.6 : 0.05;
      });

    svg.select('.texts').selectAll<SVGTextElement, GraphNode>('text')
      .transition().duration(200)
      .style('opacity', d => {
        if (!lowerCaseQuery) return 1;
        return d.label.toLowerCase().includes(lowerCaseQuery) ? 1 : 0.1;
      });

  }, [selectedNodeId, graphData.links, searchQuery, domainColors, colorScale]);


  const drag = (simulation: d3.Simulation<GraphNode, any>) => {
    function dragstarted(event: d3.D3DragEvent<any, any, any>, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<any, any, any>, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<any, any, any>, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  return (
    <>
      <svg ref={svgRef} className="w-full h-full">
        <g className="main-container">
          <g className="links"></g>
          <g className="nodes"></g>
          <g className="texts"></g>
        </g>
      </svg>
      <div 
        ref={tooltipRef} 
        className="absolute p-2 text-sm rounded-md pointer-events-none transition-opacity duration-200 opacity-0 bg-popover text-popover-foreground shadow-lg border border-border"
      ></div>
    </>
  );
};

export default Graph;
