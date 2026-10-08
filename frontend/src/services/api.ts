import { NetworkStatus, NetworkTopology, NetworkEvent, FailureEvent, StatisticsData, FlowRule } from '../types/sdn';

const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:8000/api';
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (window.location.port === '3000' || window.location.port === '5173') {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

export const api = {
  async getStatus(): Promise<NetworkStatus> {
    const res = await fetch(`${API_BASE_URL}/network/status`);
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  async getTopology(): Promise<NetworkTopology> {
    const res = await fetch(`${API_BASE_URL}/topology`);
    if (!res.ok) throw new Error('Failed to fetch topology');
    return res.json();
  },

  async getFlows(): Promise<{ count: number; flows: FlowRule[] }> {
    const res = await fetch(`${API_BASE_URL}/flows`);
    if (!res.ok) throw new Error('Failed to fetch flows');
    return res.json();
  },

  async getStatistics(): Promise<StatisticsData> {
    const res = await fetch(`${API_BASE_URL}/statistics`);
    if (!res.ok) throw new Error('Failed to fetch statistics');
    return res.json();
  },

  async getEvents(level?: string, limit: number = 50): Promise<NetworkEvent[]> {
    const url = new URL(`${API_BASE_URL}/events`);
    if (level) url.searchParams.append('level', level);
    url.searchParams.append('limit', limit.toString());
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async getFailures(): Promise<FailureEvent[]> {
    const res = await fetch(`${API_BASE_URL}/failures`);
    if (!res.ok) throw new Error('Failed to fetch failures');
    return res.json();
  },

  async simulateFailure(linkId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/failure/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_id: linkId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Simulation failed');
    }
    return res.json();
  },

  async restoreLink(linkId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/link/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_id: linkId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Restoration failed');
    }
    return res.json();
  },

  async recalculateNetwork(): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/network/recalculate`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Recalculation failed');
    return res.json();
  }
};
