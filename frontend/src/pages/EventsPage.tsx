import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { NetworkEvent } from '../types/sdn';
import { EventLogStream } from '../components/EventLogStream';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<NetworkEvent[]>([]);

  useEffect(() => {
    api.getEvents(undefined, 100).then(setEvents).catch(console.error);
    const interval = setInterval(() => {
      api.getEvents(undefined, 100).then(setEvents).catch(console.error);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 select-none">
      <div>
        <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wide">Network Event Log Stream</h2>
        <p className="text-xs text-slate-400">
          Complete historical event trail including link detection, Dijkstra calculations, flow rule modifications, and self-healing completions.
        </p>
      </div>

      <EventLogStream events={events} maxDisplay={100} />
    </div>
  );
};
