import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { agentApi } from '../../api/agentApi';
import { getUploadUrl } from '../../api/httpClient';

export default function AgentRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Modal controls
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form selections
  const [selectedStatus, setSelectedStatus] = useState("");
  const [agentNote, setAgentNote] = useState("");
  const [uploadedDocName, setUploadedDocName] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("Verification Report");

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await agentApi.getRequestDetails(id);
      setRequest(data);
      setSelectedStatus(data.status);
    } catch (err) {
      console.error(err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id]);

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      await agentApi.updateProgress(id, {
        status: selectedStatus,
        reason: agentNote
      });
      alert(`Successfully updated request status.`);
      setShowStatusModal(false);
      setAgentNote("");
      fetchRequestDetails();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleUploadDocSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedDocName) {
      alert("Please choose a verification document file and enter a title.");
      return;
    }

    try {
      setUploadingDoc(true);
      const fileInput = e.target.querySelector('input[type="file"]');
      const formData = new FormData();
      formData.append('document', fileInput.files[0]);
      formData.append('title', uploadedDocName);
      formData.append('documentType', selectedDocType);

      await agentApi.uploadAdditionalDocument(id, formData);
      alert(`Successfully uploaded "${uploadedDocName}"`);
      setShowUploadModal(false);
      setUploadedDocName("");
      fetchRequestDetails();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen text-[#111827] bg-[#f8fafc]">
        <div className="max-w-[1344px] w-full mx-auto px-6 py-20 flex-1 flex flex-col items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[14.5px] text-gray-500 font-bold">Loading request details...</p>
        </div>
      </div>
    );
  }

  if (isError || !request) {
    return (
      <div className="flex flex-col min-h-screen text-[#111827] bg-[#f8fafc]">
        <div className="max-w-[600px] w-full mx-auto px-6 py-20 flex-1 text-center">
          <div className="h-16 w-16 mx-auto rounded-full bg-red-50 text-red-550 flex items-center justify-center border-2 border-red-200">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-[22px] font-extrabold text-gray-900 mt-6">Failed to Load Request Details</h1>
          <p className="text-[14px] text-gray-500 font-semibold mt-2">
            The request could not be found or you do not have permission to view it.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate(PATHS.AGENT_DASHBOARD)}
              className="h-11 px-5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[13.5px] font-bold text-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={fetchRequestDetails}
              className="h-11 px-5 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[13.5px] font-bold text-white shadow-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getTimelineStepStatus = (stepIndex) => {
    const statusOrder = ['draft', 'submitted', 'assigned', 'in_progress', 'completed'];
    const currentStatusIndex = statusOrder.indexOf(request.status);
    
    if (request.status === 'cancelled' || request.status === 'rejected') {
      return stepIndex === 0 ? 'completed' : 'pending';
    }
    
    if (currentStatusIndex >= stepIndex) return 'completed';
    if (currentStatusIndex + 1 === stepIndex) return 'active';
    return 'pending';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress': return 'bg-amber-50 text-amber-700 border-amber-205';
      case 'assigned': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'submitted': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'draft': return 'bg-gray-50 text-gray-705 border-gray-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelled': return 'bg-red-50/50 text-red-755 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'documents_required') return 'Docs Required';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const estDays = request.serviceSnapshot?.estimatedProcessingDays || request.service?.estimatedProcessingDays || 7;
  const appliedDate = new Date(request.createdAt);
  const estDate = new Date(appliedDate.getTime() + estDays * 24 * 60 * 60 * 1000);

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Breadcrumb & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-gray-400">
              <Link to={PATHS.AGENT_DASHBOARD} className="hover:text-[#13448a] no-underline">Dashboard</Link>
              <span>›</span>
              <span className="text-gray-500">Request #{request.requestNumber}</span>
            </div>
            
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
                Assigned Request Details
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border uppercase ${getStatusBadgeClass(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
            </div>
            <p className="text-[13.5px] text-gray-400 font-bold mt-0.5">Request ID: {request.requestNumber}</p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStatusModal(true)}
              className="h-10 px-4 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[13px] font-bold text-white transition-colors flex items-center gap-2 shadow-sm"
            >
              Update Status
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[13px] font-bold text-gray-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              Add Document
            </button>
          </div>
        </div>

        {/* Dynamic Progress Timeline bar */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
          <div className="flex items-center justify-between relative max-w-[900px] mx-auto py-4">
            <div className="absolute left-0 right-0 top-1/2 h-[3px] bg-gray-100 -translate-y-1/2 z-0"></div>
            <div className="absolute left-0 top-1/2 h-[3px] bg-[#13448a] -translate-y-1/2 z-0 transition-all duration-500" style={{
              width: request.status === "cancelled" || request.status === "rejected" ? "0%" :
                     request.status === "draft" ? "0%" :
                     request.status === "submitted" ? "25%" :
                     request.status === "assigned" ? "50%" :
                     request.status === "in_progress" ? "75%" : "100%"
            }}></div>

            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className="rounded-full bg-[#13448a] text-white flex items-center justify-center border-2 border-[#13448a]">
                <span className="text-[14px] font-bold">1</span>
              </div>
              <span className="text-[11px] font-extrabold text-[#13448a] mt-2 tracking-wider uppercase">Draft</span>
            </div>

            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 ${
                getTimelineStepStatus(1) === 'completed' || getTimelineStepStatus(1) === 'active' ? "bg-[#13448a] border-[#13448a] text-white" : "border-gray-200 bg-white text-gray-400"
              }`}>
                <span className="text-[14px] font-bold">2</span>
              </div>
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${getTimelineStepStatus(1) !== 'pending' ? 'text-[#13448a]' : 'text-gray-400'}`}>Submitted</span>
            </div>

            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 ${
                getTimelineStepStatus(2) === 'completed' || getTimelineStepStatus(2) === 'active' ? "bg-[#13448a] border-[#13448a] text-white" : "border-gray-200 bg-white text-gray-400"
              }`}>
                <span className="text-[14px] font-bold">3</span>
              </div>
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${getTimelineStepStatus(2) !== 'pending' ? 'text-[#13448a]' : 'text-gray-400'}`}>Assigned</span>
            </div>

            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 ${
                getTimelineStepStatus(3) === 'completed' || getTimelineStepStatus(3) === 'active' ? "bg-[#13448a] border-[#13448a] text-white" : "border-gray-200 bg-white text-gray-400"
              }`}>
                <span className="text-[14px] font-bold">4</span>
              </div>
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${getTimelineStepStatus(3) !== 'pending' ? 'text-[#13448a]' : 'text-gray-400'}`}>In Progress</span>
            </div>

            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 text-[14px] font-extrabold ${
                request.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200 bg-white text-gray-400"
              }`}>
                {request.status === 'completed' ? "✓" : "5"}
              </div>
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${request.status === 'completed' ? 'text-emerald-600' : 'text-gray-400'}`}>Completed</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-6">
              <h2 className="text-[17px] font-extrabold text-[#0f294a] pb-4.5 border-b border-gray-100 flex items-center gap-2">
                Service Information
              </h2>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Service Type</span>
                  <span className="text-[14.5px] font-extrabold text-gray-800 mt-1 block">
                    {request.serviceSnapshot?.serviceName || request.service?.name}
                  </span>
                </div>
                <div>
                  <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Applied Date</span>
                  <span className="text-[14.5px] font-extrabold text-gray-800 mt-1 block">
                    {appliedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Estimated Completion</span>
                  <span className="text-[14.5px] font-extrabold text-[#13448a] mt-1 block">
                    {estDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} ({estDays} Days)
                  </span>
                </div>
                <div>
                  <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Application Fee</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[14.5px] font-extrabold text-gray-800">
                      ₹ {request.serviceSnapshot?.serviceCharge || request.service?.serviceCharge || 0}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Paid</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-6">
              <div className="pb-4.5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
                  Document Gallery
                </h2>
                <span className="text-[12px] font-bold text-gray-400">{(request.documents || []).length} Documents Uploaded</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(request.documents || []).map((doc, idx) => (
                  <div key={idx} className="border border-[#e2e8f0] rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-[#13448a] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center text-[#13448a] border border-gray-100 shrink-0">
                        📄
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[13px] font-bold text-gray-800 block truncate max-w-[150px]" title={doc.originalName}>{doc.originalName}</span>
                        <span className="text-[11px] text-gray-400 font-bold block">
                          {doc.documentType?.replace('_', ' ').toUpperCase() || "Proof"} • {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={doc.fileUrl || getUploadUrl(doc.filename)}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 w-8 rounded-lg hover:bg-gray-50 text-[#13448a] flex items-center justify-center font-bold"
                      >
                        DL
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
              <h3 className="text-[12px] font-extrabold text-[#0f294a] uppercase tracking-wider pb-3 border-b border-gray-50">Citizen Information</h3>
              
              <div className="text-[13px] font-semibold text-gray-650 space-y-3 mt-4">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Full Name</span>
                  <span className="text-gray-800 font-bold block mt-0.5">{request.citizen?.firstName} {request.citizen?.lastName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Email Address</span>
                  <span className="text-gray-850 font-bold block mt-0.5">{request.citizen?.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Phone Number</span>
                  <span className="text-gray-850 font-bold block mt-0.5">{request.citizen?.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-6">
              <h2 className="text-[15px] font-extrabold text-[#0f294a] pb-4 border-b border-gray-55 flex items-center gap-2">
                Status History
              </h2>

              <div className="relative pl-5 border-l-2 border-gray-100 space-y-6 ml-2 text-[12.5px] font-semibold text-gray-500">
                {request.statusHistory && request.statusHistory.length > 0 ? (
                  [...request.statusHistory].reverse().map((hist, idx) => (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full ${idx === 0 ? 'bg-[#13448a] ring-4 ring-blue-50' : 'bg-gray-200'}`}></span>
                      <h4 className={`text-[13px] ${idx === 0 ? 'font-extrabold text-[#13448a]' : 'font-bold text-gray-800'}`}>
                        {getStatusLabel(hist.toStatus)}
                      </h4>
                      {hist.reason && <p className="mt-1 leading-relaxed text-gray-550">{hist.reason}</p>}
                      <span className="text-[9.5px] font-bold text-gray-400 block mt-1.5 uppercase">
                        {new Date(hist.changedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-450 italic">No history available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Update Request Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>
            
            <form onSubmit={handleUpdateStatusSubmit} className="space-y-4 text-[13.5px] font-semibold">
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

              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Agent Notes / Remarks</label>
                <textarea
                  value={agentNote}
                  onChange={(e) => setAgentNote(e.target.value)}
                  placeholder="Reason or notes..."
                  className="w-full p-3 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                  rows="3"
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
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Upload Agent Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>
            
            <form onSubmit={handleUploadDocSubmit} className="space-y-4 text-[13.5px] font-semibold">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Document File</label>
                <input
                  type="file"
                  required
                  className="w-full h-11 px-3.5 py-2 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Document Title</label>
                <input
                  type="text"
                  required
                  value={uploadedDocName}
                  onChange={(e) => setUploadedDocName(e.target.value)}
                  placeholder="e.g. Field Verification Report"
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Document Type</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] outline-none"
                >
                  <option value="Verification Report">Verification Report</option>
                  <option value="Agent Notes">Agent Notes</option>
                  <option value="Additional Proof">Additional Proof</option>
                </select>
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
                  disabled={uploadingDoc}
                  className={`flex-1 h-11 bg-[#13448a] hover:bg-[#0c316a] text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors ${uploadingDoc ? 'opacity-50' : ''}`}
                >
                  {uploadingDoc ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
