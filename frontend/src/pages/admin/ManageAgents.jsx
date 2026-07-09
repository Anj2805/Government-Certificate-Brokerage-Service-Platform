import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/adminApi';

export default function ManageAgents() {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  // Detail Modal state
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.listAgents({ page: currentPage, limit: itemsPerPage });
      setAgents(response.data?.agents || []);
      const meta = response.meta || {};
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.total || (response.data?.agents || []).length);
    } catch (err) {
      console.error(err);
      alert('Failed to load agents.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [currentPage]);

  const handleApprove = async (agentId) => {
    try {
      await adminApi.approveAgent(agentId);
      alert('Agent approved successfully.');
      fetchAgents();
      setShowDetailModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to approve agent');
    }
  };

  const handleReject = async (agentId) => {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await adminApi.rejectAgent(agentId, reason);
      alert('Agent rejected successfully.');
      fetchAgents();
      setShowDetailModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to reject agent');
    }
  };

  const handleSuspend = async (agentId) => {
    const reason = window.prompt("Enter suspension reason:");
    if (reason === null) return;
    try {
      await adminApi.suspendAgent(agentId, reason);
      alert('Agent suspended successfully.');
      fetchAgents();
      setShowDetailModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to suspend agent');
    }
  };

  // Filter list (client-side for search term, although the API supports server side search)
  const filteredAgents = agents.filter(ag => {
    const matchesSearch = (ag.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (ag.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ag.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || ag.agentStatus === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };



  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
              Manage Service Agents
            </h1>
            <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
              Register, approve, verify, and moderate government service agents.
            </p>
          </div>

          <div className="inline-flex h-11 items-center px-4 rounded-lg bg-gray-50 border border-gray-200 text-[13px] font-bold text-gray-600">
            Total Registrations: {totalItems}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search agent ID, name, or department..."
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-white border border-[#e2e8f0] focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] text-[13.5px] font-semibold text-gray-700 placeholder-gray-400 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[12.5px] font-bold text-gray-450 shrink-0">Filter Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3.5 rounded-lg border border-[#e2e8f0] bg-white text-[13px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#13448a]"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved Only</option>
              <option value="Pending Approval">Pending Approval Only</option>
              <option value="Suspended">Suspended Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Agents Table Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              </svg>
              Agent Administration Roster
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4.5">Agent Details</th>
                  <th className="px-6 py-4.5">Agent ID</th>
                  <th className="px-6 py-4.5">Department</th>
                  <th className="px-6 py-4.5">Joined Date</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px] font-semibold text-gray-600">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="h-8 w-8 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="mt-3 text-[13px] font-bold text-gray-500">Loading agents...</p>
                    </td>
                  </tr>
                ) : filteredAgents.length > 0 ? (
                  filteredAgents.map((ag, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#eff6ff] text-[#13448a] flex items-center justify-center text-[14px] font-extrabold border border-blue-100 shrink-0">
                            {(ag.firstName?.[0] || 'A').toUpperCase()}{(ag.lastName?.[0] || '').toUpperCase()}
                          </div>
                          <div>
                            <span className="font-extrabold text-gray-800 block">{ag.firstName} {ag.lastName}</span>
                            <span className="text-[11.5px] text-gray-400 font-bold block mt-0.5">{ag.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 font-bold text-[#13448a]">{ag._id.substring(0, 8)}...</td>
                      <td className="px-6 py-4.5 text-gray-700">Central Services</td>
                      <td className="px-6 py-4.5 text-gray-500">{new Date(ag.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4.5">
                        {ag.agentStatus === "approved" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-100">
                            Approved
                          </span>
                        )}
                        {ag.agentStatus === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border bg-blue-50 text-blue-700 border-blue-100">
                            Pending
                          </span>
                        )}
                        {ag.agentStatus === "suspended" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border bg-amber-50 text-amber-700 border-amber-100">
                            Suspended
                          </span>
                        )}
                        {ag.agentStatus === "rejected" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border bg-red-50 text-red-700 border-red-100">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgent(ag);
                            setShowDetailModal(true);
                          }}
                          className="h-8 px-3 rounded border border-[#e2e8f0] hover:border-[#13448a] hover:bg-[#13448a]/5 text-[11.5px] font-bold text-gray-700 hover:text-[#13448a] transition-all"
                        >
                          View Credentials
                        </button>

                        {ag.agentStatus === "pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(ag._id)}
                              className="h-8 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-[11.5px] font-bold text-white transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(ag._id)}
                              className="h-8 px-3 rounded bg-red-600 hover:bg-red-700 text-[11.5px] font-bold text-white transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : ag.agentStatus === "approved" ? (
                          <button
                            type="button"
                            onClick={() => handleSuspend(ag._id)}
                            className="h-8 px-3 rounded border border-amber-200 hover:bg-amber-50 text-[11.5px] font-bold text-amber-600 hover:text-amber-700 transition-all"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApprove(ag._id)}
                            className="h-8 px-3 rounded border border-emerald-200 hover:bg-emerald-50 text-[11.5px] font-bold text-emerald-600 hover:text-emerald-700 transition-all"
                          >
                            Re-Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-[14px] text-gray-400 font-bold bg-white">
                      No service agents match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!isLoading && agents.length > 0 && (
            <div className="px-6 py-4.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4 text-[12.5px] font-bold text-gray-400">
              <span>
                Showing <span className="text-gray-700">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-gray-700">{totalItems}</span> agents
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

      {/* AGENT DETAIL MODAL */}
      {showDetailModal && selectedAgent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Agent Security Credentials</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            {/* Profile Overview */}
            <div className="flex items-center gap-4 border-b border-gray-50 pb-5">
              <div className="h-16 w-16 rounded-full bg-[#eff6ff] text-[#13448a] flex items-center justify-center text-[22px] font-extrabold border border-blue-100 shrink-0">
                {(selectedAgent.firstName?.[0] || 'A').toUpperCase()}{(selectedAgent.lastName?.[0] || '').toUpperCase()}
              </div>
              <div>
                <h4 className="text-[18px] font-extrabold text-gray-800">{selectedAgent.firstName} {selectedAgent.lastName}</h4>
                <p className="text-[12.5px] font-bold text-[#13448a] mt-0.5">Central Services</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[11.5px] text-gray-400 font-semibold">ID: {selectedAgent._id.substring(0, 8)}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                    selectedAgent.agentStatus === "approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : selectedAgent.agentStatus === "pending"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : selectedAgent.agentStatus === "suspended"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-red-50 text-red-700 border-red-100"
                  }`}>
                    {selectedAgent.agentStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-4 text-[13px] font-semibold text-gray-700">
              <div>
                <span className="text-[10px] text-gray-450 block uppercase tracking-wider">Email Address</span>
                <span className="block mt-0.5 text-gray-800 font-bold">{selectedAgent.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-450 block uppercase tracking-wider">Contact Phone</span>
                <span className="block mt-0.5 text-gray-800 font-bold">{selectedAgent.phone || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-gray-450 block uppercase tracking-wider">Joined Date</span>
                <span className="block mt-0.5 text-gray-850 font-bold">{new Date(selectedAgent.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Action Bar inside details */}
            <div className="border-t border-gray-100 pt-5 flex items-center justify-between gap-3">
              <div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="h-10 px-4 border border-gray-200 hover:bg-gray-50 text-[12.5px] font-bold text-gray-700 rounded-lg transition-colors"
                >
                  Close details
                </button>
              </div>

              <div className="flex gap-2">
                {selectedAgent.agentStatus === "pending" ? (
                  <>
                    <button
                      onClick={() => handleReject(selectedAgent._id)}
                      className="h-10 px-4 bg-red-650 hover:bg-red-750 text-[12.5px] font-bold text-white rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedAgent._id)}
                      className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-[12.5px] font-bold text-white rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                  </>
                ) : selectedAgent.agentStatus === "approved" ? (
                  <button
                    onClick={() => handleSuspend(selectedAgent._id)}
                    className="h-10 px-4 bg-amber-600 hover:bg-amber-700 text-[12.5px] font-bold text-white rounded-lg transition-colors"
                  >
                    Suspend Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleApprove(selectedAgent._id)}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-[12.5px] font-bold text-white rounded-lg transition-colors"
                  >
                    Re-Approve Account
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-6 px-6 mt-12">
        <div className="max-w-[1344px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] font-semibold text-gray-500">
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
