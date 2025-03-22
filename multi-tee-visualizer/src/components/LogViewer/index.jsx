import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { blockchainService } from '../../services/blockchainService';
import PropTypes from 'prop-types';

const LogContainer = styled.div`
  background-color: #0c0c0c;
  color: #33ff33;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
`;

const LogTitle = styled.div`
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #33ff33;
  
  &::before {
    content: "$ ";
    opacity: 0.7;
  }
`;

const RefreshButton = styled.button`
  background-color: #333;
  color: #33ff33;
  border: 1px solid #33ff33;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 12px;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  &:hover {
    background-color: #004400;
  }
`;

const LogEntry = styled.div`
  padding: 6px 0;
  margin-bottom: 4px;
  color: ${props => props.type === 'SUCCESS' ? '#33ff33' : '#ff5555'};
  position: relative;
  overflow-wrap: break-word;
  
  &::before {
    content: "${props => props.type === 'SUCCESS' ? '✓' : '✗'} ";
    margin-right: 6px;
  }
`;

const LogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 11px;
  opacity: 0.7;
`;

const LogMessage = styled.div`
  font-size: 13px;
  margin-left: 20px;
  position: relative;
  
  &::before {
    content: "> ";
    position: absolute;
    left: -15px;
    color: #888;
  }
`;

const LogSourceLabel = styled.span`
  background-color: #333;
  padding: 1px 4px;
  border-radius: 2px;
  color: #aaa;
  font-size: 10px;
`;

const TxHashLink = styled.a`
  color: #60a8ff;
  text-decoration: none;
  font-size: 10px;
  opacity: 0.8;
  &:hover {
    text-decoration: underline;
    opacity: 1;
  }
  
  &::before {
    content: "$ open ";
    color: #888;
  }
`;

const LogTimestamp = styled.span`
  color: #888;
  font-size: 10px;
`;

const LoadingIndicator = styled.div`
  text-align: left;
  padding: 16px;
  color: #33ff33;
  position: relative;
  
  &::before {
    content: "$ loading ";
    color: #888;
    margin-right: 5px;
  }
  
  @keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  &::after {
    content: "_";
    animation: blink 1s infinite;
    margin-left: 5px;
  }
`;

const EmptyState = styled.div`
  text-align: left;
  padding: 16px;
  color: #888;
  
  &::before {
    content: "$ logs --filter recent ";
    color: #666;
    margin-right: 5px;
  }
  
  &::after {
    content: "_";
    opacity: 0.5;
  }
`;

const ErrorMessage = styled.div`
  text-align: left;
  padding: 16px;
  color: #ff5555;
  background-color: rgba(255, 0, 0, 0.1);
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 12px;
  
  &::before {
    content: "ERROR: ";
    font-weight: bold;
  }
`;

const StyledPre = styled.pre`
  margin: 0;
  padding: 0;
  font-family: inherit;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Divider = styled.div`
  border-top: 1px dashed #333;
  margin: 10px 0;
  opacity: 0.5;
`;

const BlinkingCursor = styled.span`
  &::after {
    content: "▌";
    animation: blink 1s infinite;
    margin-left: 2px;
  }
  
  @keyframes blink {
    0% { opacity: 0; }
    49% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 1; }
  }
`;

// format a timestamp in terminal style
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  
  // format like: [HH:MM:SS]
  const timeStr = date.toTimeString().substring(0, 8);
  
  if (diffMinutes < 1) {
    return `[${timeStr}] (just now)`;
  } else if (diffMinutes < 60) {
    return `[${timeStr}] (${diffMinutes}m ago)`;
  } else {
    return `[${timeStr}] (${Math.floor(diffMinutes/60)}h ${diffMinutes%60}m ago)`;
  }
};

// utility function to safely stringify objects
const safeStringify = (value) => {
  if (typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }
  return String(value || '');
};

