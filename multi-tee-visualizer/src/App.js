import React, { useState, useEffect, useRef, useMemo, Suspense, useCallback } from 'react';
import styled from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import ForceGraph from 'r3f-forcegraph';
import LogViewer from './components/LogViewer';
import { blockchainService } from './services/blockchainService';
import './App.css';

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
  const graphConfig = useMemo(() => ({
    nodeRelSize: 10,
    nodeResolution: 16,
    nodeColor: node => {
      if (!node || !node.status) return '#00FFCC'; // Default color if status is missing
      if (node.status === 'compromised') return '#FF4444';
      if (node.status === 'verifying') return '#FFCC00';
      return highlightNodes.has(node) ? 
        (node === hoverNode ? '#FF7777' : '#FFDD77') : 
        '#00FFCC';
    },
    linkWidth: link => highlightLinks.has(link) ? 4 : 1.5,
    linkColor: link => highlightLinks.has(link) ? '#FFAA00' : '#FFFFFF',
    linkOpacity: 0.8,
    linkDirectionalParticles: link => highlightLinks.has(link) ? 6 : 0,
    linkDirectionalParticleWidth: 3,
    linkDirectionalParticleSpeed: 0.01,
    linkDirectionalParticleColor: link => {
      if (!link || !link.source || !link.target) return '#00FFCC';
      return link.source?.status === 'compromised' || link.target?.status === 'compromised' 
        ? '#FF4444' : '#00FFCC';
    },
    nodeLabel: node => {
      if (!node) return '';
      if (!node.status) return node.name || 'Unknown Node';
      return `${node.name || 'Node'} - ${node.status.toUpperCase()}`;
    },
    onNodeHover: handleNodeHover,
    onLinkHover: handleLinkHover,
    onNodeClick: handleNodeClick,
    numDimensions: 3,
    cooldownTicks: 100,
    cooldownTime: 1000,
    d3AlphaDecay: 0.01,
    d3VelocityDecay: 0.3
  }), [highlightNodes, highlightLinks, hoverNode, handleNodeHover, handleLinkHover, handleNodeClick]);
  
  return (
    <AppContainer>
      <Header>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title>Multi-TEE Blockchain Visualizer</Title>
            <Subtitle>3D visualization of trusted execution environments</Subtitle>
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
