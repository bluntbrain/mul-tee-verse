import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { blockchainService } from '../../services/blockchainService';

const LogViewerContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #1a1a2e;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const LogHeader = styled.div`
  background-color: #1a1a2e;
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const LogTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #61dafb;
`;

const RefreshButton = styled.button`
  background-color: transparent;
  border: 1px solid #61dafb;
  color: #61dafb;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background-color: rgba(97, 218, 251, 0.1);
  }
`;

const LogList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  background-color: #1e1e1e;
`;

const LogEntry = styled.div`
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  position: relative;
  border-left: 4px solid ${({ type }) => {
    switch (type) {
      case 'ERROR': return '#FF3333';
      case 'WARNING': return '#FFAA00';
      case 'SUCCESS': return '#33CC99';
      default: return '#61dafb';
    }
  }};
  background-color: ${({ type }) => {
    switch (type) {
      case 'ERROR': return 'rgba(255, 51, 51, 0.1)';
      case 'WARNING': return 'rgba(255, 170, 0, 0.1)';
      case 'SUCCESS': return 'rgba(51, 204, 153, 0.1)';
      default: return 'rgba(97, 218, 251, 0.1)';
    }
  }};
  color: #e0e0e0;
`;

const LogTimestamp = styled.div`
  color: #888;
  font-size: 11px;
  margin-bottom: 4px;
`;

const LogSource = styled.span`
  font-weight: bold;
  margin-right: 4px;
  color: #aaa;
`;

const LogType = styled.span`
  font-weight: bold;
  color: ${({ type }) => {
    switch (type) {
      case 'ERROR': return '#FF3333';
      case 'WARNING': return '#FFAA00';
      case 'SUCCESS': return '#33CC99';
      default: return '#61dafb';
    }
  }};
  margin-right: 4px;
`;

const LogNode = styled.span`
  background-color: #2a2a2a;
  padding: 1px 4px;
  border-radius: 3px;
  margin-right: 4px;
  color: #e0e0e0;
`;

const LogMessage = styled.div`
  margin-top: 6px;
  word-break: break-word;
  color: #e0e0e0;
`;

