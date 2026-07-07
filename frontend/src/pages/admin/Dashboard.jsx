import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';

// Dynamic stats mapping for timeframes
const STATS_BY_TIMEFRAME = {
  "Last 30 Days": {
    users: "14,820",
    agents: "124",
    services: "18",
    requests: "4,850",
    completed: "4,120",
    rejected: "184",
    trendPoints: [
      { x: 30, y: 140, label: "Week 1", count: 850 },
      { x: 150, y: 110, label: "Week 2", count: 1200 },
      { x: 270, y: 160, label: "Week 3", count: 950 },
      { x: 390, y: 60, label: "Week 4", count: 1850 }
    ],
    usage: [
      { name: "Income Certificate", pct: 42, count: 2037 },
      { name: "Domicile Certificate", pct: 28, count: 1358 },
      { name: "Birth Certificate", pct: 15, count: 727 },
      { name: "Caste Certificate", pct: 10, count: 485 },
      { name: "PAN Card Linkage", pct: 5, count: 243 }
    ]
  },
  "Last 6 Months": {
    users: "15,940",
    agents: "128",
    services: "18",
    requests: "26,450",
    completed: "23,980",
    rejected: "910",
    trendPoints: [
      { x: 30, y: 150, label: "Jan", count: 3200 },
      { x: 110, y: 130, label: "Feb", count: 4100 },
      { x: 190, y: 120, label: "Mar", count: 4500 },
      { x: 270, y: 90, label: "Apr", count: 5600 },
      { x: 350, y: 110, label: "May", count: 4900 },
      { x: 430, y: 80, label: "Jun", count: 6150 }
    ],
    usage: [
      { name: "Income Certificate", pct: 40, count: 10580 },
      { name: "Domicile Certificate", pct: 30, count: 7935 },
      { name: "Birth Certificate", pct: 16, count: 4232 },
      { name: "Caste Certificate", pct: 9, count: 2380 },
      { name: "PAN Card Linkage", pct: 5, count: 1323 }
    ]
  },
  "Last 7 Days": {
    users: "14,100",
    agents: "124",
    services: "18",
    requests: "1,120",
    completed: "980",
    rejected: "32",
    trendPoints: [
      { x: 30, y: 160, label: "Mon", count: 120 },
      { x: 90, y: 140, label: "Tue", count: 150 },
      { x: 150, y: 150, label: "Wed", count: 140 },
      { x: 210, y: 90, label: "Thu", count: 230 },
      { x: 270, y: 110, label: "Fri", count: 200 },
      { x: 330, y: 120, label: "Sat", count: 180 },
      { x: 390, y: 170, label: "Sun", count: 100 }
    ],
    usage: [
      { name: "Income Certificate", pct: 45, count: 504 },
      { name: "Domicile Certificate", pct: 25, count: 280 },
      { name: "Birth Certificate", pct: 15, count: 168 },
      { name: "Caste Certificate", pct: 10, count: 112 },
      { name: "PAN Card Linkage", pct: 5, count: 56 }
    ]
  }
};

