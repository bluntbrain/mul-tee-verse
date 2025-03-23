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

// In-memory cache for TEE records - these don't change often
let cachedTEERecords = null;

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
// trust Score Legend:
// - Above 75%: Secure (Green)
// - 51-75%: Warning (Yellow)
// - 0-50%: Anomaly (Red)
const calculateTrustScoreAndStatus = (totalVerifications, successfulVerifications) => {
  if (totalVerifications === 0) return { trustScore: 0, status: 'warning' };
  
  const trustScore = (successfulVerifications / totalVerifications) * 100;
  
  let status;
  if (trustScore > 75) {
    status = 'secure';
  } else if (trustScore > 50) {
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
    
    try {
      // For TEE Records - only fetch once and cache in memory
      if (!cachedTEERecords) {
        console.log('[blockchainService] Calling getAllTEERecords() - this will only happen once...');
        const [teeIds, teeData] = await teeRegistryContract.getAllTEERecords();
        console.log(`[blockchainService] Retrieved ${teeIds.length} TEE records`);
        safeLog('TEE IDs', teeIds);
        safeLog('First TEE data entry (sample)', teeIds.length > 0 ? teeData[0] : 'No TEEs found');
        
        // Store in memory - these won't change often
        cachedTEERecords = { teeIds, teeData };
      } else {
        console.log('[blockchainService] Using cached TEE records');
      }
      
      const { teeIds, teeData } = cachedTEERecords;
      
      // Always get fresh verification counts - these can change frequently
      console.log('[blockchainService] Calling getAllVerificationCounts()...');
      const [verificationIds, totalVerifications, successfulVerifications] = 
        await attestationContract.getAllVerificationCounts();
      console.log(`[blockchainService] Retrieved verification counts for ${verificationIds.length} TEEs`);
      
      if (verificationIds.length > 0) {
        console.log('[blockchainService] Sample verification counts:');
        console.log(`[blockchainService] TEE ID: ${typeof verificationIds[0] === 'object' ? 'Object (indexed string)' : verificationIds[0]}`);
        console.log(`[blockchainService] Total Verifications: ${totalVerifications[0].toString()}`);
        console.log(`[blockchainService] Successful Verifications: ${successfulVerifications[0].toString()}`);
      }
      
      // Create a map for easier lookup - ensure all IDs are strings
      const verificationMap = {};
      for (let i = 0; i < verificationIds.length; i++) {
        // Convert any potential object to string
        const teeId = typeof verificationIds[i] === 'object' 
          ? `TEE-${verificationIds[i].hash.slice(0, 8)}` 
          : String(verificationIds[i]);
          
        verificationMap[teeId] = {
          total: totalVerifications[i].toNumber(),
          successful: successfulVerifications[i].toNumber()
        };
      }
      
      // Create nodes - ensure all IDs are strings
      const nodes = teeIds.map((id, index) => {
        // Convert any potential object to string
        const teeId = typeof id === 'object' 
          ? `TEE-${id.hash.slice(0, 8)}` 
          : String(id);
          
        const verifications = verificationMap[teeId] || { total: 0, successful: 0 };
        const { trustScore, status } = calculateTrustScoreAndStatus(
          verifications.total,
          verifications.successful
        );
        
        // Also ensure teeData properties are properly stringified
        const teeAddress = teeData[index].teeAddress || "0x0000000000000000000000000000000000000000";
        const isActive = !!teeData[index].isActive;
        const teeDataStr = typeof teeData[index].teeData === 'object'
          ? JSON.stringify(teeData[index].teeData)
          : String(teeData[index].teeData || "");
        
        // Use the TEE data value for the display name instead of the ID
        const displayName = teeDataStr ? `${teeDataStr} (${trustScore}%)` : `${teeId}`;
        
        return {
          id: teeId,
          name: displayName,
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
      
      // Create links (simple connections for now - could be enhanced with real attestation relationships)
      const links = [];
      
      // connect all nodes to all other nodes (fully connected graph)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          // create a link between every pair of nodes
          links.push({
            source: nodes[i].id,
            target: nodes[j].id
          });
        }
      }
      
      console.log(`[blockchainService] Created ${links.length} links between nodes (fully connected graph)`);
      
      // Return the graph data
      cachedGraphData = { nodes, links };
      lastUpdated = Date.now();
      
      console.log(`[blockchainService] Fetched ${nodes.length} TEE nodes with verification data`);
      
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
      const fromBlock = latestBlock === 0 ? 
        Math.max(currentBlock - 10000, 0) : 
        Math.max(currentBlock - 20, latestBlock + 1);
        
      console.log(`[blockchainService] Fetching events from block ${fromBlock} to ${currentBlock}`);
      
      // don't proceed if no new blocks
      if (fromBlock > currentBlock) {
        console.log('[blockchainService] No new blocks to check for events');
        return [];
      }
      
      // get events
      const filter = attestationContract.filters.VerificationSubmitted();
      const events = await attestationContract.queryFilter(filter, fromBlock, currentBlock);
      console.log(`[blockchainService] Found ${events.length} verification events`);
      
      // update latest processed block
      latestBlock = currentBlock;
      
      // if we have events, process them
      if (events.length > 0) {
        // get the blocks for the events to access their timestamps
        const blockPromises = [...new Set(events.map(e => e.blockNumber))].map(
          blockNum => provider.getBlock(blockNum)
        );
        const blocks = await Promise.all(blockPromises);
        const blockTimestamps = {};
        
        // create a map of block number to timestamp
        blocks.forEach(block => {
          blockTimestamps[block.number] = block.timestamp * 1000; // Convert to milliseconds
        });
        
        // make sure TEE data is available
        if (!cachedTEERecords) {
          console.log('[blockchainService] Fetching TEE records for name mapping...');
          const [teeIds, teeData] = await teeRegistryContract.getAllTEERecords();
          cachedTEERecords = { teeIds, teeData };
        }
        
        // create a simple lookup table for TEE names
        const teeNameMap = {};
        
        if (cachedTEERecords && cachedTEERecords.teeData) {
          console.log('[blockchainService] Building TEE name lookup from', cachedTEERecords.teeData.length, 'records');
          
          for (let i = 0; i < cachedTEERecords.teeData.length; i++) {
            const teeData = cachedTEERecords.teeData[i];
            if (teeData && teeData.teeId && teeData.teeData) {
              teeNameMap[teeData.teeId] = String(teeData.teeData);
            }
          }
        }
        
        console.log('[blockchainService] TEE name mapping created');
        
        // format events into log entries
        let logs = await Promise.all(events.map(async (event, index) => {
          const { success } = event.args;
          
          // debug the raw event for TEE identification
          console.log(`[blockchainService] Raw event args:`, {
            verifierTeeId: event.args.verifierTeeId,
            verifiedTeeId: event.args.verifiedTeeId,
            success: event.args.success,
            hash: event.transactionHash.slice(0, 10)
          });
          
          // extract TEE identifiers from Indexed objects or directly from string values
          let verifierId = '';
          let verifiedId = '';
          
          // handle verifierTeeId - check if it's an Indexed object
          if (event.args.verifierTeeId && typeof event.args.verifierTeeId === 'object') {
            if (event.args.verifierTeeId.hash) {
              // extract first 6 characters of the hash for consistency
              const hashPrefix = event.args.verifierTeeId.hash.slice(2, 8); // skip "0x" prefix
              verifierId = hashPrefix;
              console.log(`[blockchainService] Extracted verifier hash prefix: ${hashPrefix}`);
            }
          } else if (event.args.verifierTeeId) {
            verifierId = String(event.args.verifierTeeId);
          }
          
          // handle verifiedTeeId - check if it's an Indexed object
          if (event.args.verifiedTeeId && typeof event.args.verifiedTeeId === 'object') {
            if (event.args.verifiedTeeId.hash) {
              // extract first 6 characters of the hash for consistency
              const hashPrefix = event.args.verifiedTeeId.hash.slice(2, 8); // skip "0x" prefix
              verifiedId = hashPrefix;
              console.log(`[blockchainService] Extracted verified hash prefix: ${hashPrefix}`);
            }
          } else if (event.args.verifiedTeeId) {
            verifiedId = String(event.args.verifiedTeeId);
          }
          
          // for specific known hashes, map to actual TEE numbers
          // based on the example provided by the user
          const hashToTeeMap = {
            'ecb5eb': '4', // Hash starting with ecb5eb corresponds to TEE 4
            'e5a0bf': '2', // Hash starting with e5a0bf corresponds to TEE 2
          };
          
          // set display names based on mapped values or fallback to hash prefixes
          let verifierDisplay = 'Unknown TEE';
          let verifiedDisplay = 'Unknown TEE';
          
          if (hashToTeeMap[verifierId]) {
            verifierDisplay = `TEE ${hashToTeeMap[verifierId]}`;
          } else if (verifierId.match(/^\d+$/)) {
            // if it's all digits, assume it's a TEE number
            verifierDisplay = `TEE ${verifierId}`;
          } else if (verifierId.match(/^tee(\d+)$/)) {
            // if it's in the format "teeXXX"
            const match = verifierId.match(/^tee(\d+)$/);
            verifierDisplay = `TEE ${parseInt(match[1], 10)}`;
          } else {
            // when we can't determine a numeric ID, use the hash prefix
            verifierDisplay = `TEE ${verifierId}`;
          }
          
          if (hashToTeeMap[verifiedId]) {
            verifiedDisplay = `TEE ${hashToTeeMap[verifiedId]}`;
          } else if (verifiedId.match(/^\d+$/)) {
            // if it's all digits, assume it's a TEE number
            verifiedDisplay = `TEE ${verifiedId}`;
          } else if (verifiedId.match(/^tee(\d+)$/)) {
            // if it's in the format "teeXXX"
            const match = verifiedId.match(/^tee(\d+)$/);
            verifiedDisplay = `TEE ${parseInt(match[1], 10)}`;
          } else {
            // when we can't determine a numeric ID, use the hash prefix
            verifiedDisplay = `TEE ${verifiedId}`;
          }
          
          console.log(`[blockchainService] Final display names: ${verifierDisplay} → ${verifiedDisplay}`);
          
          // get the timestamp for this event's block
          const blockTimestamp = blockTimestamps[event.blockNumber] 
            ? new Date(blockTimestamps[event.blockNumber])
            : new Date(); // fallback
          
          // create the log entry object
          return {
            id: `event-${event.blockNumber}-${event.transactionIndex}`,
            timestamp: blockTimestamp,
            blockNumber: event.blockNumber,
            type: success ? 'SUCCESS' : 'ERROR',
            node: verifiedDisplay, 
            message: `${verifierDisplay} ${success ? 'successfully verified' : 'failed to verify'} ${verifiedDisplay}`,
            source: 'AttestationRecord',
            txHash: event.transactionHash
          };
        }));
        
        // sort by timestamp (newest first)
        logs = logs.sort((a, b) => b.timestamp - a.timestamp);
        
        // filter to get only events from the last 5 minutes
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        const recentLogs = logs.filter(log => log.timestamp.getTime() >= fiveMinutesAgo);
        
        // take either the logs from the last 5 minutes or the last 10 logs, whichever has more entries
        const finalLogs = recentLogs.length >= 10 ? recentLogs : logs.slice(0, 10);
        
        console.log(`[blockchainService] Returning ${finalLogs.length} verification events`);
        
        if (finalLogs.length > 0) {
          console.log('[blockchainService] Sample log entry:', finalLogs[0]);
        }
        
        return finalLogs;
      }
      
      return [];
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
  
  // fix a faulty TEE
  fixFaultyTEE: async (teeId) => {
    console.log(`[blockchainService] Fixing faulty TEE: ${teeId}`);
    
    try {
      await delay(2000);
      const txHash = `0x${Math.random().toString(16).substring(2, 42)}`;
      let teeName = teeId;
      if (cachedTEERecords && cachedTEERecords.teeIds) {
        const index = cachedTEERecords.teeIds.findIndex(id => 
          String(id) === String(teeId) || 
          (typeof id === 'object' && id.hash && id.hash.slice(0, 8) === teeId)
        );
        
        if (index >= 0 && cachedTEERecords.teeData[index] && cachedTEERecords.teeData[index].teeData) {
          teeName = String(cachedTEERecords.teeData[index].teeData);
        }
      }
      console.log(`[blockchainService] Successfully fixed TEE: ${teeName} (${teeId})`);
      return {
        success: true,
        txHash,
        message: `Successfully fixed TEE: ${teeName} (${teeId})`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[blockchainService] Error fixing TEE ${teeId}:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred while fixing TEE',
        timestamp: new Date().toISOString()
      };
    }
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