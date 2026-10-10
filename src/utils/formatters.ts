// ─── Date/Time formatters ─────────────────────────────────────────────────────

export const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatDate = (isoString: string): string => {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

// ─── Size formatters ─────────────────────────────────────────────────────────

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// ─── Hash formatters ──────────────────────────────────────────────────────────

export const truncateHash = (hash: string, chars = 8): string => {
  if (hash.length <= chars * 2) return hash;
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
};

export const truncateTxId = (txId: string): string => {
  if (txId.length <= 16) return txId;
  return `${txId.slice(0, 10)}...${txId.slice(-6)}`;
};

// ─── Severity helpers ─────────────────────────────────────────────────────────

export const severityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    critical: '#EF4444',
    high: '#F59E0B',
    medium: '#3B82F6',
    low: '#94A3B8',
  };
  return colors[severity] ?? '#94A3B8';
};

export const severityBadgeClass = (severity: string): string => {
  const classes: Record<string, string> = {
    critical: 'status-critical',
    high: 'status-high',
    medium: 'status-medium',
    low: 'status-low',
  };
  return classes[severity] ?? 'status-low';
};

// ─── Confidence helpers ───────────────────────────────────────────────────────

export const formatConfidence = (confidence: number): string => {
  return `${Math.round(confidence * 100)}%`;
};

export const confidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return '#EF4444';
  if (confidence >= 0.7) return '#F59E0B';
  if (confidence >= 0.5) return '#3B82F6';
  return '#94A3B8';
};
