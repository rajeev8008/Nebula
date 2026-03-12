'use client';
import { useRef, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { ZoomIn, ZoomOut, Locate } from 'lucide-react';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

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

const imageCache = new Map();

export default function NebulaGraph({ nodes, links, onNodeClick, centralNodeId }) {
  const graphRef = useRef();
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    const fg = graphRef.current;
    if (!fg || !nodes?.length) return;
    const t = setTimeout(() => {
      // Connected Papers style spread
      fg.d3Force('charge')?.strength(-300);
      fg.d3Force('link')?.distance((link) => {
        const sim = link.similarity || link.value || 0.5;
        // High similarity = short distance, low = long
        return 50 / Math.max(sim, 0.1); 
      });
      if (typeof window !== 'undefined') {
        import('d3-force').then(d3 => {
           // Base collision radius on poster size
           fg.d3Force('collide', d3.forceCollide().radius(n => {
               const voteCount = n.vote_count || 100;
               const size = Math.min(Math.max(Math.sqrt(voteCount) / 10, 4), 16);
               return (size * 2) + 20; // Enough room for the poster and spacing
           }));
        });
      }
      fg.d3ReheatSimulation();
    }, 300);
    return () => clearTimeout(t);
  }, [nodes, links]);

  useEffect(() => {
    if (centralNodeId && graphRef.current) {
        const centralNode = nodes.find(n => n.id === centralNodeId);
        if (centralNode) {
            setTimeout(() => {
                if (graphRef.current) {
                    graphRef.current.centerAt(
                        (centralNode.x || 0) + 30, 
                        (centralNode.y || 0), 
                        1000
                    );
                    graphRef.current.zoom(2, 1000);
                }
            }, 500);
        }
    }
  }, [centralNodeId, nodes]);

  const handleZoomIn = () => {
    if (!graphRef.current) return;
    const currentZoom = graphRef.current.zoom();
    graphRef.current.zoom(currentZoom * 1.5, 600);
  };

  const handleZoomOut = () => {
    if (!graphRef.current) return;
    const currentZoom = graphRef.current.zoom();
    graphRef.current.zoom(currentZoom / 1.5, 600);
  };

  const handleRecenter = () => {
    if (!graphRef.current) return;
    const centralNode = nodes.find(n => n.id === centralNodeId);
    if (centralNode && centralNode.x != null) {
        graphRef.current.centerAt(
          (centralNode.x || 0) + 30, 
          (centralNode.y || 0), 
          1000
        );
        graphRef.current.zoom(2, 1000);
    } else {
      graphRef.current.zoomToFit(1000, 50);
    }
  };

  const drawNode = useCallback((node, ctx, globalScale) => {
    const isCentral = node.id === centralNodeId;
    const isHovered = hoveredNode?.id === node.id;
    const isDimmed = hoveredNode && !isHovered;
    
    // Size scales with vote count
    const voteCount = node.vote_count || 100;
    // Base size bounded between 4 and 16
    const baseSize = Math.min(Math.max(Math.sqrt(voteCount) / 10, 4), 16);
    
    // Poster dimensions
    const imgWidth = (isCentral ? baseSize * 1.5 : baseSize) * 4;
    const imgHeight = imgWidth * 1.5;
    const x = node.x - imgWidth / 2;
    const y = node.y - imgHeight / 2;
    const r = 6; // slightly rounded corners for poster

    ctx.globalAlpha = isDimmed ? 0.2 : 1;

    // Draw Poster Rectangle (Background fallback)
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x, y, imgWidth, imgHeight, r);
    } else {
        ctx.rect(x, y, imgWidth, imgHeight);
    }
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fill();
    ctx.clip(); // Clip for image

    if (node.poster) {
      let img = imageCache.get(node.poster);
      if (!img) {
        img = new Image();
        img.src = `https://image.tmdb.org/t/p/w200${node.poster}`;
        imageCache.set(node.poster, img);
      }
      if (img.complete && img.naturalHeight !== 0) {
        ctx.drawImage(img, x, y, imgWidth, imgHeight);
      }
    }
    // Dark overlay so text is readable
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, imgWidth, imgHeight);
    ctx.restore();

    // Central Node Glowing Ring
    if (isCentral || isHovered) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x - 2, y - 2, imgWidth + 4, imgHeight + 4, r + 2);
        } else {
            ctx.rect(x - 2, y - 2, imgWidth + 4, imgHeight + 4);
        }
        ctx.lineWidth = isCentral ? 3 : 2;
        ctx.strokeStyle = isCentral ? '#fbbf24' : '#f97316';
        if (isCentral) {
            ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
            ctx.shadowBlur = 15;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
    } else {
        // Normal border
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, imgWidth, imgHeight, r);
        } else {
            ctx.rect(x, y, imgWidth, imgHeight);
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#334155';
        ctx.stroke();
    }

    // Centered Text Overlay matching site typography
    const fontSize = Math.max(10 / globalScale, 3);
    if (imgWidth > fontSize * 2) {
        ctx.font = `800 ${Math.min(fontSize, imgWidth / 5)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Multi-line wrap or truncate? We will truncate to fit poster width
        const title = node.title;
        ctx.fillStyle = isCentral ? '#fbbf24' : '#ffffff';
        
        let displayTitle = title;
        if (ctx.measureText(displayTitle).width > imgWidth - 4) {
             while(displayTitle.length > 0 && ctx.measureText(displayTitle + '...').width > imgWidth - 6) {
                 displayTitle = displayTitle.slice(0, -1);
             }
             displayTitle += '...';
        }
        
        ctx.fillText(displayTitle, node.x, node.y);
    }
    
    ctx.globalAlpha = 1;

  }, [centralNodeId, hoveredNode]);

  const drawLink = useCallback((link, ctx, globalScale) => {
    const start = link.source;
    const end = link.target;
    if (!start.x || !start.y || !end.x || !end.y) return;

    const isHovered = hoveredNode !== null;
    const involvesHovered = isHovered && (start.id === hoveredNode.id || end.id === hoveredNode.id);
    const isCentralLink = link.isCentralLink;
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    
    const sim = link.similarity || link.value || 0.5;
    
    if (isHovered && !involvesHovered) {
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.2)'; // Faded out
      ctx.lineWidth = 0.5 / globalScale;
    } else if (involvesHovered) {
      ctx.strokeStyle = `rgba(249, 115, 22, ${Math.max(sim, 0.5)})`; // Orange accent
      ctx.lineWidth = (sim * 5) / globalScale;
    } else {
      // Scale edge thickness and opacity with similarity
      ctx.strokeStyle = isCentralLink 
            ? `rgba(249, 115, 22, ${Math.max(sim * 0.7, 0.2)})`  // Central link orange
            : `rgba(251, 191, 36, ${Math.max(sim * 0.5, 0.1)})`; // Cross link yellow
            
      ctx.lineWidth = (sim * 3) / globalScale;
    }
    
    ctx.stroke();
  }, [hoveredNode]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900 relative z-0" style={{ cursor: hoveredNode ? 'pointer' : 'grab' }}>
      <ForceGraph2D
        ref={graphRef}
        graphData={{ nodes: nodes || [], links: links || [] }}
        nodeCanvasObject={drawNode}
        linkCanvasObject={drawLink}
        d3VelocityDecay={0.3}
        d3AlphaDecay={0.02}
        cooldownTicks={150}
        warmupTicks={50}
        onNodeClick={(node) => {
          graphRef.current.centerAt(
            (node.x || 0) + 30, 
            (node.y || 0), 
            1000
          );
          graphRef.current.zoom(2.5, 1000);
          onNodeClick(node);
        }}
        onNodeHover={(node) => setHoveredNode(node || null)}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />

      {/* Floating Navigation HUD */}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: 'calc(50% + 180px)', // Offset to account for the 360px left panel
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