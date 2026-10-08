import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LinkFailureModal } from './components/LinkFailureModal';

import { Dashboard } from './pages/Dashboard';
import { TopologyPage } from './pages/TopologyPage';
import { TrafficMonitor } from './pages/TrafficMonitor';
import { FailuresPage } from './pages/FailuresPage';
import { ReroutingPage } from './pages/ReroutingPage';
import { EventsPage } from './pages/EventsPage';
import { ControllerPage } from './pages/ControllerPage';
import { SettingsPage } from './pages/SettingsPage';

import { api } from './services/api';
import { networkWS, eventsWS } from './services/websocket';
import { NetworkStatus, NetworkTopology, NetworkEvent } from './types/sdn';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const [topology, setTopology] = useState<NetworkTopology | null>(null);
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState<boolean>(false);

  // Load initial data
  const refreshData = async () => {
    try {
      const [s, t, e] = await Promise.all([
        api.getStatus(),
        api.getTopology(),
        api.getEvents(undefined, 30),
      ]);
      setStatus(s);
      setTopology(t);
      setEvents(e);
    } catch (err) {
      console.error('[App] Error fetching initial data:', err);
    }
  };

  useEffect(() => {
    refreshData();

    // Connect WebSockets
    networkWS.connect();
    eventsWS.connect();

    const unsubNetwork = networkWS.subscribe((msg) => {
      if (msg.type === 'INITIAL_STATE' || msg.type === 'TOPOLOGY_UPDATE') {
        if (msg.data?.nodes || msg.topology) {
          setTopology(msg.data || msg.topology);
        }
        if (msg.status) {
          setStatus(msg.status);
        }
      } else if (msg.type === 'TRAFFIC_METRICS') {
        if (msg.status) {
          setStatus(msg.status);
        }
      }
    });

    const unsubEvents = eventsWS.subscribe((msg) => {
      if (msg.type === 'NEW_EVENT' && msg.event) {
        setEvents((prev) => [msg.event, ...prev].slice(0, 50));
      }
    });

    // Fallback polling loop (2 seconds)
    const interval = setInterval(refreshData, 2000);

    return () => {
      unsubNetwork();
      unsubEvents();
      clearInterval(interval);
    };
  }, []);

  const handleSimulateFailure = async (linkId: string) => {
    const res = await api.simulateFailure(linkId);
    await refreshData();
    return res;
  };

  const handleRestoreLink = async (linkId: string) => {
    const res = await api.restoreLink(linkId);
    await refreshData();
    return res;
  };

  const handleRestoreAll = async () => {
    for (const linkId of ['S1-S2', 'S1-S3', 'S2-S4', 'S3-S4']) {
      try {
        await api.restoreLink(linkId);
      } catch (e) {}
    }
    await refreshData();
  };

  const activeLinksMap: Record<string, string> = {};
  if (topology && topology.links) {
    topology.links.forEach((l) => {
      activeLinksMap[l.id] = l.status;
    });
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            status={status}
            topology={topology}
            events={events}
            onSimulateFailure={handleSimulateFailure}
            onRestoreLink={handleRestoreLink}
            onNavigate={setActiveTab}
          />
        );
      case 'topology':
        return (
          <TopologyPage
            topology={topology}
            onSimulateFailure={handleSimulateFailure}
            onRestoreLink={handleRestoreLink}
          />
        );
      case 'traffic':
        return <TrafficMonitor />;
      case 'failures':
        return <FailuresPage onRestoreLink={handleRestoreLink} />;
      case 'rerouting':
        return <ReroutingPage status={status} />;
      case 'events':
        return <EventsPage />;
      case 'controller':
        return <ControllerPage status={status} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return (
          <Dashboard
            status={status}
            topology={topology}
            events={events}
            onSimulateFailure={handleSimulateFailure}
            onRestoreLink={handleRestoreLink}
            onNavigate={setActiveTab}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar
          status={status}
          onOpenFailureModal={() => setIsFailureModalOpen(true)}
          onRestoreAll={handleRestoreAll}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {renderActivePage()}
        </main>
      </div>

      {/* Link Failure Simulation Modal */}
      <LinkFailureModal
        isOpen={isFailureModalOpen}
        onClose={() => setIsFailureModalOpen(false)}
        onSimulate={handleSimulateFailure}
        onRestore={handleRestoreLink}
        activeLinksStatus={activeLinksMap}
      />
    </div>
  );
};
