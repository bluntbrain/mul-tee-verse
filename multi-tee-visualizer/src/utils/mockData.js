// mock data for TEE nodes and relationships
export const generateMockData = () => {
  // mock nodes representing TEEs
  const nodes = [
    { id: 'tee-1', name: 'TEE Node 1', status: 'healthy', group: 1 },
    { id: 'tee-2', name: 'TEE Node 2', status: 'healthy', group: 1 },
    { id: 'tee-3', name: 'TEE Node 3', status: 'compromised', group: 2 },
    { id: 'tee-4', name: 'TEE Node 4', status: 'healthy', group: 1 },
    { id: 'tee-5', name: 'TEE Node 5', status: 'healthy', group: 1 },
    { id: 'tee-6', name: 'TEE Node 6', status: 'healthy', group: 1 },
    { id: 'tee-7', name: 'TEE Node 7', status: 'verifying', group: 3 }
  ];

  // mock links between TEEs
  const links = [
    { source: 'tee-1', target: 'tee-2' },
    { source: 'tee-1', target: 'tee-3' },
    { source: 'tee-2', target: 'tee-4' },
    { source: 'tee-3', target: 'tee-5' },
    { source: 'tee-4', target: 'tee-6' },
    { source: 'tee-5', target: 'tee-6' },
    { source: 'tee-6', target: 'tee-7' },
    { source: 'tee-1', target: 'tee-7' }
  ];

  return { nodes, links };
};

// generate mock log entries for TEE health checks
export const generateMockLogs = () => {
  const logTypes = ['INFO', 'WARNING', 'ERROR', 'SUCCESS'];
  const actions = [
    'Verifying TEE attestation',
    'Checking TEE health status',
    'Validating blockchain connection',
    'Verifying cryptographic signatures',
    'Checking consensus mechanism'
  ];
  const nodes = ['TEE Node 1', 'TEE Node 2', 'TEE Node 3', 'TEE Node 4', 'TEE Node 5', 'TEE Node 6', 'TEE Node 7'];
  
  // generate 15 random log entries
  const logs = [];
  
  // add a critical error for the compromised node
  logs.push({
    id: `log-${Date.now() - 150000}`,
    timestamp: new Date(Date.now() - 150000),
    type: 'ERROR',
    node: 'TEE Node 3',
    message: 'Attestation verification failed. Node potentially compromised.',
    source: 'SecurityMonitor'
  });
  
  for (let i = 0; i < 15; i++) {
    const timestamp = new Date(Date.now() - (i * 10000));
    const type = logTypes[Math.floor(Math.random() * logTypes.length)];
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    logs.push({
      id: `log-${timestamp.getTime()}`,
      timestamp,
      type,
      node,
      message: `${action} for ${node}`,
      source: 'TEEHealthMonitor'
    });
  }
  
  // sort logs by timestamp (newest first)
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}; 