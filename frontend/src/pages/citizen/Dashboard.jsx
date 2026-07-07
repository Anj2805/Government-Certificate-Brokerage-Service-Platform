import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { useAuth } from '../../hooks/useAuth';
import { requestApi } from '../../api/requestApi';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const [summary, setSummary] = useState({
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    documentsRequiredRequests: 0
  });

  const loadDashboardData = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const [summaryData, listData] = await Promise.all([
        requestApi.getRequestsSummary(),
        requestApi.listOwnRequests({ limit: 5 })
      ]);
      setSummary(summaryData);
      const list = listData.data.requests || [];
      setRequests(list);

    } catch (err) {
      console.error(err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const actionNotifications = requests
    .filter((request) => request.status === 'documents_required')
    .map((request) => ({
      id: `action-${request._id}`,
      type: 'action',
      text: `Action required: upload corrected documents for ${request.serviceSnapshot?.serviceName || 'request'} (#${request.requestNumber}).`,
      time: 'From request status',
    }));
  const unreadCount = actionNotifications.length;

  // Stat calculations
  const totalCount = summary.totalRequests;
  const activeCount = summary.activeRequests;
  const completedCount = summary.completedRequests;
  const actionNeededCount = summary.documentsRequiredRequests;

  // Recent 5 requests for table
  const recentRequests = requests;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-amber-50 text-amber-700 border-amber-250';
      case 'assigned':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'submitted':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'draft':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-red-50/50 text-red-705 border-red-250';
      case 'documents_required':
        return 'bg-red-50 text-red-700 border-red-200 font-extrabold';
      default:
        return 'bg-gray-50 text-gray-750 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'documents_required') return 'Action Needed';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen text-[#111827] bg-[#f8fafc]">
        <div className="max-w-[1344px] w-full mx-auto px-6 py-20 flex-1 flex flex-col items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[14.5px] text-gray-500 font-bold">Loading dashboard overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Scrollable container for dashboard grid */}
      <div className="flex-1 max-w-[1344px] w-full mx-auto px-6 py-8">
        
        {/* Title Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
            Citizen Dashboard
          </h1>
          <p className="text-[14.5px] text-gray-500 font-semibold mt-1">
            Welcome back, {user?.firstName || 'Citizen'}. Here is an overview of your active applications.
          </p>
        </div>

        {/* 3-Column Grid for main content + right panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Left Columns (Takes 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Requests */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[12.5px] font-bold text-gray-405 uppercase tracking-wider block">Total Requests</span>
                  <span className="text-[28px] font-extrabold text-[#13448a] mt-1.5 block">{totalCount}</span>
                  <span className="text-[11px] font-bold text-gray-400 mt-1 flex items-center gap-1">
                    <span className="text-[#13448a]">↗</span> Cumulative submissions
                  </span>
                </div>
                <div className="h-12 w-12 rounded-lg bg-[#13448a] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Active Requests */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[12.5px] font-bold text-gray-405 uppercase tracking-wider block">Active Requests</span>
                  <span className="text-[28px] font-extrabold text-[#f58220] mt-1.5 block">{activeCount}</span>
                  <span className="text-[11px] font-bold text-gray-405 mt-1 flex items-center gap-1">
                    <span className="text-[#f58220]">↗</span> In-progress reviews
                  </span>
                </div>
                <div className="h-12 w-12 rounded-lg bg-[#f58220] flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Completed */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[12.5px] font-bold text-gray-405 uppercase tracking-wider block">Completed</span>
                  <span className="text-[28px] font-extrabold text-emerald-600 mt-1.5 block">{completedCount}</span>
                  <span className="text-[11px] font-bold text-gray-400 mt-1 flex items-center gap-1">
                    <span className="text-emerald-500">✓</span> Certificates issued
                  </span>
                </div>
                <div className="h-12 w-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                  <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
              </div>

              {/* Card 4: Action Required */}
              <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[12.5px] font-bold text-gray-405 uppercase tracking-wider block">Action Needed</span>
                  <span className="text-[28px] font-extrabold text-red-500 mt-1.5 block">{actionNeededCount}</span>
                  <span className="text-[11px] font-bold text-gray-400 mt-1 flex items-center gap-1">
                    <span className="text-red-500">⚠</span> Re-uploads required
                  </span>
                </div>
                <div className="h-12 w-12 rounded-lg bg-red-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Recent Service Requests Section */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-[18px] font-extrabold text-[#0f294a]">Recent Service Requests</h2>
                  <p className="text-[12.5px] text-gray-400 font-bold mt-0.5">Monitor the status of your latest document applications.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(PATHS.CITIZEN_REQUESTS)}
                  className="h-9 px-4 rounded-lg border border-gray-200 hover:border-[#13448a] hover:bg-[#13448a]/5 text-[12.5px] font-bold text-gray-700 hover:text-[#13448a] transition-all"
                >
                  View All History
                </button>
              </div>

              <div className="overflow-x-auto">
                {recentRequests.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-4.5">Request ID</th>
                        <th className="px-6 py-4.5">Service Name</th>
                        <th className="px-6 py-4.5">Date Filed</th>
                        <th className="px-6 py-4.5">Current Status</th>
                        <th className="px-6 py-4.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-[13.5px] font-semibold text-gray-650">
                      {recentRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4.5 font-bold text-[#13448a]">{req.requestNumber}</td>
                          <td className="px-6 py-4.5 font-extrabold text-gray-800">
                            {req.serviceSnapshot?.serviceName || req.service?.name}
                          </td>
                          <td className="px-6 py-4.5 text-gray-400">
                            {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4.5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase ${getStatusBadgeClass(req.status)}`}>
                              {getStatusLabel(req.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4.5">
                            <button
                              onClick={() => navigate(PATHS.CITIZEN_REQUEST_DETAILS.replace(':id', req._id))}
                              className="text-[#13448a] hover:text-[#0c316a] font-bold hover:underline text-[12.5px]"
                            >
                              View Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-10 text-gray-450 font-bold">
                    No service requests found. Click "New Application" to get started!
                  </div>
                )}
              </div>
            </div>

            {/* Need Help / Guidelines side-by-side cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Card 1: Need Help */}
              <div className="bg-[#eff6ff]/35 rounded-2xl border border-[#dbeafe] p-6 flex gap-4 shadow-sm">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#1e40af] border border-[#bfdbfe]">
                  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[14.5px] font-extrabold text-[#0f294a]">Need Help?</h3>
                  <p className="text-[13px] text-gray-500 font-semibold mt-1.5 leading-relaxed">
                    Support ticketing is planned for a later phase. For now, use request details to review status and document actions.
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3.5 text-[13px] font-extrabold text-gray-400">
                    Support module coming soon
                  </span>
                </div>
              </div>

              {/* Card 2: Guidelines */}
              <div className="bg-[#fff7ed]/35 rounded-2xl border border-[#ffedd5] p-6 flex gap-4 shadow-sm">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-[#fff7ed] flex items-center justify-center text-[#c2410c] border border-[#fed7aa]">
                  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[14.5px] font-extrabold text-[#0f294a]">Guidelines</h3>
                  <p className="text-[13px] text-gray-500 font-semibold mt-1.5 leading-relaxed">
                    Resource links are not configured yet. This area will connect to approved service guidance in a later phase.
                  </p>
                  <span className="inline-flex items-center gap-1 mt-3.5 text-[13px] font-extrabold text-gray-400">
                    Browse docs coming soon
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
              <h2 className="text-[15.5px] font-extrabold text-[#0f294a] pb-4 border-b border-gray-55">Quick Actions</h2>
              <p className="text-[12px] text-gray-400 font-bold mt-2">Common tasks frequently performed by citizens.</p>

              <div className="mt-5 space-y-3">
                {/* Action 1 */}
                <button
                  onClick={() => navigate(PATHS.SERVICES)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl hover:border-[#13448a] hover:shadow-sm transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#13448a]">
                      <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[13.5px] font-extrabold text-gray-800 group-hover:text-[#13448a] transition-colors block">New Application</span>
                      <span className="text-[11.5px] text-gray-400 font-bold block mt-0.5">Browse available services</span>
                    </div>
                  </div>
                  <svg style={{ width: '16px', height: '16px' }} className="text-gray-400 group-hover:text-[#13448a] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Action 2 */}
                <button
                  onClick={() => navigate(PATHS.CITIZEN_REQUESTS)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl hover:border-[#13448a] hover:shadow-sm transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#eff6ff] flex items-center justify-center text-[#13448a]">
                      <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[13.5px] font-extrabold text-gray-800 group-hover:text-[#13448a] transition-colors block">My Requests</span>
                      <span className="text-[11.5px] text-gray-400 font-bold block mt-0.5">Manage and update active requests</span>
                    </div>
                  </div>
                  <svg style={{ width: '16px', height: '16px' }} className="text-gray-400 group-hover:text-[#13448a] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-gray-50">
                <h2 className="text-[15.5px] font-extrabold text-[#0f294a]">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#13448a]/10 text-[#13448a]">
                    {unreadCount} Action{unreadCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-4">
                {actionNotifications.length > 0 ? actionNotifications.map(n => (
                  <div key={n.id} className="flex gap-3 relative pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <span className="h-2 w-2 rounded-full shrink-0 mt-1.5 bg-red-500"></span>
                    <div>
                      <p className="text-[12.5px] leading-relaxed font-bold text-gray-850">
                        {n.text}
                      </p>
                      <span className="text-[10px] font-bold text-gray-400 block mt-1">{n.time}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-[12.5px] font-semibold leading-relaxed text-gray-500">
                    No action-based request notifications. Full notification inbox is planned for a later phase.
                  </p>
                )}
              </div>
            </div>

            {/* Account Status Card */}
            <div className="bg-[#0f294a] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-[#10b981]">
                    <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="text-[14.5px] font-extrabold">Account Status</h3>
                </div>
                <p className="text-[12.5px] text-slate-300 font-semibold leading-relaxed mt-4">
                  You are signed in as a citizen. Identity verification is not enabled in this phase.
                </p>
              </div>

              {/* Watermark Logo symbol */}
              <div className="absolute -bottom-8 -right-8 opacity-[0.06] text-white pointer-events-none">
                <svg style={{ width: '120px', height: '120px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-6 px-6 mt-12">
        <div className="max-w-[1344px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] font-semibold text-gray-500">
          <div>
            © 2026 SevaSetu. All rights reserved.
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
