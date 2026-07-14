export function fmt(n: number) {
  if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n.toLocaleString()}`;
}

export function fmtFull(n: number) {
  return `₹${n.toLocaleString()}`;
}

export function refinanceColor(score: number) {
  if (score >= 85) return '#4ADE80';
  if (score >= 60) return '#F59E0B';
  if (score > 0) return '#6B7280';
  return 'var(--fg-muted)';
}

export function recColor(priority: string) {
  switch (priority) {
    case 'high': return { bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.12)', text: '#4ADE80', glow: 'rgba(74,222,128,0.04)' };
    case 'medium': return { bg: 'rgba(139,115,85,0.06)', border: 'rgba(139,115,85,0.12)', text: '#8B7355', glow: 'rgba(139,115,85,0.04)' };
    default: return { bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.10)', text: 'var(--fg-muted)', glow: 'transparent' };
  }
}
