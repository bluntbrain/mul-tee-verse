// blockchain service for interacting with MultiTEE contracts
import { ethers } from 'ethers';
import {
  TEE_REGISTRY_ADDRESS,
  ATTESATION_VERIFICATION_RECORD_ADDRESS,
  TEE_REGISTRY_ABI,
  ATTESATION_VERIFICATION_RECORD_ABI,
  RPC_URL_SEPOLIA
} from '../utils/contants';

// create a provider for Sepolia testnet
const provider = new ethers.providers.JsonRpcProvider(RPC_URL_SEPOLIA);

// initialize contracts
const teeRegistryContract = new ethers.Contract(
  TEE_REGISTRY_ADDRESS,
  TEE_REGISTRY_ABI,
  provider
);

const attestationContract = new ethers.Contract(
  ATTESATION_VERIFICATION_RECORD_ADDRESS,
  ATTESATION_VERIFICATION_RECORD_ABI,
  provider
);

// track the latest block for event filtering
let latestBlock = 0;

// cache for graph data to avoid unnecessary fetching
let cachedGraphData = null;
let lastUpdated = 0;
const UPDATE_INTERVAL = 30000; // Update every 30 seconds

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// utility function to safely log objects
const safeLog = (label, obj) => {
  try {
    console.log(`[blockchainService] ${label}:`, 
      typeof obj === 'object' ? JSON.stringify(obj, null, 2) : obj);
  } catch (error) {
    console.log(`[blockchainService] ${label} (not stringifiable):`, obj);
  }
};

// calculate trust score and determine node status
const calculateTrustScoreAndStatus = (totalVerifications, successfulVerifications) => {
  if (totalVerifications === 0) return { trustScore: 0, status: 'warning' };
  
  const trustScore = (successfulVerifications / totalVerifications) * 100;
  
  let status;
  if (trustScore >= 75) {
    status = 'secure';
  } else if (trustScore >= 40) {
    status = 'warning';
  } else {
    status = 'anomaly';
  }
  
  return { trustScore: Math.round(trustScore), status };
};

