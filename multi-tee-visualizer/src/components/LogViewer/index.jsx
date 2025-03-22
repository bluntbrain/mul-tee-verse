import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { blockchainService } from '../../services/blockchainService';
import PropTypes from 'prop-types';

const LogContainer = styled.div`
  background-color: #000000;
  color: #3eff3e;
  border-radius: 8px;
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  line-height: 1.5;
  box-shadow: inset 0 0 20px rgba(0, 100, 0, 0.2);
`;

const LogTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #3eff3e;
  
  &::before {
    content: "$ ";
    opacity: 0.8;
  }
`;

const RefreshButton = styled.button`
  background-color: #111111;
  color: #3eff3e;
  border: 1px solid #3eff3e;
  border-radius: 4px;
  padding: 5px 12px;
  cursor: pointer;
  font-size: 12px;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  &:hover {
    background-color: #0a2a0a;
    box-shadow: 0 0 8px rgba(51, 255, 51, 0.4);
  }
`;

const LogEntry = styled.div`
  padding: 8px 10px;
  margin-bottom: 8px;
  color: ${props => props.type === 'SUCCESS' ? '#3eff3e' : '#ff5555'};
  position: relative;
  overflow-wrap: break-word;
  background-color: rgba(0, 30, 0, 0.2);
  border-radius: 4px;
  border-left: 3px solid ${props => props.type === 'SUCCESS' ? '#3eff3e' : '#ff5555'};
  
  &::before {
    content: "${props => props.type === 'SUCCESS' ? '✓' : '✗'} ";
    margin-right: 6px;
  }
`;

const LogHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 11px;
  color: #aaa;
  align-items: center;
`;

const LogMessage = styled.div`
  font-size: 14px;
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
  background-color: #111111;
  padding: 2px 6px;
  border-radius: 4px;
  color: #aaa;
  font-size: 10px;
  border: 1px solid #333;
`;

const TxHashLink = styled.a`
  background-color: #111111;
  color: #60dcff;
  text-decoration: none;
  font-size: 12px;
  opacity: 1;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #0f2b38;
  display: inline-flex;
  align-items: center;
  
  &:hover {
    background-color: #0f2f3f;
    box-shadow: 0 0 10px rgba(97, 218, 251, 0.3);
    text-decoration: underline;
  }
  
  &::before {
    content: "🔗 ";
    margin-right: 4px;
  }
`;

const LogTimestamp = styled.span`
  color: #aaa;
  font-size: 11px;
  font-weight: bold;
`;

const LoadingIndicator = styled.div`
  text-align: left;
  padding: 16px;
  color: #3eff3e;
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
  background-color: rgba(50, 0, 0, 0.3);
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 12px;
  border-left: 3px solid #ff5555;
  
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

// function to format transaction hash for better display
const formatTxHash = (hash) => {
  if (!hash) return '';
  const start = hash.substring(0, 6);
  const end = hash.substring(hash.length - 4);
  return `${start}...${end}`;
};

const LogViewer = React.forwardRef(({ onNewLogs }, ref) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const prevLogsCountRef = useRef(0);
  const autoRefreshIntervalRef = useRef(null);

  // Simplified function to fetch logs
  const fetchLogs = async () => {
    try {
      console.log('[LogViewer] Fetching logs...');
      setLoading(true);
      
      const logsData = await blockchainService.fetchTEELogs();
      console.log(`[LogViewer] Received ${logsData.length} log entries`);
      
      if (logsData.length === 0) {
        console.log('[LogViewer] No logs received from API');
        setLoading(false);
        return;
      }
      
      // process logs only if we have data
      const processedLogs = logsData.map(log => ({
        ...log,
        node: safeStringify(log.node),
        message: safeStringify(log.message),
        source: safeStringify(log.source),
        type: safeStringify(log.type),
        txHash: safeStringify(log.txHash)
      }));
      
      // sort logs from oldest to newest
      const sortedLogs = processedLogs.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
      
      // update logs state with the sorted logs
      setLogs(sortedLogs);
      
      // check if log count has changed to trigger a graph refresh
      if (sortedLogs.length !== prevLogsCountRef.current) {
        console.log('[LogViewer] Log count changed, triggering graph refresh');
        prevLogsCountRef.current = sortedLogs.length;
        if (onNewLogs) onNewLogs();
      }
      
      // scroll to bottom after logs update
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      }, 100);
    } catch (err) {
      console.error('[LogViewer] Error fetching logs:', err);
      setError(`Failed to fetch logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // expose the refresh function via ref
  React.useImperativeHandle(ref, () => ({
    refreshLogs: fetchLogs,
    isLoading: loading
  }));

  // initial fetch and set up auto-refresh
  useEffect(() => {
    // initial fetch
    fetchLogs();
    
    // auto-refresh every 30 seconds
    autoRefreshIntervalRef.current = setInterval(() => {
      console.log('[LogViewer] Auto-refreshing logs...');
      fetchLogs();
    }, 30000);
    
    // Clean up interval on unmount
    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  // handle manual refresh button click
  const handleRefresh = () => {
    console.log('[LogViewer] Manual refresh requested');
    fetchLogs();
  };

  return (
    <LogContainer ref={containerRef}>
      <LogTitle>
        <span>
          tail -f verifications.log
        </span>
        <RefreshButton onClick={handleRefresh} disabled={loading}>
          {loading ? '⟳ refreshing...' : '⟳ refresh'}
        </RefreshButton>
      </LogTitle>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {loading && logs.length === 0 && (
        <LoadingIndicator>fetching verification logs</LoadingIndicator>
      )}
      
      {!loading && logs.length === 0 && (
        <EmptyState>No verification events found</EmptyState>
      )}
      
      {logs.length > 0 && (
        <div style={{ marginBottom: '12px', opacity: 0.7, fontSize: '12px', color: '#3eff3e', textAlign: 'center', borderBottom: '1px dashed #1a3a1a', paddingBottom: '8px' }}>
          -------- Beginning of verification logs -------- 
        </div>
      )}
      
      {logs.map((log, index) => (
        <React.Fragment key={log.id || `log-${index}`}>
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
                title="View transaction on Etherscan"
              >
                {formatTxHash(log.txHash)}
              </TxHashLink>
            </LogHeader>
            <LogMessage>
              <StyledPre>{log.message}</StyledPre>
            </LogMessage>
          </LogEntry>
          {index === logs.length - 1 && (
            <div style={{ marginTop: '12px', textAlign: 'center', borderTop: '1px dashed #1a3a1a', paddingTop: '8px', color: '#3eff3e', fontSize: '12px' }}>
              -------- End of log (newest) --------
            </div>
          )}
        </React.Fragment>
      ))}
      
      <BlinkingCursor />
    </LogContainer>
  );
});

LogViewer.propTypes = {
  onNewLogs: PropTypes.func
};

LogViewer.defaultProps = {
  onNewLogs: () => {}
};

export default LogViewer; 