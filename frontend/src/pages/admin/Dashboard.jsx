import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { adminApi } from '../../api/adminApi';

import { Activity, Users, FileText, CheckCircle, AlertTriangle, Layers } from 'lucide-react';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCitizens: 0,
    totalAgents: 0,
    pendingAgentApprovals: 0,
    approvedAgents: 0,
    rejectedAgents: 0,
    totalServices: 0,
    activeServices: 0,
    inactiveServices: 0,
    totalRequests: 0,
    draftRequests: 0,
    submittedRequests: 0,
    assignedRequests: 0,
    inProgressRequests: 0,
    correctionRequiredRequests: 0,
    completedRequests: 0,
    rejectedRequests: 0,
    pendingRequests: 0,
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
        toast.error(err?.response?.data?.message || 'An error occurred');
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
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Administrative Command Center
            </h1>
            <p className="text-base text-gray-500 font-medium mt-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 shadow-sm flex flex-col min-h-[140px] transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Users</span>
              </div>
              <div className="flex justify-between items-end mt-auto">
                <div>
                  <span className="text-4xl font-bold text-gray-900 block">{metrics.totalUsers}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-500 block mb-1">{metrics.totalCitizens} Citizens</span>
                  <span className="text-sm font-semibold text-gray-500 block">{metrics.totalAgents} Agents</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 shadow-sm flex flex-col min-h-[140px] transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Agent Approvals</span>
              </div>
              <div className="flex justify-between items-end mt-auto">
                <div>
                  <span className="text-4xl font-bold text-gray-900 block">{metrics.approvedAgents}</span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1 block">Approved</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-amber-500 block mb-1">{metrics.pendingAgentApprovals} Pending</span>
                  <span className="text-sm font-semibold text-red-500 block">{metrics.rejectedAgents} Rejected</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 shadow-sm flex flex-col min-h-[140px] transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Services</span>
              </div>
              <div className="flex justify-between items-end mt-auto">
                <div>
                  <span className="text-4xl font-bold text-gray-900 block">{metrics.totalServices}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-emerald-500 block mb-1">{metrics.activeServices} Active</span>
                  <span className="text-sm font-semibold text-gray-500 block">{metrics.inactiveServices} Inactive</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6 lg:p-8 shadow-sm flex flex-col min-h-[140px] transition-all hover:shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Requests</span>
              </div>
              <div className="flex justify-between items-end mt-auto">
                <div>
                  <span className="text-4xl font-bold text-gray-900 block">{metrics.totalRequests}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-emerald-500 block mb-1">{metrics.completedRequests} Completed</span>
                  <span className="text-sm font-semibold text-amber-500 block mb-1">{metrics.pendingRequests} Pending</span>
                  <span className="text-sm font-semibold text-red-500 block">{metrics.rejectedRequests} Rejected</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operational Attention Queue */}
        {!isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl border border-amber-200 p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Action Required
                </h3>
              </div>
              <div className="space-y-4">
                {metrics.pendingAgentApprovals > 0 ? (
                  <Link to={PATHS.ADMIN_AGENTS} className="block p-5 border border-amber-100 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-amber-900">Pending Agent Approvals</h4>
                        <p className="text-sm font-medium text-amber-700 mt-1">There are agents waiting for identity verification and approval.</p>
                      </div>
                      <span className="bg-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">{metrics.pendingAgentApprovals}</span>
                    </div>
                  </Link>
                ) : (
                  <div className="p-5 border border-gray-100 bg-gray-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-500">No pending agent approvals.</p>
                  </div>
                )}
                
                {metrics.submittedRequests > 0 ? (
                  <Link to={PATHS.ADMIN_REQUESTS} className="block p-5 border border-amber-100 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-amber-900">Unassigned Requests</h4>
                        <p className="text-sm font-medium text-amber-700 mt-1">New requests need to be assigned to agents.</p>
                      </div>
                      <span className="bg-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">{metrics.submittedRequests}</span>
                    </div>
                  </Link>
                ) : (
                  <div className="p-5 border border-gray-100 bg-gray-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-500">No unassigned requests.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Recent Activity (Live Analytics)
                </h3>
                <Link to={PATHS.ADMIN_ANALYTICS || "#"} className="text-sm font-semibold text-blue-600 hover:underline">
                  View Full Analytics &rarr;
                </Link>
              </div>
              <div className="space-y-4">
                <div className="p-5 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">In Progress Requests</span>
                    <span className="text-2xl font-bold text-gray-800">{metrics.inProgressRequests}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Awaiting Correction</span>
                    <span className="text-2xl font-bold text-amber-600">{metrics.correctionRequiredRequests}</span>
                  </div>
                </div>
                
                <div className="p-5 border border-slate-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Assigned Requests</span>
                    <span className="text-2xl font-bold text-gray-800">{metrics.assignedRequests}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Drafts</span>
                    <span className="text-2xl font-bold text-gray-500">{metrics.draftRequests}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 mt-12">
        <div className="max-w-[1344px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-medium text-gray-500">
          <div>
            © 2024 SevaSetu National Portal. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="#" className="hover:text-blue-700 transition-colors no-underline">Privacy Policy</Link>
            <Link to="#" className="hover:text-blue-700 transition-colors no-underline">Terms of Service</Link>
            <Link to="#" className="hover:text-blue-700 transition-colors no-underline">Accessibility</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
