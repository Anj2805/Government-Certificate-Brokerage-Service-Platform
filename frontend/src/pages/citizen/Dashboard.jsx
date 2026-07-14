import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { useAuth } from '../../hooks/useAuth';
import { requestApi } from '../../api/requestApi';
import StatCard from '../../components/ui/StatCard';

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
      toast.error(err?.response?.data?.message || 'An error occurred');
        console.error(err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const actionNotifications = [
    ...requests
      .filter((request) => request.status === 'documents_required')
      .map((request) => ({
        id: `action-${request._id}`,
        type: 'action',
        text: `Action required: upload corrected documents for ${request.serviceSnapshot?.serviceName || 'request'} (#${request.requestNumber}).`,
        time: 'From request status',
      })),
    ...(user?.idProofStatus === 'rejected' ? [{
      id: 'action-id-proof',
      type: 'action',
      text: 'Action required: Your ID proof was rejected or missing. Please re-upload it in your profile.',
      time: 'Profile action',
    }] : [])
  ];
  const unreadCount = actionNotifications.length;

  // Stat calculations
  const totalCount = summary.totalRequests;
  const activeCount = summary.activeRequests;
  const completedCount = summary.completedRequests;
  const actionNeededCount = summary.documentsRequiredRequests + (user?.idProofStatus === 'rejected' ? 1 : 0);

  // Recent 5 requests for table
  const recentRequests = requests;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'under_review':
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
      case 'correction_required':
        return 'bg-red-50 text-red-700 border-red-200 font-extrabold';
      default:
        return 'bg-gray-50 text-gray-750 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'correction_required') return 'Action Needed';
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
    <>
      <div className="max-w-[1280px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
      
      {/* Title Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Citizen Dashboard
        </h1>
        <p className="text-base text-gray-500 font-medium mt-2">
          Welcome back, {user?.firstName || 'Citizen'}. Here is an overview of your active applications.
        </p>
      </div>

        {/* 3-Column Grid for main content + right panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          
          {/* Main Left Columns (Takes 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <StatCard
                title="Total Requests"
                value={totalCount}
                subtitle="Cumulative submissions"
                subtitleIcon="↗"
                colorTheme="blue"
                icon={
                  <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                }
              />
              <StatCard
                title="Active Requests"
                value={activeCount}
                subtitle="In-progress reviews"
                subtitleIcon="↗"
                colorTheme="orange"
                icon={
                  <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
              />
              <StatCard
                title="Completed"
                value={completedCount}
                subtitle="Certificates issued"
                subtitleIcon="✓"
                colorTheme="green"
                icon={
                  <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                }
              />
              <StatCard
                title="Action Needed"
                value={actionNeededCount}
                subtitle="Re-uploads required"
                subtitleIcon="⚠"
                colorTheme="red"
                icon={
                  <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                }
              />
            </div>

            {/* Recent Service Requests Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recent Service Requests</h2>
                  <p className="text-sm text-gray-500 font-medium mt-1">Monitor the status of your latest document applications.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(PATHS.CITIZEN_REQUESTS)}
                  className="h-10 px-5 rounded-lg border border-slate-200 hover:border-blue-600 hover:bg-blue-50 text-sm font-semibold text-slate-700 hover:text-blue-700 transition-all"
                >
                  View All History
                </button>
              </div>

              <div className="overflow-x-auto">
                {recentRequests.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-8 py-5">Request ID</th>
                        <th className="px-8 py-5">Service Name</th>
                        <th className="px-8 py-5">Date Filed</th>
                        <th className="px-8 py-5">Current Status</th>
                        <th className="px-8 py-5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                      {recentRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-5 font-semibold text-blue-700">{req.requestNumber}</td>
                          <td className="px-8 py-5 font-bold text-gray-900">
                            {req.serviceSnapshot?.serviceName || req.service?.name}
                          </td>
                          <td className="px-8 py-5 text-gray-500">
                            {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border uppercase ${getStatusBadgeClass(req.status)}`}>
                              {getStatusLabel(req.status)}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <button
                              onClick={() => navigate(PATHS.CITIZEN_REQUEST_DETAILS.replace(':id', req._id))}
                              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline text-sm"
                            >
                              View Status
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-slate-50/30">
                    <div className="h-20 w-20 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 border border-blue-100 shadow-sm transform -rotate-3 transition-transform hover:rotate-0">
                      <svg style={{ width: '36px', height: '36px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No Service Requests Yet</h3>
                    <p className="text-base text-gray-500 font-medium max-w-md mt-3">
                      You haven't submitted any applications. Discover available services and start your first request today.
                    </p>
                    <button
                      onClick={() => navigate(PATHS.CITIZEN_CREATE_REQUEST)}
                      className="mt-8 h-12 px-6 rounded-lg bg-[#f58220] hover:bg-[#e07216] text-base font-bold text-white shadow-md shadow-[#f58220]/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Start New Application
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Need Help / Guidelines side-by-side cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Card 1: Need Help */}
              <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-8 flex gap-5 shadow-sm">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-700 border border-blue-200/50">
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Need Help?</h3>
                  <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">
                    Support ticketing is planned for a later phase. For now, use request details to review status and document actions.
                  </p>
                  <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-blue-600/70">
                    Support module coming soon
                  </span>
                </div>
              </div>

              {/* Card 2: Guidelines */}
              <div className="bg-orange-50/50 rounded-2xl border border-orange-100 p-8 flex gap-5 shadow-sm">
                <div className="h-12 w-12 shrink-0 rounded-xl bg-orange-100/50 flex items-center justify-center text-orange-600 border border-orange-200/50">
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Guidelines</h3>
                  <p className="text-sm text-gray-500 font-medium mt-2 leading-relaxed">
                    Resource links are not configured yet. This area will connect to approved service guidance in a later phase.
                  </p>
                  <span className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-orange-600/70">
                    Browse docs coming soon
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar Column */}
          <div className="space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 pb-5 border-b border-slate-50">Quick Actions</h2>
              <p className="text-sm text-gray-500 font-medium mt-3">Common tasks frequently performed by citizens.</p>

              <div className="mt-6 space-y-4">
                {/* Action 1 */}
                <button
                  onClick={() => navigate(PATHS.SERVICES)}
                  className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-xl hover:border-blue-600 hover:shadow-sm transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors block">New Application</span>
                      <span className="text-xs text-gray-500 font-medium block mt-1">Browse available services</span>
                    </div>
                  </div>
                  <svg style={{ width: '18px', height: '18px' }} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* Action 2 */}
                <button
                  onClick={() => navigate(PATHS.CITIZEN_REQUESTS)}
                  className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-xl hover:border-blue-600 hover:shadow-sm transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors block">My Requests</span>
                      <span className="text-xs text-gray-500 font-medium block mt-1">Manage and update active requests</span>
                    </div>
                  </div>
                  <svg style={{ width: '18px', height: '18px' }} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center justify-between pb-5 border-b border-slate-50">
                <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    {unreadCount} Action{unreadCount === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-5">
                {actionNotifications.length > 0 ? actionNotifications.map(n => (
                  <div key={n.id} className="flex gap-4 relative pb-5 border-b border-slate-50 last:border-0 last:pb-0">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0 mt-2 bg-red-500"></span>
                    <div>
                      <p className="text-sm leading-relaxed font-semibold text-gray-800">
                        {n.text}
                      </p>
                      <span className="text-xs font-medium text-gray-500 block mt-1.5">{n.time}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm font-medium leading-relaxed text-gray-500">
                    No action-based request notifications. Full notification inbox is planned for a later phase.
                  </p>
                )}
              </div>
            </div>

            {/* Account Status Card */}
            <div className="bg-blue-900 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
                    <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold">Account Status</h3>
                </div>
                <p className="text-sm text-blue-100 font-medium leading-relaxed mt-5">
                  You are signed in as a citizen. Identity verification is not enabled in this phase.
                </p>
              </div>

              {/* Watermark Logo symbol */}
              <div className="absolute -bottom-8 -right-8 opacity-10 text-white pointer-events-none">
                <svg style={{ width: '140px', height: '140px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6">
        <div className="max-w-[1344px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-medium text-gray-500">
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
    </>
  );
}
