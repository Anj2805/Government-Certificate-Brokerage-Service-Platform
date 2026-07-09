import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { adminApi } from '../../api/adminApi';

export default function ManageRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Advanced Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [agentFilter, setAgentFilter] = useState("All");
  const [dateRangeFilter, setDateRangeFilter] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reqRes, agentRes] = await Promise.all([
        adminApi.listRequests({ page: currentPage, limit: itemsPerPage }),
        adminApi.listAgents({ limit: 100 })
      ]);
      setRequests(reqRes.data?.requests || []);
      const meta = reqRes.meta || {};
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.total || (reqRes.data?.requests || []).length);
      setAgents(agentRes.data?.agents || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };



  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedRequestObj, setSelectedRequestObj] = useState(null);
  const [newAgentId, setNewAgentId] = useState("");

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedRequestObj?.assignedAgent) {
        await adminApi.reassignAgent(selectedRequestId, newAgentId);
      } else {
        await adminApi.assignAgent(selectedRequestId, newAgentId);
      }
      alert(`Successfully assigned Agent to Request ${selectedRequestId.substring(0, 8)}`);
      fetchData();
      setShowAssignModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to assign agent');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    // search text filter
    const citizenName = `${req.citizen?.firstName || ''} ${req.citizen?.lastName || ''}`.toLowerCase();
    const matchesSearch = req._id.toLowerCase().includes(search.toLowerCase()) ||
                          citizenName.includes(search.toLowerCase());

    // status filter
    const matchesStatus = statusFilter === "All" || req.status === statusFilter.toLowerCase();

    // service filter
    const matchesService = serviceFilter === "All" || req.service?.name === serviceFilter;

    // agent filter
    const matchesAgent = agentFilter === "All" ||
                         (agentFilter === "Unassigned" && !req.assignedAgent) ||
                         (req.assignedAgent && req.assignedAgent._id === agentFilter);

    // date range filter
    let matchesDate = true;
    if (dateRangeFilter === "Last 7 Days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesDate = new Date(req.createdAt) >= sevenDaysAgo;
    } else if (dateRangeFilter === "Last 30 Days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesDate = new Date(req.createdAt) >= thirtyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesService && matchesAgent && matchesDate;
  });

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">

        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
              Manage Service Requests
            </h1>
            <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
              Review, assign, and track the status of all public application requests.
            </p>
          </div>

          <div className="inline-flex h-11 items-center px-4 rounded-lg bg-gray-50 border border-gray-200 text-[13px] font-bold text-gray-600">
            Total Requests: {totalItems}
          </div>
        </div>

        {/* Advanced Filters Section */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm space-y-4">
          <h3 className="text-[12.5px] font-bold text-gray-450 uppercase tracking-wider">Advanced Filters</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Search Citizen / ID</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] text-[13px] font-semibold text-gray-700 outline-none"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#13448a]"
              >
                <option value="All">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="documents_required">Documents Required</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Service Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Service Type</label>
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#13448a]"
              >
                <option value="All">All Services</option>
                <option value="Income Certificate">Income Certificate</option>
                <option value="Domicile Certificate">Domicile Certificate</option>
                <option value="Birth Certificate">Birth Certificate</option>
                <option value="Caste Certificate">Caste Certificate</option>
                <option value="PAN Card Update">PAN Card Update</option>
              </select>
            </div>

            {/* Agent Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Assigned Agent</label>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#13448a]"
              >
                <option value="All">All Agents</option>
                <option value="Unassigned">Unassigned Only</option>
                {agents.map(ag => (
                  <option key={ag._id} value={ag._id}>{ag.firstName} {ag.lastName}</option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">Submission Period</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-white text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#13448a]"
              >
                <option value="All">All Time</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Requests Table Catalog */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Citizen Request Audit Table
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4.5">Request ID</th>
                  <th className="px-6 py-4.5">Citizen Name</th>
                  <th className="px-6 py-4.5">Service Requested</th>
                  <th className="px-6 py-4.5">Submitted Date</th>
                  <th className="px-6 py-4.5">Assigned Agent</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px] font-semibold text-gray-600">
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="h-8 w-8 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="mt-3 text-[13px] font-bold text-gray-500">Loading requests...</p>
                    </td>
                  </tr>
                ) : filteredRequests.length > 0 ? (
                  filteredRequests.map((req, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4.5 font-bold text-[#13448a]">
                        <button
                          onClick={() => navigate(PATHS.ADMIN_REQUEST_DETAILS.replace(":id", req._id))}
                          className="hover:underline text-left"
                        >
                          {req._id.substring(0, 10)}...
                        </button>
                      </td>
                      <td className="px-6 py-4.5 text-gray-800 font-bold">{req.citizen?.firstName} {req.citizen?.lastName}</td>
                      <td className="px-6 py-4.5">{req.service?.name}</td>
                      <td className="px-6 py-4.5 text-gray-500 font-semibold">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4.5">
                        {!req.assignedAgent ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            Unassigned
                          </span>
                        ) : (
                          <span className="text-gray-700 font-bold">
                            👤 {req.assignedAgent.firstName} {req.assignedAgent.lastName}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 capitalize">
                        {req.status === "completed" && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Completed
                          </span>
                        )}
                        {req.status === "in_progress" && (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            In Progress
                          </span>
                        )}
                        {req.status === "assigned" && (
                          <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Assigned
                          </span>
                        )}
                        {req.status === "submitted" && (
                          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Submitted
                          </span>
                        )}
                        {req.status === "documents_required" && (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Docs Needed
                          </span>
                        )}
                        {req.status === "draft" && (
                          <span className="inline-flex items-center gap-1 text-gray-700 bg-gray-100 border border-gray-300 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Draft
                          </span>
                        )}
                        {req.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-2 shrink-0">
                        {req.status !== 'completed' && req.status !== 'rejected' && req.status !== 'draft' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequestId(req._id);
                              setSelectedRequestObj(req);
                              setNewAgentId(req.assignedAgent?._id || (agents.length > 0 ? agents[0]._id : ""));
                              setShowAssignModal(true);
                            }}
                            className="h-8 px-2.5 rounded border border-[#e2e8f0] hover:border-[#13448a] hover:bg-[#13448a]/5 text-[11.5px] font-bold text-gray-700 hover:text-[#13448a] transition-all"
                          >
                            {req.assignedAgent ? 'Reassign Agent' : 'Assign Agent'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[14px] text-gray-400 font-bold bg-white">
                      No citizen requests match your filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!isLoading && requests.length > 0 && (
            <div className="px-6 py-4.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4 text-[12.5px] font-bold text-gray-400">
              <span>
                Showing <span className="text-gray-700">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-gray-700">{totalItems}</span> requests
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 px-3.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-extrabold text-gray-700 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  ‹ Prev
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => paginate(idx + 1)}
                    className={`h-8 w-8 rounded-lg text-[12px] font-extrabold transition-colors ${
                      currentPage === idx + 1
                        ? 'bg-[#13448a] text-white shadow-sm'
                        : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-extrabold text-gray-700 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  Next ›
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ASSIGN AGENT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Assign Service Agent</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-[13.5px] font-semibold">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Request ID</label>
                <div className="h-10 px-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center text-gray-700 font-bold">
                  {selectedRequestId}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Choose Agent</label>
                <select
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a]"
                >
                  {agents.filter(a => a.agentStatus === 'approved').map((ag, idx) => (
                    <option key={ag._id} value={ag._id}>{ag.firstName} {ag.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 h-11 border border-gray-200 hover:bg-gray-50 text-[13px] font-bold text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#13448a] hover:bg-[#0c316a] text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



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
