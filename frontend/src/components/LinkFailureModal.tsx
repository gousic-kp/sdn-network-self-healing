import React, { useState } from 'react';

interface LinkFailureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (linkId: string) => Promise<void>;
  onRestore: (linkId: string) => Promise<void>;
  activeLinksStatus: Record<string, string>;
}

export const LinkFailureModal: React.FC<LinkFailureModalProps> = ({
  isOpen,
  onClose,
  onSimulate,
  onRestore,
  activeLinksStatus,
}) => {
  const [selectedLink, setSelectedLink] = useState<string>('S1-S2');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const links = [
    { id: 'S1-S2', name: 'Link S1 ↔ S2', leg: 'Primary Route (Leg 1)' },
    { id: 'S2-S4', name: 'Link S2 ↔ S4', leg: 'Primary Route (Leg 2)' },
    { id: 'S1-S3', name: 'Link S1 ↔ S3', leg: 'Backup Route (Leg 1)' },
    { id: 'S3-S4', name: 'Link S3 ↔ S4', leg: 'Backup Route (Leg 2)' },
  ];

  const handleFail = async () => {
    setIsProcessing(true);
    setLastResult(null);
    try {
      const res = await onSimulate(selectedLink);
      setLastResult(res);
    } catch (e: any) {
      setLastResult({ error: e.message || 'Failure simulation failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    setLastResult(null);
    try {
      const res = await onRestore(selectedLink);
      setLastResult(res);
    } catch (e: any) {
      setLastResult({ error: e.message || 'Restoration failed' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wide">Simulate Link Failure</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg">✕</button>
        </div>

        <p className="text-xs text-slate-400">
          Select a network link to trigger an intentional failure event. The Ryu Controller will automatically detect port status loss, calculate an alternate path via Dijkstra, and install new OpenFlow rules.
        </p>

        {/* Link Selection Grid */}
        <div className="grid grid-cols-2 gap-3">
          {links.map((link) => {
            const status = activeLinksStatus[link.id] || 'UP';
            const isSelected = selectedLink === link.id;

            return (
              <button
                key={link.id}
                onClick={() => setSelectedLink(link.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">{link.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      status === 'DOWN' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{link.leg}</div>
              </button>
            );
          })}
        </div>

        {/* Result Message Box */}
        {lastResult && (
          <div
            className={`p-3 rounded-lg border text-xs font-mono ${
              lastResult.error
                ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
            }`}
          >
            {lastResult.error ? (
              <div>❌ {lastResult.error}</div>
            ) : (
              <div className="space-y-1">
                <div className="font-bold">✅ Self-Healing Complete!</div>
                <div>Status: {lastResult.status}</div>
                {lastResult.new_path && (
                  <div>New Route: {lastResult.new_path.join(' → ')}</div>
                )}
                {lastResult.recovery_time_sec !== undefined && (
                  <div>Recovery Duration: <span className="font-bold text-cyan-400">{lastResult.recovery_time_sec}s</span></div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={handleRestore}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-all disabled:opacity-50"
          >
            Restore Selected Link
          </button>

          <button
            onClick={handleFail}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/30 disabled:opacity-50"
          >
            {isProcessing ? 'Triggering Failure...' : '⚡ Fail Link Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
