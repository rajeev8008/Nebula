'use client';
import { useRef } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function NebulaGraph({ nodes, onNodeClick }) {
  const graphRef = useRef();
  return (
    <div className="w-full h-screen bg-black">
      <ForceGraph3D
        ref={graphRef}
        graphData={{ nodes, links: [] }}
        nodeLabel="title"
        nodeColor={() => "#00f3ff"}
        nodeVal={5}
        nodeResolution={16}
        backgroundColor="#000000"
        onNodeClick={(node) => {
            const distance = 40;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
            graphRef.current.cameraPosition(
              { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
              node, 3000
            );
            onNodeClick(node);
        }}
      />
    </div>
  );
}