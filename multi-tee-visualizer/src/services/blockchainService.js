// this is a mock service simulating blockchain interaction

import { generateMockLogs } from '../utils/mockData';
import { genRandomTree, genRandomNetwork } from '../utils/random-data';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// cache the generated data to avoid regenerating it on each refresh
// but still allow periodic updates
let cachedGraphData = null;
let lastUpdated = 0;
const UPDATE_INTERVAL = 30000; // Update every 30 seconds

export const blockchainService = {
  // simulate fetching TEE nodes and relationships from blockchain
  fetchTEEData: async () => {
    console.log('[blockchainService] Fetching TEE data from blockchain...');
    
    const now = Date.now();
    if (!cachedGraphData || (now - lastUpdated > UPDATE_INTERVAL)) {
      // generate new data if none exists or it's time to update
      const useTree = Math.random() > 0.5; // randomly choose between tree and network
      cachedGraphData = useTree ? genRandomTree(80) : genRandomNetwork(50);
      lastUpdated = now;
      
      // process the data to ensure all nodes have valid status
      if (cachedGraphData && cachedGraphData.nodes) {
        cachedGraphData.nodes.forEach(node => {
          // normalize node status
          if (!node.status) {
            console.warn(`[blockchainService] Node ${node.id} missing status, setting to secure`);
            node.status = 'secure';
          }
          
          // ensure status is one of: secure, warning, anomaly
          if (!['secure', 'warning', 'anomaly'].includes(node.status)) {
            console.warn(`[blockchainService] Node ${node.id} has invalid status: ${node.status}, setting to secure`);
            node.status = 'secure';
          }
          
          console.log(`[blockchainService] Node ${node.id} has status: ${node.status}`);
        });
      }
    }
    
    // simulate network delay
    await delay(800);
    return cachedGraphData;
  },
  
  // simulate fetching TEE health logs from blockchain
  fetchTEELogs: async () => {
    console.log('[blockchainService] Fetching TEE logs from blockchain...');
    // simulate network delay
    await delay(600);
    return generateMockLogs();
  },
  
  // simulate TEE verification transaction
  verifyTEE: async (teeId) => {
    console.log(`[blockchainService] Initiating verification for TEE: ${teeId}`);
    // simulate transaction time
    await delay(1500);
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).substring(2, 42)}`,
      message: `Verification initiated for TEE ${teeId}`
    };
  },
  
  // simulate getting the latest block information
  getLatestBlock: async () => {
    console.log('[blockchainService] Fetching latest block information...');
    await delay(300);
    return {
      blockNumber: Math.floor(Math.random() * 1000000) + 10000000,
      timestamp: new Date(),
      transactionCount: Math.floor(Math.random() * 100) + 50
    };
  }
}; 