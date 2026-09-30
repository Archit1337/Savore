import React, { useState, useEffect } from 'react';

// Premium simulated interactive delivery tracking map (Merchant View)
export default function DeliveryMapSimulator({ orderId, onCompleteClick }) {
  const progressKey = `delivery_progress_${orderId}`;
  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem(progressKey);
    return saved ? parseFloat(saved) : 0;
  });

  useEffect(() => {
    if (progress >= 100) {
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = Math.min(prev + 1, 100);
        localStorage.setItem(progressKey, next.toString());
        return next;
      });
    }, 400);

    return () => clearInterval(timer);
  }, [progress, orderId]);

  const getCoordinatesAtProgress = (p) => {
    const total = 460;
    const d = (p / 100) * total;
    if (d <= 70) {
      const ratio = d / 70;
      return { x: 50 + ratio * 70, y: 150, angle: 0 };
    } else if (d <= 160) {
      const ratio = (d - 70) / 90;
      return { x: 120, y: 150 - ratio * 90, angle: -90 };
    } else if (d <= 300) {
      const ratio = (d - 160) / 140;
      return { x: 120 + ratio * 140, y: 60, angle: 0 };
    } else if (d <= 370) {
      const ratio = (d - 300) / 70;
      return { x: 260, y: 60 + ratio * 70, angle: 90 };
    } else {
      const ratio = (d - 370) / 90;
      return { x: 260 + ratio * 90, y: 130, angle: 0 };
    }
  };

  const { x, y, angle } = getCoordinatesAtProgress(progress);
  const remainingSeconds = Math.max(0, Math.ceil((100 - progress) * 0.4));
  const remainingMeters = Math.max(0, Math.ceil((100 - progress) * 8.5));

  return (
    <div className="bg-white/[0.015] border border-white/[0.04] rounded-xl p-3 my-2 text-left select-none relative overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-[11.5px] font-bold text-text-primary">Live Driver Location</span>
        </div>
        <span className="text-[10.5px] font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded-full border border-[var(--accent)]/20">
          {progress}% Dispatched
        </span>
      </div>

      <div className="w-full h-36 bg-background-primary/60 border border-white/[0.03] rounded-lg relative overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          <defs>
            <radialGradient id="rest-glow-m" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="home-glow-m" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <path 
            d="M 50 150 L 120 150 L 120 60 L 260 60 L 260 130 L 350 130" 
            fill="none" 
            stroke="var(--border-light)" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeDasharray="4,5"
          />

          <path 
            d="M 50 150 L 120 150 L 120 60 L 260 60 L 260 130 L 350 130" 
            fill="none" 
            stroke="var(--primary)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeDasharray="460"
            strokeDashoffset={460 - (progress / 100) * 460}
            style={{ transition: 'stroke-dashoffset 400ms linear' }}
          />

          <circle cx="50" cy="150" r="16" fill="url(#rest-glow-m)" />
          <circle cx="50" cy="150" r="5" fill="var(--primary)" />
          <text x="50" y="174" textAnchor="middle" className="text-[9px] fill-text-secondary font-bold">Kitchen</text>

          <circle cx="350" cy="130" r="16" fill="url(#home-glow-m)" />
          <circle cx="350" cy="130" r="5" fill="var(--accent)" />
          <text x="350" y="154" textAnchor="middle" className="text-[9px] fill-text-secondary font-bold">Customer</text>

          <g transform={`translate(${x}, ${y}) rotate(${angle})`} style={{ transition: 'transform 400ms linear' }}>
            <circle cx="0" cy="0" r="10" fill="var(--primary)" className="animate-ping" style={{ opacity: 0.15 }} />
            <circle cx="0" cy="0" r="8" fill="var(--primary)" />
            <g transform="translate(-5, -5) scale(0.45)">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="5.5" cy="17.5" r="2.5"/>
                <circle cx="18.5" cy="17.5" r="2.5"/>
                <path d="M3 6h5l3 7h6l3-7"/>
                <path d="M12 6.5L9.5 10"/>
              </svg>
            </g>
          </g>
        </svg>
      </div>

      <div className="flex gap-4 mt-3 items-center w-full max-w-[460px]">
        <div className="grid grid-cols-2 gap-4 bg-white/[0.005] rounded-lg p-2 text-center text-[12px] border border-white/[0.02] flex-grow">
          <div>
            <span className="text-[9.5px] text-text-muted block font-semibold uppercase tracking-wider">Est. Completion</span>
            <span className="font-bold text-text-primary">{remainingSeconds}s ({remainingMeters}m)</span>
          </div>
          <div>
            <span className="text-[9.5px] text-text-muted block font-semibold uppercase tracking-wider">Simulation Mode</span>
            <span className="font-bold text-[var(--accent)]">3PL Webhook</span>
          </div>
        </div>

        <button
          onClick={onCompleteClick}
          className={`btn btn-pill text-[12px] font-bold px-4 py-3 h-10 flex items-center justify-center transition-all ${
            progress < 100
              ? 'bg-white/5 border border-white/10 text-text-muted cursor-not-allowed opacity-50'
              : 'btn-primary text-white cursor-pointer shadow-[var(--shadow-glow)]'
          }`}
          disabled={progress < 100}
        >
          {progress < 100 ? 'In Transit' : 'Complete ✓'}
        </button>
      </div>
    </div>
  );
}
