/**
 * @file random-data.js
 * utility functions for generating random graph data for visualizations
 */

/**
 * generate a graph with exactly 5 nodes with specified statuses:
 * - 1 anomaly node
 * - 2 secure nodes
 * - 2 warning nodes
 * 
 * @returns {Object} graph data with nodes and links
 */
export const genRandomTree = () => {
  // fixed node count and status distribution
  const nodes = [
    { id: 'node0', name: 'TEE Node 0', status: 'secure', value: 15 },
    { id: 'node1', name: 'TEE Node 1', status: 'secure', value: 15 },
    { id: 'node2', name: 'TEE Node 2', status: 'warning', value: 15 },
    { id: 'node3', name: 'TEE Node 3', status: 'warning', value: 15 },
    { id: 'node4', name: 'TEE Node 4', status: 'anomaly', value: 15 }
  ];
  
  console.log('[random-data.js] Generated nodes with statuses:', 
    nodes.map(n => `${n.id}: ${n.status}`).join(', '));
  
  // create links between all nodes
  const links = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      links.push({
        source: nodes[i].id,
        target: nodes[j].id,
        value: 10
      });
    }
  }
  
  return { nodes, links };
};

/**
 * generate a network graph with exactly 5 nodes with specified statuses:
 * - 1 anomaly node
 * - 2 secure nodes
 * - 2 warning nodes
 * 
 * @returns {Object} graph data with nodes and links
 */
export const genRandomNetwork = () => {
  // same implementation as genRandomTree for consistent behavior
  return genRandomTree();
}; 