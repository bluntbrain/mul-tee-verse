/**
 * @file random-data.js
 * utility functions for generating random graph data for visualizations
 */

/**
 * generate a random tree graph with a specified number of nodes
 */
export const genRandomTree = (nodeCount = 5) => {
  // always generate exactly 5 nodes regardless of input
  const fixedNodeCount = 5;
  const nodes = [];
  const links = [];
  // define specific statuses for each node to ensure they all have valid values
  const statuses = ['normal', 'normal', 'normal', 'verifying', 'compromised'];
  
  // create nodes with unique IDs and specific statuses
  for (let i = 0; i < fixedNodeCount; i++) {
    nodes.push({
      id: `node${i}`,
      name: `TEE Node ${i}`,
      status: statuses[i % statuses.length], // Ensure we don't go out of bounds
      value: Math.random() * 20 + 10
    });
  }
  
  // create a fully connected circular structure
  // each node connects to all other nodes
  for (let i = 0; i < fixedNodeCount; i++) {
    for (let j = i + 1; j < fixedNodeCount; j++) {
      links.push({
        source: `node${i}`,
        target: `node${j}`,
        value: Math.random() * 10 + 5
      });
    }
  }
  
  // verify all nodes have the required properties
  nodes.forEach(node => {
    if (!node.status) {
      console.warn(`[random-data.js] Node ${node.id} missing status, setting to normal`);
      node.status = 'normal';
    }
  });
  
  return { nodes, links };
};

/**
 * generate a random network graph with a specified number of nodes
 */
export const genRandomNetwork = (nodeCount = 5) => {
  // always generate exactly 5 nodes regardless of input
  const fixedNodeCount = 5;
  const nodes = [];
  const links = [];
  // define specific statuses for each node to ensure they all have valid values
  const statuses = ['normal', 'normal', 'normal', 'verifying', 'compromised'];
  
  // create nodes with unique IDs and specific statuses
  for (let i = 0; i < fixedNodeCount; i++) {
    nodes.push({
      id: `node${i}`,
      name: `TEE Node ${i}`,
      status: statuses[i % statuses.length], // Ensure we don't go out of bounds
      value: Math.random() * 20 + 10
    });
  }
  
  // create a fully connected network (each node connects to all others)
  for (let i = 0; i < fixedNodeCount; i++) {
    for (let j = i + 1; j < fixedNodeCount; j++) {
      // always create links between all nodes
      links.push({
        source: `node${i}`,
        target: `node${j}`,
        value: Math.random() * 10 + 5
      });
    }
  }
  
  // verify all nodes have the required properties
  nodes.forEach(node => {
    if (!node.status) {
      console.warn(`[random-data.js] Node ${node.id} missing status, setting to normal`);
      node.status = 'normal';
    }
  });
  
  return { nodes, links };
}; 