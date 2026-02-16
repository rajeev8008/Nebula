'use client';
import { useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function NebulaGraph({ nodes, links, onNodeClick, selectedNode }) {
  const graphRef = useRef();

  // Auto-zoom to selected node
  useEffect(() => {
    if (selectedNode && graphRef.current) {
      // Wait for graph to settle
      setTimeout(() => {
        const distance = 60;
        const distRatio = 1 + distance/Math.hypot(selectedNode.x || 0, selectedNode.y || 0, selectedNode.z || 0);
        
        graphRef.current.cameraPosition(
          { 
            x: (selectedNode.x || 0) * distRatio, 
            y: (selectedNode.y || 0) * distRatio, 
            z: (selectedNode.z || 0) * distRatio 
          },
          selectedNode,
          1500
        );
      }, 500);
    }
  }, [selectedNode]);

  // Function to create image nodes with movie posters
  const nodeThreeObject = useCallback((node) => {
    if (!node.poster) {
      // Fallback: sphere for movies without posters
      const geometry = new THREE.SphereGeometry(node.val || 5);
      const material = new THREE.MeshLambertMaterial({ 
        color: node.isSearchResult ? 0xfbbf24 : 0xf97316,
        emissive: node.isSearchResult ? 0xfbbf24 : 0xf97316,
        emissiveIntensity: node.isSearchResult ? 0.8 : 0.2
      });
      return new THREE.Mesh(geometry, material);
    }

    // Create a sprite with movie poster texture
    const imgTexture = new THREE.TextureLoader().load(
      `https://image.tmdb.org/t/p/w200${node.poster}`
    );
    imgTexture.colorSpace = THREE.SRGBColorSpace;
    
    const material = new THREE.SpriteMaterial({ 
      map: imgTexture,
      transparent: true,
      opacity: 1
    });
    const sprite = new THREE.Sprite(material);
    
    // Scale sprite based on rating - make search results slightly larger
    const baseScale = node.val ? node.val : 10;
    const scale = node.isSearchResult ? baseScale * 1.2 : baseScale;
    sprite.scale.set(scale, scale * 1.5, 1); // Aspect ratio for movie posters
    
    sprite.renderOrder = node.isSearchResult ? 2 : 1; // Render search results on top
    
    return sprite;
  }, []);

  return (
    <div className="w-full h-screen bg-black relative z-0">
      <ForceGraph3D
        ref={graphRef}
        graphData={{ nodes: nodes || [], links: links || [] }}
        
        // Use movie posters as textures
        nodeThreeObject={nodeThreeObject}
        nodeLabel={(node) => `<div style="color: white; background: rgba(0,0,0,0.9); padding: 12px; border-radius: 8px; border: 1px solid rgba(249,115,22,0.5); max-width: 250px;">
          <strong style="color: #fb923c; font-size: 14px;">${node.title}</strong><br/>
          ${node.genres && node.genres !== 'Unknown' ? `<span style="color: #fdba74; font-size: 11px;">${node.genres}</span><br/>` : ''}
          ${node.rating ? `<span style="color: #fbbf24;">⭐ ${node.rating.toFixed(1)}</span>` : ''}
          ${node.score ? `<br/><span style="color: #86efac;">🎯 Match: ${(node.score * 100).toFixed(0)}%</span>` : ''}
        </div>`}
        
        // Physics settings for better layout
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.02}
        cooldownTicks={100}
        warmupTicks={50}
        
        // Link styling - subtle orange lines
        linkColor={(link) => {
          // Highlight links connected to search results
          const sourceNode = nodes.find(n => n.id === (link.source.id || link.source));
          const targetNode = nodes.find(n => n.id === (link.target.id || link.target));
          if (sourceNode?.isSearchResult || targetNode?.isSearchResult) {
            return 'rgba(251, 191, 36, 0.6)'; // Brighter for search results
          }
          return 'rgba(249, 115, 22, 0.25)';
        }}
        linkWidth={(link) => {
          const sourceNode = nodes.find(n => n.id === (link.source.id || link.source));
          const targetNode = nodes.find(n => n.id === (link.target.id || link.target));
          if (sourceNode?.isSearchResult || targetNode?.isSearchResult) {
            return 2;
          }
          return 0.5;
        }}
        linkOpacity={0.6}
        linkDirectionalParticles={0}
        
        backgroundColor="#000000"
        
        // Better initial camera distance
        cameraPosition={{ z: 400 }}
        
        // Node interaction
        onNodeClick={(node) => {
          const distance = 60;
          const distRatio = 1 + distance/Math.hypot(node.x || 0, node.y || 0, node.z || 0);
          graphRef.current.cameraPosition(
            { x: (node.x || 0) * distRatio, y: (node.y || 0) * distRatio, z: (node.z || 0) * distRatio },
            node,
            1500
          );
          onNodeClick(node);
        }}
        
        onNodeHover={(node) => {
          document.body.style.cursor = node ? 'pointer' : 'default';
        }}
        
        // Enable controls
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
      />
    </div>
  );
}