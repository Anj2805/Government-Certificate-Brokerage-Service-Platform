import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PATHS } from '../../config/paths';

const INITIAL_REQUESTS = [
  { id: "REQ-2024-9105", citizenName: "Anjali Sinha", serviceType: "Caste Certificate", agentName: "Priya Sharma", dateSubmitted: "2023-11-02", status: "In Progress" },
  { id: "REQ-2024-9211", citizenName: "Anil Deshmukh", serviceType: "Birth Certificate", agentName: "Unassigned", dateSubmitted: "2023-11-15", status: "Submitted" },
  { id: "REQ-2024-9350", citizenName: "Sunita Verma", serviceType: "Domicile Certificate", agentName: "Rajesh Kumar", dateSubmitted: "2023-12-01", status: "Documents Required" },
  { id: "REQ-2024-9488", citizenName: "Vikram Singh", serviceType: "PAN Card Update", agentName: "Unassigned", dateSubmitted: "2023-12-10", status: "Submitted" },
  { id: "REQ-2024-8842", citizenName: "Rajesh Kumar", serviceType: "Income Certificate", agentName: "Rajesh Kumar", dateSubmitted: "2023-10-12", status: "Completed" },
  { id: "REQ-2024-9543", citizenName: "Neha Gupta", serviceType: "Caste Certificate", agentName: "Priya Sharma", dateSubmitted: "2023-12-20", status: "In Progress" },
  { id: "REQ-2024-9602", citizenName: "Amit Kumar", serviceType: "Birth Certificate", agentName: "Sunita Verma", dateSubmitted: "2024-01-02", status: "Completed" }
];

const AVAILABLE_AGENTS = [
  { name: "Rajesh Kumar", department: "Revenue Department" },
  { name: "Priya Sharma", department: "Revenue Department" },
  { name: "Sunita Verma", department: "Social Justice & Empowerment" }
];

export default function ManageRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  
  // Advanced Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [agentFilter, setAgentFilter] = useState("All");
  const [dateRangeFilter, setDateRangeFilter] = useState("All");

  // Modals state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [newAgentName, setNewAgentName] = useState("Rajesh Kumar");
  const [newStatus, setNewStatus] = useState("Assigned");

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    setRequests(prev => prev.map(req => {
      if (req.id === selectedRequestId) {
        alert(`Successfully assigned Agent ${newAgentName} to Request ${selectedRequestId}`);
        return { ...req, agentName: newAgentName, status: req.status === "Submitted" ? "Assigned" : req.status };
      }
      return req;
    }));
    setShowAssignModal(false);
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    setRequests(prev => prev.map(req => {
      if (req.id === selectedRequestId) {
        alert(`Successfully updated Request ${selectedRequestId} status to ${newStatus}`);
        return { ...req, status: newStatus };
      }
      return req;
    }));
    setShowStatusModal(false);
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    // search text filter
    const matchesSearch = req.id.toLowerCase().includes(search.toLowerCase()) || 
                          req.citizenName.toLowerCase().includes(search.toLowerCase());
    
    // status filter
    const matchesStatus = statusFilter === "All" || req.status === statusFilter;
    
    // service filter
    const matchesService = serviceFilter === "All" || req.serviceType === serviceFilter;
    
    // agent filter
    const matchesAgent = agentFilter === "All" || 
                         (agentFilter === "Unassigned" && req.agentName === "Unassigned") || 
                         (req.agentName === agentFilter);
    
    // date range filter
    let matchesDate = true;
    if (dateRangeFilter === "Last 7 Days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesDate = new Date(req.dateSubmitted) >= sevenDaysAgo;
    } else if (dateRangeFilter === "Last 30 Days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      matchesDate = new Date(req.dateSubmitted) >= thirtyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesService && matchesAgent && matchesDate;
  });

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
            Total Requests: {requests.length}
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
                <option value="Submitted">Submitted</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Documents Required">Documents Required</option>
                <option value="Completed">Completed</option>
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
                <option value="Rajesh Kumar">Rajesh Kumar</option>
                <option value="Priya Sharma">Priya Sharma</option>
                <option value="Sunita Verma">Sunita Verma</option>
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
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4.5 font-bold text-[#13448a]">
                        <button
                          onClick={() => navigate(PATHS.ADMIN_REQUEST_DETAILS.replace(":id", req.id))}
                          className="hover:underline text-left"
                        >
                          {req.id}
                        </button>
                      </td>
                      <td className="px-6 py-4.5 text-gray-800 font-bold">{req.citizenName}</td>
                      <td className="px-6 py-4.5">{req.serviceType}</td>
                      <td className="px-6 py-4.5 text-gray-500 font-semibold">{req.dateSubmitted}</td>
                      <td className="px-6 py-4.5">
                        {req.agentName === "Unassigned" ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                            Unassigned
                          </span>
                        ) : (
                          <span className="text-gray-700 font-bold">
                            👤 {req.agentName}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5">
                        {req.status === "Completed" && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Completed
                          </span>
                        )}
                        {req.status === "In Progress" && (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            In Progress
                          </span>
                        )}
                        {req.status === "Assigned" && (
                          <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Assigned
                          </span>
                        )}
                        {req.status === "Submitted" && (
                          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Submitted
                          </span>
                        )}
                        {req.status === "Documents Required" && (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Docs Needed
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequestId(req.id);
                            setNewAgentName(req.agentName === "Unassigned" ? "Rajesh Kumar" : req.agentName);
                            setShowAssignModal(true);
                          }}
                          className="h-8 px-2.5 rounded border border-[#e2e8f0] hover:border-[#13448a] hover:bg-[#13448a]/5 text-[11.5px] font-bold text-gray-700 hover:text-[#13448a] transition-all"
                        >
                          Assign Agent
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequestId(req.id);
                            setNewStatus(req.status);
                            setShowStatusModal(true);
                          }}
                          className="h-8 px-2.5 rounded border border-[#e2e8f0] hover:border-[#13448a] hover:bg-[#13448a]/5 text-[11.5px] font-bold text-gray-700 hover:text-[#13448a] transition-all"
                        >
                          Update Status
                        </button>
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
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a]"
                >
                  {AVAILABLE_AGENTS.map((ag, idx) => (
                    <option key={idx} value={ag.name}>{ag.name} ({ag.department})</option>
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

      {/* UPDATE STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Update Request Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <form onSubmit={handleStatusSubmit} className="space-y-4 text-[13.5px] font-semibold">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Request ID</label>
                <div className="h-10 px-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center text-gray-700 font-bold">
                  {selectedRequestId}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a]"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Documents Required">Documents Required</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 h-11 border border-gray-200 hover:bg-gray-50 text-[13px] font-bold text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#13448a] hover:bg-[#0c316a] text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors"
                >
                  Apply Status
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
