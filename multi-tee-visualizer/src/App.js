import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import styled from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import ForceGraph from 'r3f-forcegraph';
import LogViewer from './components/LogViewer';
import { blockchainService } from './services/blockchainService';
import './App.css';
import * as THREE from 'three';

// import TEE node images
import secureNodeImg from './assets/secure_TEE.png';
import warningNodeImg from './assets/warning_TEE.png';
import anomalyNodeImg from './assets/anomaly_TEE.png';

// preload images for better performance
const nodeImages = {
  secure: secureNodeImg,
  warning: warningNodeImg,
  anomaly: anomalyNodeImg
};

// create texture loader cache
const textureLoader = new THREE.TextureLoader();
const textureCache = {};

// preload textures - use immediate loading to prevent issues
Object.entries(nodeImages).forEach(([key, src]) => {
  console.log(`[App.js] Loading texture for ${key} status`);
  const texture = textureLoader.load(src, 
    // onLoad callback
    (loaded) => console.log(`[App.js] Successfully loaded texture for ${key}`),
    // onProgress callback
    undefined,
    // onError callback
    (err) => console.error(`[App.js] Error loading texture for ${key}:`, err)
  );
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache[key] = texture;
});

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  height: 100vh;
  background-color: #000000;
  color: #a0a0a0;
  overflow: hidden;
`;

const Header = styled.header`
  background-color: #050510;
  color: #a0a0a0;
  padding: 12px 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  z-index: 100;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #61dafb;
`;

const Subtitle = styled.p`
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #aaa;
`;

const Main = styled.main`
  display: flex;
  flex: 1;
  padding: 16px;
  overflow: hidden;
  height: calc(100% - 130px); /* Account for header and footer */
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const VisualizerSection = styled.section`
  flex: 2;
  margin-right: 16px;
  position: relative;
  height: 100%;
  overflow: hidden;
  background-color: #050510;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  
  @media (max-width: 768px) {
    margin-right: 0;
    margin-bottom: 16px;
    height: 60%;
    min-height: 400px;
  }
`;

const LogSection = styled.section`
  flex: 1;
  min-width: 350px;
  height: 100%;
  
  @media (max-width: 768px) {
    height: 40%;
    min-height: 300px;
  }
`;

const BlockInfo = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 4px;
  margin-left: auto;
  font-size: 12px;
`;

const BlockNumber = styled.span`
  color: #61dafb;
  font-weight: bold;
  margin-left: 5px;
`;

const Footer = styled.footer`
  background-color: #050510;
  color: #606060;
  padding: 8px 24px;
  font-size: 12px;
  text-align: center;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.5);
  z-index: 100;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(26, 26, 46, 0.8);
  z-index: 10;
  color: #61dafb;
  font-size: 1.2rem;
`;

// wrapper component to apply frame updates to ForceGraph
const ForceGraphWithUpdates = ({ data, graphConfig }) => {
  const fgRef = useRef();
  
  useFrame(() => {
    if (fgRef.current && fgRef.current.tickFrame) {
      fgRef.current.tickFrame();
    }
  });
  
  return (
    <ForceGraph
      ref={fgRef}
      graphData={data}
      {...graphConfig}
    />
  );
};

// helper function to create text canvas for node labels
const createTextCanvas = (text) => {
  // use a memoization approach for better performance
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const fontSize = 24;
  ctx.font = `${fontSize}px Arial`;
  
  // set canvas dimensions slightly larger than text
  const textWidth = ctx.measureText(text).width;
  canvas.width = textWidth + 10;
  canvas.height = fontSize + 8;
  
  // fill background (transparent)
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // draw text
  ctx.font = `${fontSize}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  
  return canvas;
};