const LogViewer = ({ onNewLogs }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const prevLogsCountRef = useRef(0);

  // function to fetch logs once
  const fetchLogs = async () => {
    try {
      console.log('[LogViewer] Fetching logs...');
      setLoading(true);
      setError(null);
      
      const logsData = await blockchainService.fetchTEELogs();
      
      console.log(`[LogViewer] Received ${logsData.length} log entries`);
      
      // sanitize log entries to ensure they are safe for React rendering
      const sanitizedLogs = logsData.map(log => ({
        ...log,
        node: safeStringify(log.node),
        message: safeStringify(log.message),
        source: safeStringify(log.source),
        type: safeStringify(log.type),
        txHash: safeStringify(log.txHash)
      }));
      
      // check if we received new logs that would require a graph refresh
      if (sanitizedLogs.length > 0 && sanitizedLogs.length !== prevLogsCountRef.current) {
        console.log('[LogViewer] New logs detected, triggering graph refresh');
        if (onNewLogs) onNewLogs();
        prevLogsCountRef.current = sanitizedLogs.length;
      }
      
      // sort in ascending order - oldest first, newest last
      const sortedLogs = sanitizedLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      setLogs(sortedLogs);
      console.log(`[LogViewer] Set ${sortedLogs.length} verification events to state`);
      
      // immediately scroll to bottom after setting logs
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 0);
    } catch (err) {
      console.error('[LogViewer] Error fetching logs:', err);
      setError(`Failed to fetch logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // load logs on first render
  useEffect(() => {
    fetchLogs();
    
    // set up auto refresh every 30 seconds
    const intervalId = setInterval(() => {
      console.log('[LogViewer] Auto-refreshing logs...');
      fetchLogs();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [onNewLogs]);

  // enhance the useEffect to make sure scrolling happens reliably
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    
    // add a delayed scroll to ensure it works even after DOM updates
    const scrollTimer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }, 100);
    
    return () => clearTimeout(scrollTimer);
  }, [logs]);

  // handle manual refresh
  const handleRefresh = async () => {
    console.log('[LogViewer] Manually refreshing verification events...');
    setLoading(true);
    setError(null);
    
    try {
      const logsData = await blockchainService.fetchTEELogs();
      console.log(`[LogViewer] Fetched ${logsData.length} verification events`);
      
      if (logsData.length > 0) {
        console.log('[LogViewer] Sample verification event:', logsData[0]);
      }
      
      console.log(`[LogViewer] Previous logs count: ${logs.length}`);
      
      // sanitize new logs for React rendering
      const sanitizedNewLogs = logsData.map(log => ({
        ...log,
        node: safeStringify(log.node),
        message: safeStringify(log.message),
        source: safeStringify(log.source),
        type: safeStringify(log.type),
        txHash: safeStringify(log.txHash)
      }));
      
      console.log(`[LogViewer] Sanitized ${sanitizedNewLogs.length} new log entries`);
      
      // combine logs, avoiding duplicates by checking ID
      const existingIds = new Set(logs.map(log => log.id));
      const uniqueNewLogs = sanitizedNewLogs.filter(log => !existingIds.has(log.id));
      
      console.log(`[LogViewer] Found ${uniqueNewLogs.length} new unique logs`);
      
      // Check if we found new unique logs that would require a graph refresh
      if (uniqueNewLogs.length > 0) {
        console.log('[LogViewer] New unique logs detected, triggering graph refresh');
        if (onNewLogs) onNewLogs();
      }
      
      // combine and sort logs by timestamp (ascending order)
      const combinedLogs = [...logs, ...uniqueNewLogs]
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .slice(-20); // Keep only the 20 most recent logs
      
      console.log(`[LogViewer] Total logs after refresh: ${combinedLogs.length}`);
      
      // update the previous logs count reference
      prevLogsCountRef.current = combinedLogs.length;
      
      setLogs(combinedLogs);
      
      // force scroll to bottom
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 0);
    } catch (err) {
      console.error('[LogViewer] Error refreshing logs:', err);
      console.error('[LogViewer] Error stack:', err.stack);
      setError(`Failed to refresh logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LogContainer ref={containerRef}>
      <LogTitle>
        <span>
          tail -f verifications.log
        </span>
        <RefreshButton onClick={handleRefresh} disabled={loading}>
          {loading ? 'refreshing...' : 'refresh'}
        </RefreshButton>
      </LogTitle>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {loading && logs.length === 0 && (
        <LoadingIndicator>fetching verification logs</LoadingIndicator>
      )}
      
      {!loading && logs.length === 0 && (
        <EmptyState>No verification events found in the last 5 minutes</EmptyState>
      )}
      
      {logs.length > 0 && (
        <div style={{ marginBottom: '8px', opacity: 0.7, fontSize: '12px', color: '#aaa', textAlign: 'center', borderBottom: '1px dashed #444', paddingBottom: '8px' }}>
          -------- Beginning of verification logs -------- 
        </div>
      )}
      
      {logs.map((log, index) => (
        <React.Fragment key={log.id}>
          {index > 0 && <Divider />}
          <LogEntry type={log.type}>
            <LogHeader>
              <div>
                <LogTimestamp>{formatTimestamp(log.timestamp)}</LogTimestamp>
                {' '}
                <LogSourceLabel>{log.source}</LogSourceLabel>
              </div>
              <TxHashLink 
                href={`https://sepolia.etherscan.io/tx/${log.txHash}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {log.txHash.substring(0, 10)}...
              </TxHashLink>
            </LogHeader>
            <LogMessage>
              <StyledPre>{log.message}</StyledPre>
            </LogMessage>
          </LogEntry>
          {index === logs.length - 1 && (
            <div style={{ marginTop: '8px', textAlign: 'center', borderTop: '1px dashed #444', paddingTop: '8px', color: '#33ff33', fontSize: '12px' }}>
              -------- End of log (newest) --------
            </div>
          )}
        </React.Fragment>
      ))}
      
      <BlinkingCursor />
    </LogContainer>
  );
};

LogViewer.propTypes = {
  onNewLogs: PropTypes.func
};

LogViewer.defaultProps = {
  onNewLogs: () => {}
};

export default LogViewer; 