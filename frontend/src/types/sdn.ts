export interface SDNNode {
  id: string;
  label: string;
  type: 'host' | 'switch';
  ip?: string;
  dpid?: number;
  status: 'UP' | 'DOWN';
  x: number;
  y: number;
}

export interface SDNLink {
  id: string;  // e.g. "S1-S2"
  source: string;
  target: string;
  status: 'UP' | 'DOWN';
  is_active_path: boolean;
  bandwidth_mbps: number;
  latency_ms: number;
}

export interface NetworkTopology {
  nodes: SDNNode[];
  links: SDNLink[];
  active_path: string[];
  network_status: string;
}

export interface NetworkStatus {
  status: 'HEALTHY' | 'REROUTING' | 'DEGRADED' | 'CRITICAL';
  active_switches: number;
  active_links: number;
  total_links: number;
  active_hosts: number;
  active_flows: number;
  detected_failures: number;
  successful_recoveries: number;
  avg_recovery_time_sec: number;
  active_path: string;
  controller_type: string;
}

export interface NetworkEvent {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'SUCCESS' | 'ERROR';
  event_type: string;
  source: string;
  message: string;
  details?: Record<string, any>;
}

export interface FailureEvent {
  id: number;
  timestamp: string;
  link_id: string;
  source_node: string;
  target_node: string;
  failure_type: string;
  affected_flows: number;
  previous_path: string[];
  alternate_path: string[] | null;
  recovery_time_sec: number;
  status: 'Resolved' | 'Detected' | 'Rerouting' | 'Failed';
  resolution_timestamp?: string;
}

export interface TrafficStat {
  timestamp: string;
  bytes_per_sec: number;
  packets_per_sec: number;
  bandwidth_util_pct: number;
  packet_loss_pct: number;
  latency_ms: number;
}

export interface FlowRule {
  dpid: number;
  switch_id: string;
  table_id: number;
  priority: number;
  match: {
    in_port: number;
    eth_type?: number;
    ipv4_src?: string;
    ipv4_dst?: string;
  };
  actions: string[];
  out_port: number;
  direction: string;
}

export interface StatisticsData {
  summary: {
    total_failures: number;
    total_recoveries: number;
    failed_recovery_attempts: number;
    avg_recovery_time_sec: number;
    min_recovery_time_sec: number;
    max_recovery_time_sec: number;
    active_flows_count: number;
    current_active_path: string[];
  };
  traffic_history: TrafficStat[];
}
