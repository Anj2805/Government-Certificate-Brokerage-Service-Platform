import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { agentApi } from '../../api/agentApi';
import { useAuth } from '../../hooks/useAuth';

export default function AgentDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    assigned: 0,
    inProgress: 0,
    completed: 0,
    docsRequired: 0
  });
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal control states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("In Progress");
  const [agentNote, setAgentNote] = useState("");
  const [uploadedDocName, setUploadedDocName] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("Verification Report");

  // Fetch Data
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, requestsData] = await Promise.all([
        agentApi.getDashboardStats(),
        agentApi.listAssignedRequests({ limit: 10 })
      ]);
      setStats({
        assigned: statsData.totalAssignedRequests || 0,
        inProgress: statsData.inProgressRequests || 0,
        completed: statsData.completedRequests || 0,
        docsRequired: statsData.documentsRequiredRequests || 0
      });
      setRequests(requestsData.data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      await agentApi.updateProgress(selectedRequestId, {
        status: selectedStatus,
        reason: agentNote
      });
      alert(`Successfully updated request status.`);
      setShowStatusModal(false);
      setAgentNote("");
      loadDashboardData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleUploadDocSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequestId || !uploadedDocName) {
      alert("Please specify a request and choose a verification document file.");
      return;
    }

    try {
      const fileInput = e.target.querySelector('input[type="file"]');
      const formData = new FormData();
      formData.append('document', fileInput.files[0]);
      formData.append('title', uploadedDocName);
      formData.append('documentType', selectedDocType);

      await agentApi.uploadAdditionalDocument(selectedRequestId, formData);
      alert(`Successfully uploaded "${uploadedDocName}"`);
      setShowUploadModal(false);
      setUploadedDocName("");
      loadDashboardData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to upload document');
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (req.citizen?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (req.serviceSnapshot?.serviceName || req.service?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const formattedStatusFilter = statusFilter.toLowerCase().replace(' ', '_');
    const matchesStatus = statusFilter === "All" || req.status === formattedStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
              Service Agent Dashboard
            </h1>
            <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
              Welcome back, Agent {user?.firstName || 'User'}. Manage your assigned verifications.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedRequestId(requests[0]?._id || "");
                setShowStatusModal(true);
              }}
              className="h-11 px-5 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[13.5px] font-bold text-white shadow-sm transition-colors flex items-center gap-1.5"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Update Status
            </button>
            <button
              onClick={() => {
                setSelectedRequestId(requests[0]?._id || "");
                setShowUploadModal(true);
              }}
              className="h-11 px-5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[13.5px] font-bold text-gray-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <svg style={{ width: '16px', height: '16px' }} className="text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Doc
            </button>
          </div>
        </div>

        {/* Statistic Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Assigned */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4.5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-[#eff6ff] text-[#13448a] flex items-center justify-center shrink-0">
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <span className="text-[12px] font-bold text-gray-400 block uppercase tracking-wider">Assigned Requests</span>
              <span className="text-[22px] font-extrabold text-gray-800 mt-0.5 block">{stats.assigned}</span>
            </div>
          </div>

          {/* Card 2: In Progress */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4.5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <span className="text-[12px] font-bold text-gray-400 block uppercase tracking-wider">In Progress</span>
              <span className="text-[22px] font-extrabold text-blue-600 mt-0.5 block">{stats.inProgress}</span>
            </div>
          </div>

          {/* Card 3: Completed */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4.5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <span className="text-[12px] font-bold text-gray-400 block uppercase tracking-wider">Completed</span>
              <span className="text-[22px] font-extrabold text-emerald-600 mt-0.5 block">{stats.completed}</span>
            </div>
          </div>

          {/* Card 4: Documents Required */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4.5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <span className="text-[12px] font-bold text-gray-400 block uppercase tracking-wider">Docs Required</span>
              <span className="text-[22px] font-extrabold text-red-550 mt-0.5 block">{stats.docsRequired}</span>
            </div>
          </div>
        </div>

        {/* Filters and Actions Row */}
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
              placeholder="Search by ID, Citizen, or Service..."
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
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Documents Required">Documents Required</option>
              <option value="Submitted">Submitted</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Assigned Requests Table Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Assigned Requests Table
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4.5">Request ID</th>
                  <th className="px-6 py-4.5">Citizen Name</th>
                  <th className="px-6 py-4.5">Service Type</th>
                  <th className="px-6 py-4.5">Date Assigned</th>
                  <th className="px-6 py-4.5">Priority</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px] font-semibold text-gray-600">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req, idx) => (
                    <tr key={req._id || idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4.5 font-bold text-[#13448a]">{req.requestNumber}</td>
                      <td className="px-6 py-4.5 text-gray-800 font-bold">{req.citizen?.firstName} {req.citizen?.lastName}</td>
                      <td className="px-6 py-4.5">{req.serviceSnapshot?.serviceName || req.service?.name}</td>
                      <td className="px-6 py-4.5 text-gray-500 font-semibold">
                        {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.priority === "urgent" 
                            ? "bg-red-50 text-red-750" 
                            : req.priority === "high" 
                              ? "bg-amber-50 text-amber-700" 
                              : "bg-blue-50 text-blue-700"
                        }`}>
                          {req.priority || 'standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
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
                        {req.status === "documents_required" && (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Docs Required
                          </span>
                        )}
                        {req.status === "submitted" && (
                          <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Submitted
                          </span>
                        )}
                        {req.status === "draft" && (
                          <span className="inline-flex items-center gap-1 text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Draft
                          </span>
                        )}
                        {req.status === "rejected" && (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Rejected
                          </span>
                        )}
                        {req.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 text-red-700 bg-red-50/50 border border-red-250 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequestId(req._id);
                            setSelectedStatus(req.status);
                            setShowStatusModal(true);
                          }}
                          className="h-8 px-2.5 rounded border border-[#e2e8f0] hover:border-[#13448a] hover:bg-[#13448a]/5 text-[11.5px] font-bold text-gray-700 hover:text-[#13448a] transition-all"
                        >
                          Update Status
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequestId(req._id);
                            setShowUploadModal(true);
                          }}
                          className="h-8 px-2.5 rounded border border-[#e2e8f0] hover:border-[#13448a] hover:bg-[#13448a]/5 text-[11.5px] font-bold text-gray-700 hover:text-[#13448a] transition-all"
                        >
                          Upload Doc
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[14px] text-gray-400 font-bold bg-white">
                      No assigned requests match your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* QUICK ACTION 1: UPDATE STATUS MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Update Request Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-[13.5px] font-semibold">
              {/* Select Request ID */}
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select Request</label>
                <select
                  value={selectedRequestId}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a]"
                >
                  {requests.map(req => (
                    <option key={req._id} value={req._id}>{req.requestNumber} - {req.citizen?.firstName} ({req.serviceSnapshot?.serviceName || req.service?.name})</option>
                  ))}
                </select>
              </div>

              {/* Select Status */}
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">New Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a]"
                >
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="documents_required">Documents Required</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Agent Note */}
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Agent Note / Remark</label>
                <textarea
                  value={agentNote}
                  onChange={(e) => setAgentNote(e.target.value)}
                  placeholder="e.g. System automated check passed, field officer assigned, or documents blur..."
                  rows="3"
                  className="w-full p-3 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                />
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
                  Apply Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ACTION 2: UPLOAD VERIFICATION DOCUMENT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Upload Verification Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <form onSubmit={handleUploadDocSubmit} className="space-y-4 text-[13.5px] font-semibold">
              {/* Select Request ID */}
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select Request ID</label>
                <select
                  value={selectedRequestId}
                  onChange={(e) => setSelectedRequestId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a]"
                >
                  {requests.map(req => (
                    <option key={req._id} value={req._id}>{req.requestNumber} - {req.citizen?.firstName}</option>
                  ))}
                </select>
              </div>

              {/* Select Document Type */}
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Document Category</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a]"
                >
                  <option value="Verification Report">Verification Report</option>
                  <option value="Physical Verification Slip">Physical Verification Slip</option>
                  <option value="Tehsil Office Dispatch Certificate">Tehsil Office Dispatch Certificate</option>
                  <option value="Official Approval Certificate">Official Approval Certificate</option>
                </select>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">File Upload</label>
                
                {uploadedDocName ? (
                  <div className="border border-emerald-100 bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-center justify-between">
                    <span className="truncate max-w-[200px] font-bold">{uploadedDocName}</span>
                    <button type="button" onClick={() => setUploadedDocName("")} className="font-extrabold text-[12.5px] text-emerald-900">✕ Clear</button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 hover:border-[#13448a] rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-gray-50/50">
                    <span className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#13448a] text-[16px] font-extrabold">+</span>
                    <span className="text-[12.5px] font-bold text-gray-700 mt-2 block">Choose File / Verification PDF</span>
                    <span className="text-[10px] font-semibold text-gray-400 block mt-0.5">PDF or scanned JPEG (Max 5MB)</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadedDocName(e.target.files[0].name);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 h-11 border border-gray-200 hover:bg-gray-50 text-[13px] font-bold text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#13448a] hover:bg-[#0c316a] text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors"
                >
                  Register Document
                </button>
              </div>
            </form>
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