function App() {
  const [latestBlock, setLatestBlock] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  
  useEffect(() => {
    // fetch latest block info on load
    const fetchBlockInfo = async () => {
      const blockInfo = await blockchainService.getLatestBlock();
      setLatestBlock(blockInfo);
    };
    
    // fetch graph data from blockchain service
    const fetchGraphData = async () => {
      setIsLoading(true);
      try {
        const data = await blockchainService.fetchTEEData();
        setGraphData(data);
      } catch (err) {
        console.error('[App.js] Error fetching graph data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBlockInfo();
    fetchGraphData();
    
    // update block info and graph data periodically
    const blockInterval = setInterval(fetchBlockInfo, 10000);
    const graphInterval = setInterval(fetchGraphData, 30000);
    
    return () => {
      clearInterval(blockInterval);
      clearInterval(graphInterval);
    };
  }, []);
  
  // process graph data to make it mutable and with the right references
  const mutableGraphData = useMemo(() => {
    if (!graphData || !graphData.nodes || !graphData.links) {
      return { nodes: [], links: [] };
    }
    
    // create a deep clone of the data
    const clonedData = {
      nodes: [...graphData.nodes].map(node => ({
        ...node,
        __mutable: true // add a flag to ensure it's not frozen
      })),
      links: [...graphData.links].map(link => ({
        ...link,
        __mutable: true // add a flag to ensure it's not frozen
      }))
    };
    
    // cross-link nodes for hover functionality
    clonedData.links.forEach(link => {
      // convert string IDs to node references
      const sourceNode = typeof link.source === 'string' ? 
        clonedData.nodes.find(n => n.id === link.source) : 
        link.source;
      
      const targetNode = typeof link.target === 'string' ? 
        clonedData.nodes.find(n => n.id === link.target) : 
        link.target;
      
      if (!sourceNode || !targetNode) return;
      
      // initialize neighbors and links arrays
      sourceNode.neighbors = sourceNode.neighbors || [];
      targetNode.neighbors = targetNode.neighbors || [];
      sourceNode.links = sourceNode.links || [];
      targetNode.links = targetNode.links || [];
      
      // add to neighbors
      sourceNode.neighbors.push(targetNode);
      targetNode.neighbors.push(sourceNode);
      
      // add link references
      sourceNode.links.push(link);
      targetNode.links.push(link);
    });
    
    return clonedData;
  }, [graphData]);
  
  // handle node hover event
  const handleNodeHover = useCallback((node) => {
    highlightNodes.clear();
    highlightLinks.clear();
    
    if (node) {
      highlightNodes.add(node);
      
      if (node.neighbors) {
        node.neighbors.forEach(neighbor => highlightNodes.add(neighbor));
      }
      
      if (node.links) {
        node.links.forEach(link => highlightLinks.add(link));
      }
    }
    
    setHoverNode(node || null);
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  }, [highlightNodes, setHoverNode, setHighlightNodes, setHighlightLinks]);
  
  // handle link hover event
  const handleLinkHover = useCallback((link) => {
    highlightNodes.clear();
    highlightLinks.clear();
    
    if (link) {
      highlightLinks.add(link);
      
      const sourceNode = typeof link.source === 'object' ? link.source : 
        mutableGraphData.nodes.find(n => n.id === link.source);
      
      const targetNode = typeof link.target === 'object' ? link.target : 
        mutableGraphData.nodes.find(n => n.id === link.target);
      
      if (sourceNode) highlightNodes.add(sourceNode);
      if (targetNode) highlightNodes.add(targetNode);
    }
    
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  }, [highlightNodes, mutableGraphData, setHighlightNodes, setHighlightLinks]);
  
  // handle node click
  const handleNodeClick = useCallback((node) => {
    console.log('[App.js] Node clicked:', node);
    handleNodeHover(node);
    
    if (node && node.id) {
      blockchainService.verifyTEE(node.id)
        .then(result => {
          console.log('[App.js] TEE verification result:', result);
        })
        .catch(err => {
          console.error('[App.js] Error verifying TEE:', err);
        });
    }
  }, [handleNodeHover]);
  
  // configure the force graph
  const graphConfig = useMemo(() => {
    const nodeRelSize = 0.01; // smaller sprites
    
    return {
      nodeRelSize,
      nodeResolution: 16,
      linkWidth: link => highlightLinks.has(link) ? 1 : 1,
      linkColor: link => highlightLinks.has(link) ? '#FFAA00' : '#FFFFFF',
      linkOpacity: 0.4,
      linkDirectionalParticles: link => highlightLinks.has(link) ? 4 : 0,
      linkDirectionalParticleWidth: 2,
      linkDirectionalParticleSpeed: 0.01,
      linkDirectionalParticleColor: link => {
        if (!link || !link.source || !link.target) return '#00FFCC';
        return link.source?.status === 'anomaly' || link.target?.status === 'anomaly' 
          ? '#FF4444' : '#00FFCC';
      },
      nodeLabel: node => {
        if (!node) return '';
        if (!node.status) return node.name || 'Unknown Node';
        return `${node.name || 'Node'} - ${node.status.toUpperCase()}`;
      },
      // use sprite images for nodes
      nodeThreeObject: node => {
        if (!node || !node.status) return null;
        
        const status = node.status;
        console.log(`[App.js] Rendering node with status: ${status}`);
        
        let texture;
        
        // use cached texture if available
        if (textureCache[status]) {
          texture = textureCache[status];
          console.log(`[App.js] Using ${status} texture for node ${node.id}`);
        } else {
          // fallback to a default texture or color
          const defaultStatus = 'secure';
          texture = textureCache[defaultStatus];
          console.warn(`[App.js] No texture for status: ${status}, using default`);
        }
        
        // create sprite with just the image
        const material = new THREE.SpriteMaterial({ 
          map: texture,
          transparent: true,
          opacity: highlightNodes.has(node) ? 1.0 : 0.9
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(14, 14, 1); // Slightly smaller to avoid any surrounding elements
        
        // add a smaller text label above the node
        const labelSprite = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: new THREE.CanvasTexture(createTextCanvas(node.name || 'Node')),
            transparent: true
          })
        );
        labelSprite.scale.set(12, 6, 1);
        labelSprite.position.y = 12;
        
        // create a group to hold ONLY the sprite and label
        const group = new THREE.Group();
        group.add(sprite);
        group.add(labelSprite);
        
        return group;
      },
      nodeThreeObjectExtend: true,
      d3AlphaDecay: 0.01,
      d3VelocityDecay: 0.1,
      linkDistance: 80,
      onNodeHover: handleNodeHover,
      onLinkHover: handleLinkHover,
      onNodeClick: handleNodeClick,
      numDimensions: 3,
      cooldownTicks: 100,
      cooldownTime: 1000
    };
  }, [highlightNodes, highlightLinks, hoverNode, handleNodeHover, handleLinkHover, handleNodeClick]);
  
  return (
    <AppContainer>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title>Mul<span style={{ color: '#33CC99' }}>TEE</span>verse</Title>
            <Subtitle>3D Multi-TEE Blockchain Visualizer</Subtitle>
          </div>
          
          {latestBlock && (
            <BlockInfo>
              Latest Block: <BlockNumber>{latestBlock.blockNumber.toLocaleString()}</BlockNumber>
            </BlockInfo>
          )}
        </div>
      </Header>
      
      <Main>
        <VisualizerSection>
          {isLoading && (
            <LoadingOverlay>
              <div className="loading-spinner">⟳</div> Loading TEE Network...
            </LoadingOverlay>
          )}
          
          <Canvas camera={{ position: [0, 0, 200], fov: 60 }}>
            <color attach="background" args={['#000000']} />
            <fog attach="fog" args={['#000000', 200, 350]} />
            
            <ambientLight intensity={0.4} />
            <pointLight position={[100, 100, 100]} intensity={0.8} />
            <pointLight position={[-100, -100, -100]} intensity={0.5} color="#6666ff" />
            
            <Suspense fallback={null}>
              <Stars radius={300} depth={50} count={1000} factor={6} fade />
              
              <ForceGraphWithUpdates 
                data={mutableGraphData}
                graphConfig={graphConfig}
              />
            </Suspense>
            
            <OrbitControls 
              enablePan={true} 
              enableZoom={true} 
              enableRotate={true}
              enableDamping={true}
              dampingFactor={0.1}
              rotateSpeed={0.5}
              minDistance={50}
              maxDistance={300}
            />
          </Canvas>
        </VisualizerSection>
        
        <LogSection>
          <LogViewer />
        </LogSection>
      </Main>
      
      <Footer>
        &copy; {new Date().getFullYear()} Multi-TEE Network Visualizer | Data refreshes every 10 seconds
      </Footer>
    </AppContainer>
  );
}

export default App;