const TOP_AGENTS = [
  { rank: 1, name: "Priya Sharma", completionRate: "98%", rating: "4.9", completedCount: 342, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80" },
  { rank: 2, name: "Rajesh Kumar", completionRate: "96%", rating: "4.8", completedCount: 310, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80" },
  { rank: 3, name: "Anil Deshmukh", completionRate: "94%", rating: "4.7", completedCount: 295, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80" },
  { rank: 4, name: "Sunita Verma", completionRate: "92%", rating: "4.7", completedCount: 280, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80" }
];

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState("Last 30 Days");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const activeStats = STATS_BY_TIMEFRAME[timeframe];

  // Helper to generate SVG path from coordinates
  const generateSvgPath = (points) => {
    if (!points || points.length === 0) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      // smooth Bezier connection
      const cpX1 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
      const cpY1 = points[i-1].y;
      const cpX2 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
      const cpY2 = points[i].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const generateSvgAreaPath = (points) => {
    if (!points || points.length === 0) return "";
    const linePath = generateSvgPath(points);
    const lastPoint = points[points.length - 1];
    return `${linePath} L ${lastPoint.x} 200 L ${points[0].x} 200 Z`;
  };

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Title Header with Timeframe Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
              Administrative Command Center
            </h1>
            <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
              Monitor, audit, and analyze the SevaSetu platform metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-bold text-gray-400 shrink-0">Timeframe:</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="h-10 px-3.5 rounded-lg border border-[#e2e8f0] bg-white text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#13448a]"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 6 Months">Last 6 Months</option>
            </select>
          </div>
        </div>

        {/* Analytics Cards Grid (6 columns) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Users */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Users</span>
            <span className="text-[20px] font-extrabold text-gray-800 mt-1 block">{activeStats.users}</span>
          </div>

          {/* Card 2: Agents */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Agents</span>
            <span className="text-[20px] font-extrabold text-gray-800 mt-1 block">{activeStats.agents}</span>
          </div>

          {/* Card 3: Services */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Services</span>
            <span className="text-[20px] font-extrabold text-gray-800 mt-1 block">{activeStats.services}</span>
          </div>

          {/* Card 4: Requests */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Requests</span>
            <span className="text-[20px] font-extrabold text-blue-600 mt-1 block">{activeStats.requests}</span>
          </div>

          {/* Card 5: Completed */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Completed</span>
            <span className="text-[20px] font-extrabold text-emerald-600 mt-1 block">{activeStats.completed}</span>
          </div>

          {/* Card 6: Rejected */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Rejected</span>
            <span className="text-[20px] font-extrabold text-red-550 mt-1 block">{activeStats.rejected}</span>
          </div>
        </div>

        {/* Charts & Leaderboard Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart 1: Request Trends (SVG Line Chart) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-[16px] font-extrabold text-[#0f294a] flex items-center gap-2">
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                Request Trends
              </h3>
              <span className="text-[11.5px] text-gray-450 font-bold bg-[#eff6ff] text-[#13448a] px-2.5 py-0.5 rounded-full">
                Active applications graph
              </span>
            </div>

            {/* SVG Graph wrapper */}
            <div className="relative">
              <svg viewBox="0 0 480 220" className="w-full h-64 overflow-visible">
                {/* Grids */}
                <line x1="30" y1="50" x2="450" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="100" x2="450" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="150" x2="450" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="30" y1="200" x2="450" y2="200" stroke="#e2e8f0" strokeWidth="1.5" />

                {/* Y-axis Labels */}
                <text x="5" y="55" className="text-[9px] fill-gray-400 font-bold">High</text>
                <text x="5" y="105" className="text-[9px] fill-gray-400 font-bold">Med</text>
                <text x="5" y="155" className="text-[9px] fill-gray-400 font-bold">Low</text>

                {/* Area Gradient */}
                <defs>
                  <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#13448a" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#13448a" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Area */}
                <path d={generateSvgAreaPath(activeStats.trendPoints)} fill="url(#area-grad)" />

                {/* Line Path */}
                <path d={generateSvgPath(activeStats.trendPoints)} fill="none" stroke="#13448a" strokeWidth="3" />

                {/* Circles & Tooltip Interactive Points */}
                {activeStats.trendPoints.map((pt, idx) => (
                  <g key={idx} className="cursor-pointer group">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={hoveredPoint === idx ? "7" : "4.5"}
                      fill={hoveredPoint === idx ? "#f58220" : "#13448a"}
                      stroke="white"
                      strokeWidth="2.5"
                      onMouseEnter={() => setHoveredPoint(idx)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    
                    {/* X axis labels */}
                    <text x={pt.x} y="215" textAnchor="middle" className="text-[10px] fill-gray-400 font-bold">
                      {pt.label}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Hover dynamic tooltip popup */}
              {hoveredPoint !== null && (
                <div
                  className="absolute bg-[#0f294a] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-md pointer-events-none"
                  style={{
                    left: `${(activeStats.trendPoints[hoveredPoint].x / 480) * 100}%`,
                    top: `${(activeStats.trendPoints[hoveredPoint].y / 220) * 100 - 15}%`,
                    transform: 'translate(-50%, -100%)'
                  }}
                >
                  <span className="block text-blue-200 uppercase text-[9px] tracking-wider font-extrabold">{activeStats.trendPoints[hoveredPoint].label}</span>
                  <span className="block text-[13px] font-extrabold mt-0.5">{activeStats.trendPoints[hoveredPoint].count} Requests</span>
                </div>
              )}
            </div>
          </div>

          {/* Chart 2: Service Usage Progress Bars */}
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-6">
            <h3 className="text-[16px] font-extrabold text-[#0f294a] pb-4 border-b border-gray-100 flex items-center gap-2">
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Service Usage
            </h3>

            <div className="space-y-4.5 text-[12.5px] font-semibold text-gray-700">
              {activeStats.usage.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[12.5px]">
                    <span className="font-bold text-gray-700 truncate max-w-[170px]">{item.name}</span>
                    <span className="text-gray-400 font-bold">{item.count} ({item.pct}%)</span>
                  </div>
                  
                  {/* Progress bar background */}
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#13448a] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard: Agent Performance */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-[16px] font-extrabold text-[#0f294a] flex items-center gap-2">
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                </svg>
                Agent Performance
              </h3>
              <span className="text-[11.5px] text-gray-450 font-bold bg-[#fcf8e3] text-[#d97706] px-2.5 py-0.5 rounded-full border border-[#fef3c7]">
                Top verified certifiers
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TOP_AGENTS.map((agent, idx) => (
                <div key={idx} className="border border-gray-150 rounded-xl p-5 text-center shadow-sm relative space-y-3.5 hover:border-[#13448a] transition-all">
                  
                  {/* Top rank ribbon */}
                  <span style={{ width: '22px', height: '22px' }} className={`absolute top-3.5 left-3.5 rounded-full flex items-center justify-center text-[11px] font-extrabold border ${
                    agent.rank === 1 
                      ? 'bg-amber-50 border-amber-300 text-amber-700' 
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    #{agent.rank}
                  </span>

                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="h-14 w-14 rounded-full object-cover border border-gray-150 mx-auto"
                  />

                  <div>
                    <h4 className="text-[14.5px] font-extrabold text-gray-800">{agent.name}</h4>
                    <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">Rating: <span className="text-amber-500 font-extrabold">★ {agent.rating}</span></span>
                  </div>

                  <div className="border-t border-gray-50 pt-3 text-[12.5px] font-semibold text-gray-500 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Completed</span>
                      <span className="text-gray-850 font-bold mt-0.5 block">{agent.completedCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Success Rate</span>
                      <span className="text-emerald-600 font-bold mt-0.5 block">{agent.completionRate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-6 px-6 mt-12">
        <div className="max-w-[1344px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] font-semibold text-gray-550">
          <div>
            © 2024 SevaSetu National Portal. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="#" className="hover:text-[#13448a] no-underline">Privacy Policy</Link>
            <Link to="#" className="hover:text-[#13448a] no-underline">Terms of Service</Link>
            <Link to="#" className="hover:text-[#13448a] no-underline">Accessibility</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
