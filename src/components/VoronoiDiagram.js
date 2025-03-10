// /Users/paolopignatelli/VerbumTechnologies/Verbum7-Claude/frontend/src/components/VoronoiDiagram.js
import React, { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { updateDomainPositions } from '../services/apiService';
import '../styles/VoronoiDiagram.css';

const VoronoiDiagram = ({ 
  domains, 
  semanticDistances, 
  width, 
  height, 
  onDomainClick, 
  onDocumentClick,
  onDeleteDomain
}) => {
  const svgRef = useRef();
  const diagramRef = useRef();

  // Helper: Arrange domains in a circle
  const arrangeInCircle = useCallback((domains, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;
    return domains.map((domain, i) => ({
      ...domain,
      x: centerX + radius * Math.cos((i / domains.length) * 2 * Math.PI),
      y: centerY + radius * Math.sin((i / domains.length) * 2 * Math.PI)
    }));
  }, []);

  // Helper: Position domains using D3 force layout based on semantic distances
  const positionWithForces = useCallback((domains, semanticDistances, width, height) => {
    if (domains.length === 1) {
      return [{
        ...domains[0],
        x: width / 2,
        y: height / 2
      }];
    }
    
    const positionedDomains = domains.map(domain => ({
      ...domain,
      x: domain.x || Math.random() * width,
      y: domain.y || Math.random() * height
    }));
    
    const links = [];
    if (positionedDomains.length >= 2) {
      Object.entries(semanticDistances).forEach(([pair, distance]) => {
        const [id1, id2] = pair.split('|');
        const source = positionedDomains.find(d => d.id === id1);
        const target = positionedDomains.find(d => d.id === id2);
        if (source && target) {
          links.push({
            source,
            target,
            distance: distance * 300 // Scale factor
          });
        }
      });
      if (links.length === 0) {
        for (let i = 0; i < positionedDomains.length; i++) {
          const next = (i + 1) % positionedDomains.length;
          links.push({
            source: positionedDomains[i],
            target: positionedDomains[next],
            distance: 150
          });
        }
      }
    }
    
    const iterationCount = domains.length > 20 ? 100 : 300;
    try {
      const simulation = d3.forceSimulation(positionedDomains)
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(50))
        .stop();
      
      if (links.length > 0) {
        simulation.force('link', d3.forceLink(links)
          .id(d => d.id)
          .distance(link => link.distance)
        );
      }
      
      for (let i = 0; i < iterationCount; ++i) simulation.tick();
    } catch (error) {
      console.error("Force layout error:", error);
      return arrangeInCircle(domains, width, height);
    }
    
    positionedDomains.forEach(domain => {
      domain.x = Math.max(50, Math.min(width - 50, domain.x || width / 2));
      domain.y = Math.max(50, Math.min(height - 50, domain.y || height / 2));
    });
    
    return positionedDomains;
  }, [arrangeInCircle]);

  // Compute positions for domains based on existing positions or force layout.
  const positionDomains = useCallback((domains, semanticDistances, width, height) => {
    const positionedDomains = [...domains];
    const hasPositions = positionedDomains.every(domain => 
      typeof domain.x === 'number' && typeof domain.y === 'number' &&
      domain.x !== 0 && domain.y !== 0
    );
    if (hasPositions) {
      return positionedDomains;
    }
    if (Object.keys(semanticDistances).length > 0) {
      return positionWithForces(positionedDomains, semanticDistances, width, height);
    }
    return arrangeInCircle(positionedDomains, width, height);
  }, [positionWithForces, arrangeInCircle]);

  const createVoronoiDiagram = useCallback((domains) => {
    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current);
    const delaunay = d3.Delaunay.from(domains, d => d.x, d => d.y);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    
    const cells = svg.selectAll('g.cell')
      .data(domains)
      .enter()
      .append('g')
      .attr('class', 'cell')
      .style('cursor', 'pointer');
    
    cells.append('path')
      .attr('d', (d, i) => voronoi.renderCell(i))
      .attr('fill', (d, i) => d3.interpolateRainbow(i / domains.length))
      .attr('fill-opacity', 0.7)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        event.stopPropagation();
        onDomainClick(d);
      })
      .on('mouseover', function() {
        d3.select(this).attr('fill-opacity', 0.9);
      })
      .on('mouseout', function() {
        d3.select(this).attr('fill-opacity', 0.7);
      });
    
    cells.append('text')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('class', 'domain-label')
      .text(d => d.name)
      .attr('pointer-events', 'none');
    
    cells.append('circle')
      .attr('cx', d => d.x + 30)
      .attr('cy', d => d.y - 30)
      .attr('r', 8)
      .attr('fill', '#ef4444')
      .attr('class', 'delete-button')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('click', (event, d) => {
        event.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${d.name}" and all its children?`)) {
          onDeleteDomain(d.id);
        }
      });
    
    cells.append('text')
      .attr('x', d => d.x + 30)
      .attr('y', d => d.y - 30)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('class', 'delete-icon')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text('×')
      .on('click', (event, d) => {
        event.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${d.name}" and all its children?`)) {
          onDeleteDomain(d.id);
        }
      });
    
    domains.forEach(domain => {
      if (domain.documents && domain.documents.length > 0) {
        const docGroup = svg.append('g')
          .attr('class', 'documents')
          .attr('transform', `translate(${domain.x}, ${domain.y + 40})`);
        
        docGroup.selectAll('circle.doc-icon')
          .data(domain.documents)
          .enter()
          .append('circle')
          .attr('class', 'doc-icon')
          .attr('cx', (d, i) => {
            const spacing = Math.min(20, 100 / (domain.documents.length + 1));
            return (i - (domain.documents.length - 1) / 2) * spacing;
          })
          .attr('cy', 0)
          .attr('r', 8)
          .attr('fill', '#4b5563')
          .on('click', (event, d) => {
            event.stopPropagation();
            onDocumentClick(d);
          });
        
        docGroup.selectAll('text.doc-text')
          .data(domain.documents)
          .enter()
          .append('text')
          .attr('class', 'doc-text')
          .attr('x', (d, i) => {
            const spacing = Math.min(20, 100 / (domain.documents.length + 1));
            return (i - (domain.documents.length - 1) / 2) * spacing;
          })
          .attr('y', 0)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '9px')
          .text('📄')
          .on('click', (event, d) => {
            event.stopPropagation();
            onDocumentClick(d);
          });
      }
    });
  }, [width, height, onDomainClick, onDocumentClick, onDeleteDomain]);

  useEffect(() => {
    if (!svgRef.current || !domains || domains.length === 0) return;
    const positionedDomains = positionDomains(domains, semanticDistances, width, height);
    createVoronoiDiagram(positionedDomains);
    diagramRef.current = positionedDomains;
    const positions = {};
    positionedDomains.forEach(domain => {
      positions[domain.id] = { x: domain.x, y: domain.y };
    });
    updateDomainPositions(positions).catch(err => {
      console.error('Error updating domain positions:', err);
    });
  }, [domains, semanticDistances, width, height, positionDomains, createVoronoiDiagram]);
  
  return (
    <div className="voronoi-container">
      <svg ref={svgRef} width={width} height={height}></svg>
    </div>
  );
};

export default VoronoiDiagram;