const TxHash = styled.div`
  margin-top: 4px;
  font-size: 11px;
  color: #61dafb;
  word-break: break-all;
`;

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #61dafb;
  
  .loading-spinner {
    animation: spin 1s linear infinite;
    margin-right: 8px;
    font-size: 18px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 150px;
  color: #888;
  text-align: center;
  padding: 0 20px;
  
  p {
    margin: 8px 0;
  }
`;

// utility function to safely stringify values
const safeStringify = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (error) {
      return '[Object]';
    }
  }
  return String(value);
};

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // fetch logs from blockchain service
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[LogViewer] Fetching verification events from blockchain...');
        const logsData = await blockchainService.fetchTEELogs();
        console.log(`[LogViewer] Received ${logsData.length} log entries from blockchain service`);
        
        if (logsData.length > 0) {
          // log details about the received data
          console.log('[LogViewer] Log data sample:', logsData[0]);
          console.log('[LogViewer] Types of data received:');
          const sampleLog = logsData[0];
          for (const key in sampleLog) {
            console.log(`[LogViewer] - ${key}: ${typeof sampleLog[key]}`);
            if (typeof sampleLog[key] === 'object' && sampleLog[key] !== null) {
              console.log(`[LogViewer]   Object keys: ${Object.keys(sampleLog[key])}`);
            }
          }
          
          // ensure all log data is properly stringified to avoid React rendering issues
          const sanitizedLogs = logsData.map(log => {
            const sanitized = {
              ...log,
              node: safeStringify(log.node),
              message: safeStringify(log.message),
              source: safeStringify(log.source),
              type: safeStringify(log.type),
              txHash: safeStringify(log.txHash)
            };
            console.log(`[LogViewer] Sanitized log entry: ${sanitized.id}`);
            return sanitized;
          });
          
          setLogs(sanitizedLogs);
          console.log(`[LogViewer] Set ${sanitizedLogs.length} verification events to state`);
        } else {
          console.log('[LogViewer] No new verification events found');
        }
      } catch (error) {
        console.error('[LogViewer] Error fetching verification events:', error);
        setError('Failed to fetch verification events. Check console for details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
    
    // fetch new logs periodically (every 30 seconds)
    const intervalId = setInterval(() => {
      console.log('[LogViewer] Checking for new verification events...');
      fetchLogs();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      console.error('[LogViewer] Error formatting timestamp:', error);
      return 'Invalid time';
    }
  };
  
  const handleRefresh = async () => {
    console.log('[LogViewer] Manually refreshing verification events...');
    setLoading(true);
    setError(null);
    try {
      const logsData = await blockchainService.fetchTEELogs();
      console.log(`[LogViewer] Manually fetched ${logsData.length} verification events`);
      
      if (logsData.length > 0) {
        console.log('[LogViewer] First event sample from refresh:', logsData[0]);
        
        setLogs(prevLogs => {
          console.log(`[LogViewer] Previous logs count: ${prevLogs.length}`);
          
          // sanitize new logs
          const sanitizedNewLogs = logsData.map(log => {
            const sanitized = {
              ...log,
              node: safeStringify(log.node),
              message: safeStringify(log.message),
              source: safeStringify(log.source),
              type: safeStringify(log.type),
              txHash: safeStringify(log.txHash)
            };
            return sanitized;
          });
          
          console.log(`[LogViewer] Sanitized ${sanitizedNewLogs.length} new log entries`);
          
          // combine new logs with existing logs, avoiding duplicates
          const combinedLogs = [...prevLogs];
          let newLogsAdded = 0;
          
          sanitizedNewLogs.forEach(newLog => {
            if (!combinedLogs.some(log => log.id === newLog.id)) {
              combinedLogs.push(newLog);
              newLogsAdded++;
            }
          });
          
          console.log(`[LogViewer] Added ${newLogsAdded} new unique logs`);
          console.log(`[LogViewer] Total logs after refresh: ${combinedLogs.length}`);
          
          // sort by timestamp (newest first)
          return combinedLogs.sort((a, b) => b.timestamp - a.timestamp);
        });
        console.log(`[LogViewer] Refreshed with ${logsData.length} new verification events`);
      } else {
        console.log('[LogViewer] No new verification events found during refresh');
      }
    } catch (error) {
      console.error('[LogViewer] Error refreshing verification events:', error);
      console.error('[LogViewer] Error details:', error.message);
      if (error.stack) {
        console.error('[LogViewer] Error stack:', error.stack);
      }
      setError('Failed to refresh verification events. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <LogViewerContainer>
      <LogHeader>
        <LogTitle>TEE Health & Verification Logs</LogTitle>
        <RefreshButton onClick={handleRefresh}>
          {loading ? 'Loading...' : 'Refresh'}
        </RefreshButton>
      </LogHeader>
      <LogList>
        {loading && logs.length === 0 ? (
          <LoadingIndicator>
            <div className="loading-spinner">⟳</div> Loading verification events...
          </LoadingIndicator>
        ) : error ? (
          <EmptyState>
            <p style={{ color: '#FF3333' }}>{error}</p>
            <p>Try refreshing again or check the console for more details.</p>
          </EmptyState>
        ) : logs.length === 0 ? (
          <EmptyState>
            <p>No verification events found</p>
            <p>Events will appear here when TEEs verify each other on the blockchain</p>
          </EmptyState>
        ) : (
          logs.map((log) => (
            <LogEntry key={log.id} type={log.type}>
              <LogTimestamp>{formatTimestamp(log.timestamp)}</LogTimestamp>
              <LogSource>[{log.source}]</LogSource>
              <LogType type={log.type}>{log.type}</LogType>
              <LogNode>{log.node}</LogNode>
              <LogMessage>{log.message}</LogMessage>
              {log.txHash && (
                <TxHash>TX: {log.txHash}</TxHash>
              )}
            </LogEntry>
          ))
        )}
      </LogList>
    </LogViewerContainer>
  );
};

export default LogViewer; 