export const blockchainService = {
  // fetch TEE nodes and relationships from blockchain
  fetchTEEData: async () => {
    console.log('[blockchainService] Fetching TEE data from blockchain...');
    console.log(`[blockchainService] TEE_REGISTRY_ADDRESS: ${TEE_REGISTRY_ADDRESS}`);
    console.log(`[blockchainService] ATTESATION_VERIFICATION_RECORD_ADDRESS: ${ATTESATION_VERIFICATION_RECORD_ADDRESS}`);
    
    const now = Date.now();
    
    try {
      if (!cachedGraphData || (now - lastUpdated > UPDATE_INTERVAL)) {
        // fetch all TEE records from the registry
        console.log('[blockchainService] Calling getAllTEERecords()...');
        const [teeIds, teeData] = await teeRegistryContract.getAllTEERecords();
        console.log(`[blockchainService] Retrieved ${teeIds.length} TEE records`);
        safeLog('TEE IDs', teeIds);
        safeLog('First TEE data entry (sample)', teeIds.length > 0 ? teeData[0] : 'No TEEs found');
        
        // fetch verification counts for all TEEs
        console.log('[blockchainService] Calling getAllVerificationCounts()...');
        const [verificationIds, totalVerifications, successfulVerifications] = 
          await attestationContract.getAllVerificationCounts();
        console.log(`[blockchainService] Retrieved verification counts for ${verificationIds.length} TEEs`);
        safeLog('Verification IDs', verificationIds);
        
        if (verificationIds.length > 0) {
          console.log('[blockchainService] Sample verification counts:');
          console.log(`[blockchainService] TEE ID: ${typeof verificationIds[0] === 'object' ? 'Object (indexed string)' : verificationIds[0]}`);
          console.log(`[blockchainService] Total Verifications: ${totalVerifications[0].toString()}`);
          console.log(`[blockchainService] Successful Verifications: ${successfulVerifications[0].toString()}`);
        }
        
        // create a map for easier lookup - ensure all IDs are strings
        const verificationMap = {};
        for (let i = 0; i < verificationIds.length; i++) {
          // convert any potential object to string
          const teeId = typeof verificationIds[i] === 'object' 
            ? `TEE-${verificationIds[i].hash.slice(0, 8)}` 
            : String(verificationIds[i]);
            
          verificationMap[teeId] = {
            total: totalVerifications[i].toNumber(),
            successful: successfulVerifications[i].toNumber()
          };
        }
        safeLog('Verification map (sample)', Object.keys(verificationMap).length > 0 
          ? { [Object.keys(verificationMap)[0]]: verificationMap[Object.keys(verificationMap)[0]] } 
          : 'No verification data');
        
        // create nodes - ensure all IDs are strings
        const nodes = teeIds.map((id, index) => {
          // convert any potential object to string
          const teeId = typeof id === 'object' 
            ? `TEE-${id.hash.slice(0, 8)}` 
            : String(id);
            
          const verifications = verificationMap[teeId] || { total: 0, successful: 0 };
          const { trustScore, status } = calculateTrustScoreAndStatus(
            verifications.total,
            verifications.successful
          );
          
          // also ensure teeData properties are properly stringified
          const teeAddress = teeData[index].teeAddress || "0x0000000000000000000000000000000000000000";
          const isActive = !!teeData[index].isActive;
          const teeDataStr = typeof teeData[index].teeData === 'object'
            ? JSON.stringify(teeData[index].teeData)
            : String(teeData[index].teeData || "");
          
          return {
            id: teeId,
            name: `${teeId} (${trustScore}%)`,
            status,
            group: status === 'secure' ? 1 : status === 'warning' ? 2 : 3,
            teeAddress,
            isActive,
            teeDataStr,
            trustScore,
            totalVerifications: verifications.total,
            successfulVerifications: verifications.successful
          };
        });
        
        console.log(`[blockchainService] Created ${nodes.length} TEE nodes with calculated trust scores`);
        if (nodes.length > 0) {
          const sampleNodes = nodes.slice(0, Math.min(nodes.length, 3));
          sampleNodes.forEach((node, i) => {
            console.log(`[blockchainService] Node ${i+1} - ID: ${node.id}, Status: ${node.status}, Trust Score: ${node.trustScore}%`);
          });
        }
        
        // create links (simple connections for now - could be enhanced with real attestation relationships)
        const links = [];
        
        // connect nodes based on attestation relationships
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            // create a link with 70% probability to ensure not all nodes are connected
            if (Math.random() > 0.3) {
              links.push({
                source: nodes[i].id,
                target: nodes[j].id
              });
            }
          }
        }
        
        console.log(`[blockchainService] Created ${links.length} links between nodes`);
        
        cachedGraphData = { nodes, links };
        lastUpdated = now;
        
        console.log(`[blockchainService] Fetched ${nodes.length} TEE nodes with verification data`);
      } else {
        console.log('[blockchainService] Using cached graph data, last updated:', new Date(lastUpdated).toLocaleString());
      }
      
      return cachedGraphData;
    } catch (error) {
      console.error('[blockchainService] Error fetching TEE data:', error);
      throw error;
    }
  },
  
  // fetch verification events from the blockchain
  fetchTEELogs: async () => {
    console.log('[blockchainService] Fetching TEE verification events...');
    
    try {
      // get current block number
      const currentBlock = await provider.getBlockNumber();
      console.log(`[blockchainService] Current block number: ${currentBlock}`);
      
      // if this is the first time, look back 10000 blocks, otherwise from the last fetched block
      const fromBlock = latestBlock === 0 ? currentBlock - 10000 : latestBlock + 1;
      console.log(`[blockchainService] Fetching events from block ${fromBlock} to ${currentBlock}`);
      
      // don't exceed current block
      if (fromBlock > currentBlock) {
        console.log('[blockchainService] No new blocks to check for events');
        return [];
      }
      
      // update latest block
      latestBlock = currentBlock;
      
      // create filter for VerificationSubmitted events
      const filter = attestationContract.filters.VerificationSubmitted();
      console.log('[blockchainService] Created filter for VerificationSubmitted events');
      
      // get events
      const events = await attestationContract.queryFilter(filter, fromBlock, currentBlock);
      
      console.log(`[blockchainService] Found ${events.length} verification events`);
      
      // log details of the first event if available
      if (events.length > 0) {
        const sampleEvent = events[0];
        console.log('[blockchainService] Sample event details:');
        console.log(`[blockchainService] Block number: ${sampleEvent.blockNumber}`);
        console.log(`[blockchainService] Transaction hash: ${sampleEvent.transactionHash}`);
        console.log(`[blockchainService] Event name: VerificationSubmitted`);
        console.log('[blockchainService] Event args:');
        for (const key in sampleEvent.args) {
          if (isNaN(parseInt(key))) { // Skip numeric keys which are duplicates
            const value = sampleEvent.args[key];
            console.log(`[blockchainService] - ${key}: ${typeof value === 'object' ? 'Object (indexed string)' : value}`);
          }
        }
      }
      
      // format events into log entries
      const logs = events.map((event) => {
        // for indexed string parameters, ethers returns special objects with hash property
        // ee need to get the actual string values from the event topics
        // get the non-indexed parameters directly
        const { success } = event.args;
        
        // get verifierTeeId and verifiedTeeId safely as strings
        // if they're objects (indexed strings), convert to string representation
        const verifierTeeId = typeof event.args.verifierTeeId === 'object' 
          ? `TEE-${event.args.verifierTeeId.hash.slice(0, 8)}` // Use a portion of the hash as an identifier
          : String(event.args.verifierTeeId);
          
        const verifiedTeeId = typeof event.args.verifiedTeeId === 'object'
          ? `TEE-${event.args.verifiedTeeId.hash.slice(0, 8)}`
          : String(event.args.verifiedTeeId);
        
        const blockTimestamp = new Date(); 
        
        return {
          id: `event-${event.blockNumber}-${event.transactionIndex}`,
          timestamp: blockTimestamp,
          type: success ? 'SUCCESS' : 'ERROR',
          node: verifiedTeeId,
          message: `TEE ${verifierTeeId} ${success ? 'successfully verified' : 'failed to verify'} TEE ${verifiedTeeId}`,
          source: 'AttestationRecord',
          txHash: event.transactionHash
        };
      });
      
      console.log(`[blockchainService] Processed ${logs.length} verification events into log entries`);
      if (logs.length > 0) {
        console.log('[blockchainService] Sample log entry:', logs[0]);
      }
      
      return logs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('[blockchainService] Error fetching verification events:', error);
      return [];
    }
  },
  
  // verify a TEE (would require a wallet/signer to create a transaction)
  verifyTEE: async (teeId) => {
    console.log(`[blockchainService] Initiating verification for TEE: ${teeId}`);
    // this is just a simulation without actual transaction
    await delay(1500);
    return {
      success: true,
      txHash: `0x${Math.random().toString(16).substring(2, 42)}`,
      message: `Verification initiated for TEE ${teeId}. Note: This is a simulation, to perform real verification you would need a connected wallet.`
    };
  },
  
  // get the latest block information
  getLatestBlock: async () => {
    console.log('[blockchainService] Fetching latest block information...');
    try {
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      
      console.log(`[blockchainService] Retrieved block ${blockNumber}`);
      console.log(`[blockchainService] Block timestamp: ${new Date(block.timestamp * 1000).toISOString()}`);
      console.log(`[blockchainService] Transaction count: ${block.transactions.length}`);
      
      return {
        blockNumber,
        timestamp: new Date(block.timestamp * 1000),
        transactionCount: block.transactions.length
      };
    } catch (error) {
      console.error('[blockchainService] Error fetching block information:', error);
      return {
        blockNumber: 0,
        timestamp: new Date(),
        transactionCount: 0
      };
    }
  }
}; 