'use client';
import { useRef, useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import * as THREE from 'three';
import { ZoomIn, ZoomOut, Locate } from 'lucide-react';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

/* ── Module-level caches for WebGL performance ───────── */
const textureLoader = new THREE.TextureLoader().setCrossOrigin('anonymous');
const textureCache = new Map();
const spriteMaterialCache = new Map();

/* ── HUD button style helper ───────────────────────────── */
const hudBtnStyle = {
  width: '42px',
  height: '42px',
  borderRadius: '12px',
  background: 'rgba(0,0,0,0.50)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(249,115,22,0.25)',
  color: '#fdba74',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.25s ease',
};

export default function NebulaGraph({ nodes, links, onNodeClick, selectedNode }) {
  const graphRef = useRef();
  const hoveredNodeRef = useRef(null);
  const labelsRef = useRef([]);

  /* ── Helper: Create a floating text sprite ─────────── */
  const createTextSprite = useCallback((text) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 192;
    canvas.height = 80;

    // Pill background
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 176, 64, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(74,222,128,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(8, 8, 176, 64, 20);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 96, 44);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    return material;
  }, []);

  /* ── Pre-compute neighbor map whenever links change ──── */
  const neighborMap = useMemo(() => {
    const map = new Map();
    (links || []).forEach(link => {
      const srcId = link.source?.id ?? link.source;
      const tgtId = link.target?.id ?? link.target;
      if (!map.has(srcId)) map.set(srcId, new Set());
      if (!map.has(tgtId)) map.set(tgtId, new Set());
      map.get(srcId).add(tgtId);
      map.get(tgtId).add(srcId);
    });
    return map;
  }, [links]);

  /* ── Camera fly-to on node select ──────────────────── */
  useEffect(() => {
    if (selectedNode && graphRef.current) {
      setTimeout(() => {
        const distance = 60;
        const distRatio =
          1 + distance / Math.hypot(selectedNode.x || 0, selectedNode.y || 0, selectedNode.z || 0);
        graphRef.current.cameraPosition(
          {
            x: (selectedNode.x || 0) * distRatio - 40,
            y: (selectedNode.y || 0) * distRatio,
            z: (selectedNode.z || 0) * distRatio,
          },
          selectedNode,
          1500
        );
      }, 200);
    }
  }, [selectedNode]);

  /* ── Hover handler (ref-based, no React re-render) ── */
  const handleNodeHover = useCallback(
    (node) => {
      hoveredNodeRef.current = node || null;
      document.body.style.cursor = node ? 'pointer' : 'default';

      // Clean up previous labels (materials are cached, only remove sprites from scene)
      const scene = graphRef.current?.scene();
      labelsRef.current.forEach((lbl) => {
        scene?.remove(lbl);
        lbl.material.dispose(); // dispose the clone, not the cached original
      });
      labelsRef.current = [];

      // Update sprite opacities for focus+context dimming
      const allNodes = nodes || [];
      const neighbors = node ? neighborMap.get(node.id) : null;

      allNodes.forEach((n) => {
        if (!n.__threeObj) return;
        const mat = n.__threeObj.material;
        if (!mat) return;

        if (!node) {
          mat.opacity = 1;
        } else if (n.id === node.id || (neighbors && neighbors.has(n.id))) {
          mat.opacity = 1;
        } else {
          mat.opacity = 0.1;
        }
      });

      // Dim / restore links + collect similarity for neighbors
      const allLinks = links || [];
      const neighborSimilarity = new Map(); // neighborId -> similarity

      allLinks.forEach((link) => {
        const lineObj = link.__lineObj;
        if (!lineObj || !lineObj.material) return;
        const srcId = link.source?.id ?? link.source;
        const tgtId = link.target?.id ?? link.target;

        if (!node) {
          lineObj.material.opacity = 0.6;
        } else if (srcId === node.id || tgtId === node.id) {
          lineObj.material.opacity = 0.6;
          // Track similarity for this neighbor
          const neighborId = srcId === node.id ? tgtId : srcId;
          neighborSimilarity.set(neighborId, link.similarity || link.value || 0);
        } else {
          lineObj.material.opacity = 0.03;
        }
      });

      // Create floating similarity labels above neighbor nodes
      if (node && scene) {
        neighborSimilarity.forEach((sim, neighborId) => {
          const neighborNode = allNodes.find((n) => n.id === neighborId);
          if (!neighborNode || neighborNode.x == null) return;

          const pct = `${(sim * 100).toFixed(0)}%`;
          let cachedMaterial = spriteMaterialCache.get(pct);
          if (!cachedMaterial) {
            cachedMaterial = createTextSprite(pct);
            spriteMaterialCache.set(pct, cachedMaterial);
          }
          const label = new THREE.Sprite(cachedMaterial.clone());
          label.scale.set(10, 5, 1);
          label.renderOrder = 999;
          const nodeScale = neighborNode.val ? neighborNode.val : 10;
          label.position.set(
            neighborNode.x,
            neighborNode.y + nodeScale * 1.5 + 6,
            neighborNode.z
          );
          scene.add(label);
          labelsRef.current.push(label);
        });
      }
    },
    [nodes, links, neighborMap, createTextSprite]
  );

  /* ── Node Three Object (Poster Sprites) ────────────── */
  const nodeThreeObject = useCallback((node) => {
    if (!node.poster) {
      const geometry = new THREE.SphereGeometry(node.val || 5);
      const material = new THREE.MeshLambertMaterial({
        color: node.isSearchResult ? 0xfbbf24 : 0xf97316,
        emissive: node.isSearchResult ? 0xfbbf24 : 0xf97316,
        emissiveIntensity: node.isSearchResult ? 0.8 : 0.2,
        transparent: true,
        opacity: 1,
      });
      return new THREE.Mesh(geometry, material);
    }

    let imgTexture = textureCache.get(node.poster);
    if (!imgTexture) {
      imgTexture = textureLoader.load(`https://image.tmdb.org/t/p/w200${node.poster}`);
      imgTexture.colorSpace = THREE.SRGBColorSpace;
      textureCache.set(node.poster, imgTexture);
    }

    const material = new THREE.SpriteMaterial({
      map: imgTexture,
      transparent: true,
      opacity: 1,
    });
    const sprite = new THREE.Sprite(material);

    const baseScale = node.val ? node.val : 10;
    const scale = node.isSearchResult ? baseScale * 1.2 : baseScale;
    sprite.scale.set(scale, scale * 1.5, 1);
    sprite.renderOrder = node.isSearchResult ? 2 : 1;

    return sprite;
  }, []);

  /* ── HUD controls ──────────────────────────────────── */
  const handleZoomIn = () => {
    if (!graphRef.current) return;
    const cam = graphRef.current.camera();
    const pos = cam.position;
    graphRef.current.cameraPosition(
      { x: pos.x * 0.75, y: pos.y * 0.75, z: pos.z * 0.75 },
      null,
      600
    );
  };

  const handleZoomOut = () => {
    if (!graphRef.current) return;
    const cam = graphRef.current.camera();
    const pos = cam.position;
    graphRef.current.cameraPosition(
      { x: pos.x * 1.35, y: pos.y * 1.35, z: pos.z * 1.35 },
      null,
      600
    );
  };

  const handleRecenter = () => {
    if (!graphRef.current) return;
    if (selectedNode && selectedNode.x != null) {
      const distance = 60;
      const distRatio =
        1 + distance / Math.hypot(selectedNode.x || 0, selectedNode.y || 0, selectedNode.z || 0);
      graphRef.current.cameraPosition(
        {
          x: (selectedNode.x || 0) * distRatio - 40,
          y: (selectedNode.y || 0) * distRatio,
          z: (selectedNode.z || 0) * distRatio,
        },
        selectedNode,
        1000
      );
    } else {
      graphRef.current.cameraPosition({ x: 0, y: 0, z: 400 }, { x: 0, y: 0, z: 0 }, 1000);
    }
  };

  /* ── Link color (static, no hover dependency) ──────── */
  const linkColorFn = useCallback(
    (link) => {
      const srcId = link.source?.id ?? link.source;
      const tgtId = link.target?.id ?? link.target;
      const sourceNode = (nodes || []).find((n) => n.id === srcId);
      const targetNode = (nodes || []).find((n) => n.id === tgtId);
      if (sourceNode?.isSearchResult || targetNode?.isSearchResult) {
        return 'rgba(251,191,36,0.6)';
      }
      return 'rgba(249,115,22,0.25)';
    },
    [nodes]
  );

  const linkWidthFn = useCallback(
    (link) => {
      const srcId = link.source?.id ?? link.source;
      const tgtId = link.target?.id ?? link.target;
      const sourceNode = (nodes || []).find((n) => n.id === srcId);
      const targetNode = (nodes || []).find((n) => n.id === tgtId);
      if (sourceNode?.isSearchResult || targetNode?.isSearchResult) return 2;
      return 0.5;
    },
    [nodes]
  );

  return (
    <div className="w-full h-screen bg-black relative z-0">
      <ForceGraph3D
        ref={graphRef}
        graphData={{ nodes: nodes || [], links: links || [] }}
        nodeThreeObject={nodeThreeObject}
        nodeLabel={(node) =>
          `<div style="color: white; background: rgba(0,0,0,0.92); padding: 12px; border-radius: 10px; border: 1px solid rgba(249,115,22,0.45); max-width: 260px; backdrop-filter: blur(8px);">
            <strong style="color: #fb923c; font-size: 14px;">${node.title}</strong><br/>
            ${node.genres && node.genres !== 'Unknown' ? `<span style="color: #fdba74; font-size: 11px;">${node.genres}</span><br/>` : ''}
            ${node.rating ? `<span style="color: #fbbf24;">⭐ ${node.rating.toFixed(1)}</span>` : ''}
            ${node.score ? `<br/><span style="color: #86efac;">🎯 Match: ${(node.score * 100).toFixed(0)}%</span>` : ''}
          </div>`
        }
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.02}
        cooldownTicks={100}
        warmupTicks={50}
        linkColor={linkColorFn}
        linkWidth={linkWidthFn}
        linkOpacity={0.6}
        linkDirectionalParticles={0}
        backgroundColor="#000000"
        cameraPosition={{ z: 400 }}
        onNodeClick={(node) => {
          // Camera fly-to with left-offset so node isn't hidden behind drawer
          const distance = 60;
          const distRatio =
            1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);
          graphRef.current.cameraPosition(
            {
              x: (node.x || 0) * distRatio - 40,
              y: (node.y || 0) * distRatio,
              z: (node.z || 0) * distRatio,
            },
            node,
            1500
          );
          onNodeClick(node);
        }}
        onNodeHover={handleNodeHover}
        enableNodeDrag={true}
        enableNavigationControls={true}
        showNavInfo={false}
      />

      {/* ── Floating Navigation HUD ────────────────────── */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          display: 'flex',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '16px',
          background: 'rgba(0,0,0,0.50)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(249,115,22,0.20)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(249,115,22,0.06)',
        }}
      >
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={hudBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(249,115,22,0.20)';
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.50)';
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)';
            e.currentTarget.style.color = '#fdba74';
          }}
        >
          <ZoomIn size={20} />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={hudBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(249,115,22,0.20)';
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.50)';
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)';
            e.currentTarget.style.color = '#fdba74';
          }}
        >
          <ZoomOut size={20} />
        </button>

        <div style={{ width: '1px', background: 'rgba(249,115,22,0.20)', margin: '4px 2px' }} />

        <button
          onClick={handleRecenter}
          title="Recenter"
          style={hudBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(249,115,22,0.20)';
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.50)';
            e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)';
            e.currentTarget.style.color = '#fdba74';
          }}
        >
          <Locate size={20} />
        </button>
      </div>
    </div>
  );
}