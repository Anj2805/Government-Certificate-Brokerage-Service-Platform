import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { adminApi } from '../../api/adminApi';

const TOP_AGENTS = [
  { rank: 1, name: "Priya Sharma", completionRate: "98%", rating: "4.9", completedCount: 342, avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80" },
  { rank: 2, name: "Rajesh Kumar", completionRate: "96%", rating: "4.8", completedCount: 310, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80" },
  { rank: 3, name: "Anil Deshmukh", completionRate: "94%", rating: "4.7", completedCount: 295, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80" },
  { rank: 4, name: "Sunita Verma", completionRate: "92%", rating: "4.7", completedCount: 280, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80" }
];

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalAgents: 0,
    totalServices: 0,
    totalRequests: 0,
    completedRequests: 0,
    rejectedRequests: 0,
    pendingRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await adminApi.getDashboardMetrics();
        if (response.data?.metrics) {
          setMetrics(response.data.metrics);
        }
      } catch (err) {
        console.error("Failed to load admin metrics", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);



  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
              Administrative Command Center
            </h1>
            <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
              Monitor, audit, and analyze the SevaSetu platform metrics.
            </p>
          </div>
        </div>

        {/* Analytics Cards Grid (6 columns) */}
        {isLoading ? (
          <div className="py-20 flex justify-center w-full">
            <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Users */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Users</span>
            <span className="text-[20px] font-extrabold text-gray-800 mt-1 block">{metrics.totalUsers}</span>
          </div>

          {/* Card 2: Agents */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Agents</span>
            <span className="text-[20px] font-extrabold text-gray-800 mt-1 block">{metrics.totalAgents}</span>
          </div>

          {/* Card 3: Services */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Services</span>
            <span className="text-[20px] font-extrabold text-gray-800 mt-1 block">{metrics.totalServices}</span>
          </div>

          {/* Card 4: Requests */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Requests</span>
            <span className="text-[20px] font-extrabold text-blue-600 mt-1 block">{metrics.totalRequests}</span>
          </div>

          {/* Card 5: Completed */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Completed</span>
            <span className="text-[20px] font-extrabold text-emerald-600 mt-1 block">{metrics.completedRequests}</span>
          </div>

          {/* Card 6: Rejected */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm flex flex-col justify-between min-h-[92px]">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Rejected</span>
            <span className="text-[20px] font-extrabold text-red-550 mt-1 block">{metrics.rejectedRequests}</span>
          </div>
        </div>
        )}

        {/* Charts & Leaderboard Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
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
