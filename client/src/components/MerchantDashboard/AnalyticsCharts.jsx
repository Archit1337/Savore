import React from 'react';
import { motion } from 'framer-motion';

// Premium Apple/Stripe-Inspired Custom SVG Analytics Charts Component
export default function AnalyticsCharts({ analytics, menuLength, reelsCount }) {
  const R = analytics?.totalRevenue || 0;
  const completedOrders = analytics?.completedOrders || 0;

  // Read real time-series aggregated data from analytics (with fallbacks if empty/loading)
  const monthlyRevenue = analytics?.monthlyRevenue && analytics.monthlyRevenue.length > 0
    ? analytics.monthlyRevenue
    : [
        { month: 'Dec', val: R * 0.12 },
        { month: 'Jan', val: R * 0.28 },
        { month: 'Feb', val: R * 0.45 },
        { month: 'Mar', val: R * 0.62 },
        { month: 'Apr', val: R * 0.84 },
        { month: 'May', val: R }
      ];

  const dailyOrders = analytics?.weeklySpikes && analytics.weeklySpikes.length > 0
    ? analytics.weeklySpikes
    : [
        { day: 'Mon', count: Math.round(completedOrders * 0.1) },
        { day: 'Tue', count: Math.round(completedOrders * 0.12) },
        { day: 'Wed', count: Math.round(completedOrders * 0.18) },
        { day: 'Thu', count: Math.round(completedOrders * 0.15) },
        { day: 'Fri', count: Math.round(completedOrders * 0.22) },
        { day: 'Sat', count: Math.round(completedOrders * 0.25) },
        { day: 'Sun', count: Math.round(completedOrders * 0.08) }
      ];

  const lineX = (index) => 45 + index * 80;
  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.val), 1);
  const lineY = (value) => {
    const ratio = value / maxRevenue;
    return 140 - ratio * 105; // range between 35 (top) and 140 (bottom)
  };

  let curveD = '';
  if (monthlyRevenue.length > 0) {
    curveD = `M ${lineX(0)} ${lineY(monthlyRevenue[0].val)}`;
    for (let i = 0; i < monthlyRevenue.length - 1; i++) {
      const x0 = lineX(i);
      const y0 = lineY(monthlyRevenue[i].val);
      const x1 = lineX(i + 1);
      const y1 = lineY(monthlyRevenue[i + 1].val);
      
      const cpX1 = x0 + (x1 - x0) / 2;
      const cpY1 = y0;
      const cpX2 = x0 + (x1 - x0) / 2;
      const cpY2 = y1;
      
      curveD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x1} ${y1}`;
    }
  }

  let areaD = '';
  if (curveD) {
    areaD = `${curveD} L ${lineX(monthlyRevenue.length - 1)} 140 L ${lineX(0)} 140 Z`;
  }

  const barWidth = 22;
  const maxOrders = Math.max(...dailyOrders.map(d => d.count), 5);
  const barHeightRatio = 100 / maxOrders;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mt-3">
      {/* Stripe-style Revenue Line Chart */}
      <div className="bg-[var(--surface-container)] border border-[var(--border-light)] rounded-[20px] p-6 text-left flex flex-col justify-between relative overflow-hidden">
        <div>
          <h4 className="text-[14px] font-bold text-text-primary mb-0.5">Monthly Revenue Growth</h4>
          <p className="text-[12px] text-text-secondary">Sales velocity tracking</p>
        </div>
        
        <div className="h-44 w-full mt-6 relative select-none">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 165">
            <defs>
              <linearGradient id="revenue-glow-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="45" y1="35" x2="445" y2="35" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
            <line x1="45" y1="87" x2="445" y2="87" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
            <line x1="45" y1="140" x2="445" y2="140" stroke="rgba(255,255,255,0.06)" />

            {/* Area Fill Glow */}
            {areaD && (
              <motion.path 
                d={areaD} 
                fill="url(#revenue-glow-gradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            )}

            {/* Smooth SVG Spline */}
            {curveD && (
              <motion.path 
                d={curveD} 
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="3.2" 
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />
            )}

            {/* Interactive Points */}
            {monthlyRevenue.map((pt, idx) => (
              <g key={pt.month} className="group cursor-pointer">
                <circle 
                  cx={lineX(idx)} 
                  cy={lineY(pt.val)} 
                  r="5" 
                  className="fill-[var(--surface-card)] stroke-[var(--primary)] stroke-[2.5px] transition-transform duration-200 group-hover:scale-125" 
                />
                {/* Floating Tooltip Pill */}
                <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <rect 
                    x={lineX(idx) - 30} 
                    y={lineY(pt.val) - 30} 
                    width="60" 
                    height="20" 
                    rx="5" 
                    fill="var(--background-card)" 
                    stroke="var(--border-light)" 
                  />
                  <text 
                    x={lineX(idx)} 
                    y={lineY(pt.val) - 16} 
                    textAnchor="middle" 
                    className="text-[10px] fill-text-primary font-bold"
                  >
                    ₹{Math.round(pt.val).toLocaleString()}
                  </text>
                </g>
              </g>
            ))}

            {/* Month Labels */}
            {monthlyRevenue.map((pt, idx) => (
              <text 
                key={pt.month} 
                x={lineX(idx)} 
                y="158" 
                textAnchor="middle" 
                className="text-[10px] fill-text-muted font-bold"
              >
                {pt.month}
              </text>
            ))}
          </svg>
        </div>
      </div>

      {/* Weekly Order Bars Chart */}
      <div className="bg-[var(--surface-container)] border border-[var(--border-light)] rounded-[20px] p-6 text-left flex flex-col justify-between relative overflow-hidden">
        <div>
          <h4 className="text-[14px] font-bold text-text-primary mb-0.5">Weekly Delivery Spikes</h4>
          <p className="text-[12px] text-text-secondary">Distributions across active calendar days</p>
        </div>

        <div className="h-44 w-full mt-6 relative select-none">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 165">
            <line x1="45" y1="40" x2="445" y2="40" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
            <line x1="45" y1="90" x2="445" y2="90" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
            <line x1="45" y1="140" x2="445" y2="140" stroke="rgba(255,255,255,0.06)" />

            {dailyOrders.map((pt, idx) => {
              const x = 45 + idx * 56 + 14;
              const h = pt.count * barHeightRatio;
              const y = 140 - h;
              return (
                <g key={pt.day}>
                  <rect 
                    x={x} 
                    y="40" 
                    width={barWidth} 
                    height="100" 
                    fill="rgba(255,255,255,0.005)" 
                    rx="3" 
                  />
                  <motion.rect 
                    x={x} 
                    y={y} 
                    width={barWidth} 
                    height={Math.max(h, 4)} 
                    fill="rgba(255, 90, 60, 0.85)"
                    rx="3"
                    className="hover:fill-primary transition-colors"
                    initial={{ height: 0, y: 140 }}
                    animate={{ height: Math.max(h, 4), y }}
                    transition={{ duration: 0.8, delay: idx * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <text 
                    x={x + barWidth / 2} 
                    y={y - 6} 
                    textAnchor="middle" 
                    className="text-[9.5px] fill-text-primary font-bold"
                  >
                    {pt.count}
                  </text>
                </g>
              );
            })}

            {dailyOrders.map((pt, idx) => {
              const x = 45 + idx * 56 + 14 + barWidth / 2;
              return (
                <text 
                  key={pt.day}
                  x={x} 
                  y="158" 
                  textAnchor="middle" 
                  className="text-[10px] fill-text-muted font-bold"
                >
                  {pt.day}
                </text>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
