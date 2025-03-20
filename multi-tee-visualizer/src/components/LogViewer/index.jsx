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

const LoadingIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #61dafb;
`;

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch logs from blockchain service
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const logsData = await blockchainService.fetchTEELogs();
        setLogs(logsData);
      } catch (error) {
        console.error('[LogViewer] Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogs();
    
    // simulate periodic log updates (every 10 seconds)
    const intervalId = setInterval(() => {
      console.log('[LogViewer] Fetching new logs from blockchain...');
      fetchLogs();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false
    });
  };
  
  const handleRefresh = async () => {
    console.log('[LogViewer] Manually refreshing logs...');
    setLoading(true);
    try {
      const logsData = await blockchainService.fetchTEELogs();
      setLogs(logsData);
    } catch (error) {
      console.error('[LogViewer] Error refreshing logs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <LogViewerContainer>
      <LogHeader>
        <LogTitle>TEE Health & Verification Logs</LogTitle>
        <RefreshButton onClick={handleRefresh}>Refresh</RefreshButton>
      </LogHeader>
      <LogList>
        {loading && logs.length === 0 ? (
          <LoadingIndicator>Loading logs...</LoadingIndicator>
        ) : (
          logs.map((log) => (
            <LogEntry key={log.id} type={log.type}>
              <LogTimestamp>{formatTimestamp(log.timestamp)}</LogTimestamp>
              <LogSource>[{log.source}]</LogSource>
              <LogType type={log.type}>{log.type}</LogType>
              <LogNode>{log.node}</LogNode>
              <LogMessage>{log.message}</LogMessage>
            </LogEntry>
          ))
        )}
      </LogList>
    </LogViewerContainer>
  );
};

export default LogViewer; 