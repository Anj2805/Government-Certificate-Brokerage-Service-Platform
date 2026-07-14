import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { requestApi } from '../../api/requestApi';
import { documentApi } from '../../api/documentApi';
import { getUploadUrl } from '../../api/httpClient';
import toast from 'react-hot-toast';

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Simulated Chat state removed to prevent fabricated data

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await requestApi.getRequestDetails(id);
      setRequest(data);
    } catch (err) {
      console.error(err);
      setIsError(true);
      toast.error(err.response?.data?.message || 'Failed to load request details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRequestDetails();
    }
  }, [id]);

  const handleCancelRequest = async () => {
    try {
      await requestApi.cancelRequest(request._id, { reason: "Cancelled by citizen" });
      setShowCancelModal(false);
      toast.success('Request cancelled successfully.');
      fetchRequestDetails();
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel request. Please try again.');
    }
  };

  const handleSubmitDraft = async () => {
    try {
      setIsLoading(true);
      await requestApi.submitRequest(request._id, { reason: "Submitted by citizen" });
      toast.success('Request submitted successfully.');
      fetchRequestDetails();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (docType = 'additional_proof') => async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingDoc(true);
      try {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentType', docType);
        formData.append('title', file.name);
        formData.append('requestId', request._id);
        
        const uploadedDoc = await documentApi.uploadDocument(formData);
        
        // Attach the uploaded document to the request
        await requestApi.attachDocument(request._id, uploadedDoc._id);
        
        // Refresh request details to see the new document
        const updated = await requestApi.getRequestDetails(id);
        setRequest(updated);
        toast.success('Document uploaded and attached successfully!');
      } catch (err) {
        console.error(err);
        toast.error(`Failed to upload document: ${err.response?.data?.message || err.message}`);
      } finally {
        setUploadingDoc(false);
      }
    }
  };

  // Chat logic removed

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen text-[#111827] bg-[#f8fafc]">
        <div className="max-w-[1344px] w-full mx-auto px-6 py-20 flex-1 flex flex-col items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[14.5px] text-gray-500 font-bold">Loading application details...</p>
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
            The request you are looking for could not be found or you do not have permission to view it.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate(PATHS.CITIZEN_REQUESTS)}
              className="h-11 px-5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[13.5px] font-bold text-gray-700 transition-colors"
            >
              Back to My Requests
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

  // Dynamic progress timeline calculations
  // Dynamic progress timeline calculations
  const getTimelineStepStatus = (stepIndex) => {
    const statusOrder = ['draft', 'submitted', 'assigned', 'under_review', 'approved', 'completed'];
    
    let effectiveStatus = request.status;
    if (effectiveStatus === 'correction_required') effectiveStatus = 'under_review';
    
    const currentStatusIndex = statusOrder.indexOf(effectiveStatus);
    
    if (request.status === 'cancelled' || request.status === 'rejected') {
      // For cancelled/rejected, only show draft as blue, rest as gray
      return stepIndex === 0 ? 'completed' : 'pending';
    }
    
    if (currentStatusIndex >= stepIndex) return 'completed';
    if (currentStatusIndex + 1 === stepIndex) return 'active';
    return 'pending';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'under_review':
        return 'bg-amber-50 text-amber-700 border-amber-205';
      case 'assigned':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'submitted':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'draft':
        return 'bg-gray-50 text-gray-705 border-gray-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-red-50/50 text-red-755 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'documents_required') return 'Action Needed';
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const missingDocs = (request.serviceSnapshot?.requiredDocuments || []).filter(docType => {
    const docs = (request.documents || []).filter(d => d.documentType?.toLowerCase() === docType.toLowerCase());
    if (docs.length === 0) return true;
    const latest = docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    return latest.status === 'rejected';
  });

  // Date/Days calculations
  const estDays = request.serviceSnapshot?.estimatedProcessingDays || request.service?.estimatedProcessingDays || 7;
  const appliedDate = new Date(request.createdAt);
  const estDate = new Date(appliedDate.getTime() + estDays * 24 * 60 * 60 * 1000);
  const estDateStr = estDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const citizenDocs = (request.documents || []).filter(doc => String(doc.uploadedBy) === String(doc.ownerUser));
  const agentDocs = (request.documents || []).filter(doc => String(doc.uploadedBy) !== String(doc.ownerUser));

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Breadcrumb & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-gray-400">
              <Link to={PATHS.CITIZEN_DASHBOARD} className="hover:text-[#13448a] no-underline">Dashboard</Link>
              <span>›</span>
              <Link to={PATHS.CITIZEN_REQUESTS} className="hover:text-[#13448a] no-underline">My Requests</Link>
              <span>›</span>
              <span className="text-gray-500">Request #{request.requestNumber}</span>
            </div>
            
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
                Request Details
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border uppercase ${getStatusBadgeClass(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
            </div>
            <p className="text-[13.5px] text-gray-400 font-bold mt-0.5">Request ID: {request.requestNumber}</p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {request.status === 'draft' && (
              <button
                type="button"
                onClick={handleSubmitDraft}
                className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-bold text-white transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                Submit Application
              </button>
            )}

            {['draft', 'submitted', 'assigned', 'under_review', 'correction_required'].includes(request.status) && (
              <label className={`h-10 px-4 rounded-lg border border-[#e2e8f0] bg-white hover:bg-gray-50 text-[13px] font-bold text-gray-700 transition-colors flex items-center gap-2 cursor-pointer shadow-sm ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                <svg style={{ width: '16px', height: '16px' }} className="text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                {uploadingDoc ? "Uploading..." : "Add Documents"}
                <input type="file" className="hidden" onChange={handleFileUpload('additional_proof')} disabled={uploadingDoc} />
              </label>
            )}

            {['draft', 'submitted'].includes(request.status) && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-[13px] font-bold text-white transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Cancel Request
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Progress Timeline bar */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
          <div className="flex items-center justify-between relative max-w-[900px] mx-auto py-4">
            
            {/* Timeline background line */}
            <div className="absolute left-0 right-0 top-1/2 h-[3px] bg-gray-100 -translate-y-1/2 z-0"></div>
            
            {/* Timeline active line */}
            <div className="absolute left-0 top-1/2 h-[3px] bg-[#13448a] -translate-y-1/2 z-0 transition-all duration-500" style={{
              width: request.status === "cancelled" || request.status === "rejected" ? "0%" :
                     request.status === "draft" ? "0%" :
                     request.status === "submitted" ? "20%" :
                     request.status === "assigned" ? "40%" :
                     request.status === "under_review" || request.status === "correction_required" ? "60%" :
                     request.status === "approved" ? "80%" : "100%"
            }}></div>

            {/* Step 1: Draft */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className="rounded-full bg-[#13448a] text-white flex items-center justify-center border-2 border-[#13448a]">
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                </svg>
              </div>
              <span className="text-[11px] font-extrabold text-[#13448a] mt-2 tracking-wider uppercase">Draft</span>
            </div>

            {/* Step 2: Submitted */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 ${
                getTimelineStepStatus(1) === 'completed' || getTimelineStepStatus(1) === 'active' ? "bg-[#13448a] border-[#13448a] text-white" : "border-gray-200 bg-white text-gray-400"
              }`}>
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${getTimelineStepStatus(1) !== 'pending' ? 'text-[#13448a]' : 'text-gray-400'}`}>Submitted</span>
            </div>

            {/* Step 3: Assigned */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 ${
                getTimelineStepStatus(2) === 'completed' || getTimelineStepStatus(2) === 'active' ? "bg-[#13448a] border-[#13448a] text-white" : "border-gray-200 bg-white text-gray-400"
              }`}>
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${getTimelineStepStatus(2) !== 'pending' ? 'text-[#13448a]' : 'text-gray-400'}`}>Assigned</span>
            </div>

            {/* Step 4: In Progress */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 ${
                getTimelineStepStatus(3) === 'completed' || getTimelineStepStatus(3) === 'active' ? "bg-[#13448a] border-[#13448a] text-white" : "border-gray-200 bg-white text-gray-400"
              }`}>
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${getTimelineStepStatus(3) !== 'pending' ? 'text-[#13448a]' : 'text-gray-400'}`}>Under Review</span>
            </div>

            {/* Step 5: Approved */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 ${
                getTimelineStepStatus(4) === 'completed' || getTimelineStepStatus(4) === 'active' ? "bg-[#13448a] border-[#13448a] text-white" : "border-gray-200 bg-white text-gray-400"
              }`}>
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <polyline points="9 15 11 17 15 12" />
                </svg>
              </div>
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${getTimelineStepStatus(4) !== 'pending' ? 'text-[#13448a]' : 'text-gray-400'}`}>Approved</span>
            </div>

            {/* Step 6: Completed */}
            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 text-[14px] font-extrabold ${
                request.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200 bg-white text-gray-400"
              }`}>
                {request.status === 'completed' ? "✓" : "6"}
              </div>
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${request.status === 'completed' ? 'text-emerald-600' : 'text-gray-400'}`}>Completed</span>
            </div>

          </div>
        </div>

        {/* 3-Column Layout: Left (Main details), Right (Sidebar widgets) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Content (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {request.status === 'rejected' && (
              <div className="bg-red-50 rounded-2xl border border-red-200 shadow-sm p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <svg style={{ width: '24px', height: '24px' }} className="text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[18px] font-extrabold text-red-800">Application Rejected</h2>
                    <p className="text-[14.5px] font-medium text-red-700 mt-1.5 mb-2 leading-relaxed">
                      Your application has been rejected by the assigned agent. Please review the agent's reason below.
                    </p>
                    <div className="bg-white/60 p-4 rounded-xl border border-red-100">
                      <span className="text-[11px] font-extrabold text-red-400 uppercase tracking-wider block mb-1">Agent's Reason</span>
                      <p className="text-[14px] font-bold text-red-900 leading-relaxed">
                        {request.statusHistory?.find(h => h.toStatus === 'rejected')?.reason || 'No specific reason provided.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Information block */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-6">
              <h2 className="text-[17px] font-extrabold text-[#0f294a] pb-4.5 border-b border-gray-100 flex items-center gap-2">
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
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
                    {appliedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • {appliedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Estimated Completion</span>
                  <span className="text-[14.5px] font-extrabold text-[#13448a] mt-1 block">
                    {estDateStr} ({estDays} Days)
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

              {request.notes && (
                <div className="pt-5 border-t border-gray-100">
                  <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Citizen Notes / Remarks</span>
                  <p className="text-[13.5px] text-gray-650 font-semibold mt-2 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                    {request.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Details Block */}
            {request.paymentStatus !== "NOT_REQUIRED" && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-6">
                <h2 className="text-[17px] font-extrabold text-[#0f294a] pb-4.5 border-b border-gray-100 flex items-center gap-2">
                  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                  </svg>
                  Payment Information
                </h2>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Payment Status</span>
                    <span className="mt-1 block">
                      {request.paymentStatus === 'COD_DUE' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">COD Due</span>
                      )}
                      {request.paymentStatus === 'PAID' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Paid</span>
                      )}
                      {request.paymentStatus === 'WAIVED' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-gray-50 text-gray-700 border border-gray-200">Waived</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Method</span>
                    <span className="text-[14.5px] font-extrabold text-gray-800 mt-1 block">
                      {request.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : request.paymentMethod}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Amount</span>
                    <span className="text-[14.5px] font-extrabold text-gray-800 mt-1 block">
                      ₹ {request.serviceSnapshot?.serviceCharge || 0}
                    </span>
                  </div>
                </div>

                {request.paymentStatus === 'COD_DUE' && (
                  <div className="flex gap-2.5 rounded-xl bg-amber-50 p-4 border border-amber-200 text-[12.5px] font-semibold text-amber-800 leading-normal mt-2">
                    <svg style={{ width: '18px', height: '18px' }} className="text-amber-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    Payment of ₹{request.serviceSnapshot?.serviceCharge || 0} will be collected at the time of secure delivery. No online payment is required.
                  </div>
                )}
              </div>
            )}
            
            {/* Delivery Address Block */}
            {request.deliveryAddress && request.deliveryAddress.houseNumber && (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between pb-4.5 border-b border-gray-100">
                  <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
                    <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    Delivery Information
                  </h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider ${
                    request.deliveryStatus === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' :
                    request.deliveryStatus === 'DISPATCHED' || request.deliveryStatus === 'OUT_FOR_DELIVERY' ? 'bg-blue-50 text-blue-700' :
                    request.deliveryStatus === 'READY_FOR_DISPATCH' ? 'bg-amber-50 text-amber-700' :
                    request.deliveryStatus === 'FAILED' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {request.deliveryStatus ? request.deliveryStatus.replace(/_/g, ' ') : 'Pending'}
                  </span>
                </div>

                {request.deliveryStatus && request.deliveryStatus !== 'PENDING' && (
                  <div className="mb-6 pt-2 pb-2">
                    <div className="flex items-center justify-between relative max-w-[400px] mx-auto">
                      <div className="absolute left-0 right-0 top-1/2 h-[3px] bg-gray-100 -translate-y-1/2 z-0"></div>
                      <div className="absolute left-0 top-1/2 h-[3px] bg-blue-500 -translate-y-1/2 z-0 transition-all duration-500" style={{
                        width: request.deliveryStatus === "READY_FOR_DISPATCH" ? "0%" :
                               request.deliveryStatus === "DISPATCHED" ? "50%" :
                               request.deliveryStatus === "OUT_FOR_DELIVERY" ? "50%" :
                               request.deliveryStatus === "DELIVERED" ? "100%" : "0%"
                      }}></div>

                      <div className="flex flex-col items-center z-10 bg-white px-2">
                        <div style={{ width: '24px', height: '24px' }} className={`rounded-full flex items-center justify-center border-2 ${
                          ['READY_FOR_DISPATCH', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(request.deliveryStatus) ? "bg-blue-500 border-blue-500 text-white" : "border-gray-200 bg-white"
                        }`}>
                          {['READY_FOR_DISPATCH', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(request.deliveryStatus) && (
                            <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </div>
                        <span className="text-[10px] font-extrabold text-blue-600 mt-2 tracking-wider uppercase text-center">Ready</span>
                      </div>

                      <div className="flex flex-col items-center z-10 bg-white px-2">
                        <div style={{ width: '24px', height: '24px' }} className={`rounded-full flex items-center justify-center border-2 ${
                          ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(request.deliveryStatus) ? "bg-blue-500 border-blue-500 text-white" : "border-gray-200 bg-white"
                        }`}>
                           {['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(request.deliveryStatus) && (
                            <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </div>
                        <span className={`text-[10px] font-extrabold mt-2 tracking-wider uppercase text-center ${['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(request.deliveryStatus) ? 'text-blue-600' : 'text-gray-400'}`}>Dispatched</span>
                      </div>

                      <div className="flex flex-col items-center z-10 bg-white px-2">
                        <div style={{ width: '24px', height: '24px' }} className={`rounded-full flex items-center justify-center border-2 ${
                          request.deliveryStatus === 'DELIVERED' ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-200 bg-white"
                        }`}>
                           {request.deliveryStatus === 'DELIVERED' && (
                            <svg style={{ width: '12px', height: '12px' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
                          )}
                        </div>
                        <span className={`text-[10px] font-extrabold mt-2 tracking-wider uppercase text-center ${request.deliveryStatus === 'DELIVERED' ? 'text-emerald-600' : 'text-gray-400'}`}>Delivered</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Recipient</span>
                    <span className="text-[14.5px] font-extrabold text-gray-800 mt-1 block">
                      {request.deliveryAddress.recipientName} ({request.deliveryAddress.mobileNumber})
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[11.5px] font-bold text-gray-400 uppercase tracking-wider block">Delivery Address</span>
                    <span className="text-[14.5px] font-semibold text-gray-700 mt-1 block leading-relaxed">
                      {request.deliveryAddress.houseNumber}, {request.deliveryAddress.street}
                      <br/>
                      {request.deliveryAddress.landmark && <>{request.deliveryAddress.landmark}<br/></>}
                      {request.deliveryAddress.village}, {request.deliveryAddress.district}
                      <br/>
                      {request.deliveryAddress.state} - {request.deliveryAddress.pinCode}
                    </span>
                  </div>
                  {request.trackingId && (
                    <div className="sm:col-span-2 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <span className="text-[11.5px] font-bold text-blue-600 uppercase tracking-wider block">Tracking ID</span>
                        <span className="text-[16px] font-extrabold text-blue-900 mt-1 block tracking-wider">
                          {request.trackingId}
                        </span>
                      </div>
                      <svg style={{ width: '28px', height: '28px' }} className="text-blue-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="1" y="3" width="15" height="13"></rect>
                        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                        <circle cx="5.5" cy="18.5" r="2.5"></circle>
                        <circle cx="18.5" cy="18.5" r="2.5"></circle>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Action Required: Correction Upload Block */}
            {missingDocs.length > 0 && (
              <div className="bg-red-50 rounded-2xl border border-red-200 shadow-sm p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <svg style={{ width: '24px', height: '24px' }} className="text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[18px] font-extrabold text-red-800">Action Required: Re-upload Documents</h2>
                    <p className="text-[14px] font-medium text-red-700 mt-1 mb-4">
                      The agent has requested corrections to your documents. Please review their notes in the tracking timeline and re-upload the required document below.
                    </p>
                    
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {missingDocs.map((docType) => (
                        <label key={docType} className={`border border-red-300 hover:border-red-500 bg-white rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                          <span className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-2">
                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                          </span>
                          <span className="text-[13px] font-extrabold text-gray-800 block">
                            {docType.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-[11px] font-bold text-gray-500 mt-1">Click to Upload</span>
                          <input type="file" className="hidden" onChange={handleFileUpload(docType)} disabled={uploadingDoc} />
                        </label>
                      ))}
                      <label className={`border border-red-300 hover:border-red-500 bg-white rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${uploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-2">
                          +
                        </span>
                        <span className="text-[13px] font-extrabold text-gray-800 block">
                          OTHER PROOF
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 mt-1">Click to Upload</span>
                        <input type="file" className="hidden" onChange={handleFileUpload('additional_proof')} disabled={uploadingDoc} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document Gallery Block */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-6">
              <div className="pb-4.5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
                  <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  My Uploaded Documents
                </h2>
                <span className="text-[12px] font-bold text-gray-400">{citizenDocs.length} Documents</span>
              </div>

              {/* Grid layout for files */}
              <div className="grid gap-4 sm:grid-cols-2">
                {citizenDocs.map((doc, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-blue-600 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-blue-700 border border-slate-100 shrink-0">
                        <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        </svg>
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <span className="text-sm font-bold text-gray-900 block truncate" title={doc.originalName}>{doc.originalName}</span>
                        <span className="text-[11px] text-gray-400 font-bold block truncate tracking-wide">
                          {doc.documentType?.replace('_', ' ').toUpperCase() || "Proof"} • {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        doc.status === "verified" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : doc.status === "rejected"
                            ? "bg-red-50 text-red-700 border border-red-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {doc.status}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await documentApi.downloadDocument(doc._id);
                            window.open(res.data.data.url, '_blank');
                          } catch (err) {
                            if (err.response?.status === 404) {
                              toast.error("Document file not found on server. Please re-upload it.");
                            } else {
                              toast.error("Failed to load document");
                            }
                          }
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                      >
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Document upload box card */}
                {['draft', 'submitted', 'assigned', 'under_review', 'correction_required'].includes(request.status) && (
                  <label className={`border-2 border-dashed border-gray-200 hover:border-[#13448a] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[72px] ${uploadingDoc ? 'opacity-55 pointer-events-none' : ''}`}>
                    <span className="h-7 w-7 rounded-full bg-gray-50 flex items-center justify-center text-[#13448a] border border-gray-100">
                      +
                    </span>
                    <span className="text-[12.5px] font-bold text-gray-700 mt-1 block">
                      {uploadingDoc ? "Uploading..." : "Add New Document"}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 block">PDF, PNG, JPG (Max 5MB)</span>
                    <input type="file" className="hidden" onChange={handleFileUpload('additional_proof')} disabled={uploadingDoc} />
                  </label>
                )}
              </div>

              {agentDocs.length > 0 && (
                <div className="mt-8">
                  <div className="pb-4.5 border-b border-gray-100 flex items-center justify-between mb-4">
                    <h2 className="text-[17px] font-extrabold text-[#13448a] flex items-center gap-2">
                      <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M12 11v6" />
                        <path d="M9 14h6" />
                      </svg>
                      Agent Uploaded Documents
                    </h2>
                    <span className="text-[12px] font-bold text-gray-400">{agentDocs.length} Documents</span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {agentDocs.map((doc, idx) => (
                      <div key={`agent-${idx}`} className="border border-blue-100 bg-blue-50/30 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 border border-blue-200 shrink-0">
                            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <circle cx="12" cy="14" r="3" />
                            </svg>
                          </div>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <span className="text-sm font-bold text-gray-900 block truncate" title={doc.title || doc.originalName}>{doc.title || doc.originalName}</span>
                            <span className="text-[11px] text-blue-600 font-bold block truncate tracking-wide">
                              {doc.documentType?.replace('_', ' ').toUpperCase() || "DOCUMENT"} • {new Date(doc.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await documentApi.downloadDocument(doc._id);
                                window.open(res.data.data.url, '_blank');
                              } catch (err) {
                                if (err.response?.status === 404) {
                                  toast.error("Document file not found on server.");
                                } else {
                                  toast.error("Failed to load document");
                                }
                              }
                            }}
                            className="h-8 w-8 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors"
                          >
                            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {request.status === 'documents_required' && (
                <div className="flex gap-2.5 rounded-xl bg-red-50/55 p-4 border border-red-100 text-[12.5px] font-semibold text-red-800 leading-normal">
                  <svg style={{ width: '18px', height: '18px' }} className="text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  The assigned agent has requested updated or additional documents. Please check your messages and upload the missing items above.
                </div>
              )}

            </div>

          </div>

          {/* Sidebar Columns (1 col) */}
          <div className="space-y-6">
            
            {/* Assigned Agent Card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm text-center">
              <span className="text-[11.5px] font-bold text-gray-455 uppercase tracking-wider block text-left pb-4 border-b border-gray-50">Assigned Agent</span>

              <div className="mt-5 space-y-4">
                {request.assignedAgent ? (
                  <>
                    <div className="relative inline-block">
                      {request.assignedAgent.avatar ? (
                        <img
                          src={request.assignedAgent.avatar}
                          alt={request.assignedAgent.fullName || "Agent"}
                          className="h-16 w-16 rounded-full object-cover border border-gray-150 mx-auto"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-[#eff6ff] text-[#13448a] flex items-center justify-center text-[20px] font-extrabold border border-blue-100 mx-auto">
                          {(request.assignedAgent.firstName || "A").charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                    </div>

                    <div>
                      <h3 className="text-[16px] font-extrabold text-gray-800">
                        {request.assignedAgent.firstName} {request.assignedAgent.lastName}
                      </h3>
                      <span className="text-[12px] font-bold text-gray-400 block mt-0.5">Assigned Agent</span>
                    </div>

                    <div className="text-[12.5px] font-semibold text-gray-550 border-t border-b border-gray-50 py-3 space-y-2 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Agent Email</span>
                        <span className="text-gray-800 font-bold">{request.assignedAgent.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => alert("Messaging is currently unavailable. Please contact support.")}
                        className="h-11 w-full bg-gray-200 text-[13px] font-bold text-gray-500 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        Message Agent (Coming Soon)
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-6 text-gray-400">
                    <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 mx-auto text-gray-300">
                      ?
                    </div>
                    <p className="text-[13px] font-bold mt-3">Agent Assignment Pending</p>
                    <p className="text-[11px] font-semibold text-gray-450 mt-1 leading-normal">
                      An agent will be assigned shortly to begin processing your documents.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible Chat Widget Removed */}

            {/* Status History Card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-6">
              <h2 className="text-[15px] font-extrabold text-[#0f294a] pb-4 border-b border-gray-55 flex items-center gap-2">
                <svg style={{ width: '16px', height: '16px' }} className="text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Status History
              </h2>

              <div className="relative pl-5 border-l-2 border-gray-100 space-y-6 ml-2 text-[12.5px] font-semibold text-gray-500">
                {request.statusHistory && request.statusHistory.length > 0 ? (
                  [...request.statusHistory].reverse().map((hist, idx) => (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full ${idx === 0 ? 'bg-blue-600 ring-4 ring-blue-50' : 'bg-gray-200'}`}></span>
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

              <div className="pt-2 text-center">
                <Link to={PATHS.CITIZEN_REQUEST_TRACK.replace(":id", request._id)} className="text-[13px] font-extrabold text-[#13448a] hover:underline">
                  View Detailed Tracking Timeline
                </Link>
              </div>
            </div>

            {/* Need Help Card Widget */}
            <div className="bg-[#eff6ff]/35 rounded-2xl border border-[#dbeafe] p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-[#eff6ff] text-[#1e40af] border border-[#bfdbfe] flex items-center justify-center shrink-0">
                  <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <h3 className="text-[14px] font-extrabold text-[#0f294a]">Need Help?</h3>
              </div>
              <p className="text-[12.5px] text-gray-500 font-semibold leading-relaxed">
                Support ticketing is planned for a later phase. Use this request page to upload documents and review status history.
              </p>
              <span className="block text-[13.5px] font-extrabold text-gray-400">
                Support module coming soon
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* Cancel Request Confirmation Dialog Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center border-2 border-red-200">
              <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-[17px] font-extrabold text-gray-900">Cancel Application</h3>
              <p className="text-[13px] text-gray-500 font-semibold leading-relaxed">
                Are you sure you want to cancel service request #{request.requestNumber}? This action cannot be undone and any application fees paid may not be refundable.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 h-11 border border-gray-200 hover:bg-gray-50 text-[13px] font-bold text-gray-700 rounded-lg transition-colors"
              >
                No, Keep Active
              </button>
              <button
                type="button"
                onClick={handleCancelRequest}
                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors"
              >
                Yes, Cancel Request
              </button>
            </div>
          </div>
        </div>
      )}

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
