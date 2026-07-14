import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { agentApi } from '../../api/agentApi';
import { requestApi } from '../../api/requestApi';
import { getUploadUrl } from '../../api/httpClient';
import toast from 'react-hot-toast';

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVerifyDeliveryModal, setShowVerifyDeliveryModal] = useState(false);

  // Form selections
  const [selectedStatus, setSelectedStatus] = useState("");
  const [verificationResult, setVerificationResult] = useState("PASSED");
  const [codCollected, setCodCollected] = useState(false);
  const [agentNote, setAgentNote] = useState("");
  const [uploadedDocName, setUploadedDocName] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("Verification Report");
  const [paymentReference, setPaymentReference] = useState("");

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await agentApi.getRequestDetails(id);
      setRequest(data);
      setSelectedStatus(data.status);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'An error occurred');
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
      toast.success('Successfully updated request status.');
      setShowStatusModal(false);
      setAgentNote("");
      fetchRequestDetails();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleUploadDocSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedDocName) {
      toast.error("Please choose a verification document file and enter a title.");
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
      toast.success(`Successfully uploaded "${uploadedDocName}"`);
      setShowUploadModal(false);
      setUploadedDocName("");
      fetchRequestDetails();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentReference.trim()) {
      toast.error('Please enter a payment reference number.');
      return;
    }
    try {
      await requestApi.recordPayment(id, {
        paymentReference,
        notes: agentNote
      });
      toast.success('Offline payment recorded successfully.');
      setShowPaymentModal(false);
      setPaymentReference("");
      setAgentNote("");
      fetchRequestDetails();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDispatchDelivery = async () => {
    try {
      await agentApi.dispatchDelivery(id);
      toast.success('Request dispatched for delivery.');
      fetchRequestDetails();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to dispatch delivery');
    }
  };

  const handleVerifyDeliverySubmit = async (e) => {
    e.preventDefault();
    if (verificationResult === 'PASSED' && request.paymentStatus === 'COD_DUE' && !codCollected) {
      toast.error('You must collect Cash on Delivery before completing the delivery.');
      return;
    }
    
    try {
      await agentApi.verifyDelivery(id, {
        verificationResult,
        codCollected: verificationResult === 'PASSED' ? codCollected : false
      });
      toast.success('Delivery verification completed.');
      setShowVerifyDeliveryModal(false);
      fetchRequestDetails();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to verify delivery');
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
    const statusOrder = ['draft', 'submitted', 'assigned', 'under_review', 'approved', 'completed'];
    
    let effectiveStatus = request.status;
    if (effectiveStatus === 'correction_required') effectiveStatus = 'under_review';
    
    const currentStatusIndex = statusOrder.indexOf(effectiveStatus);
    
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
      case 'under_review': return 'bg-amber-50 text-amber-700 border-amber-205';
      case 'assigned': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'submitted': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'draft': return 'bg-gray-50 text-gray-705 border-gray-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      case 'cancelled': return 'bg-red-50/50 text-red-755 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    if (status === 'correction_required') return 'Correction Required';
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
            {request.deliveryStatus === 'READY_FOR_DISPATCH' && (
              <button
                onClick={handleDispatchDelivery}
                className="h-10 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[13px] font-bold text-white transition-colors flex items-center gap-2 shadow-sm"
              >
                Dispatch Delivery
              </button>
            )}
            {(request.deliveryStatus === 'DISPATCHED' || request.deliveryStatus === 'OUT_FOR_DELIVERY') && (
              <button
                onClick={() => setShowVerifyDeliveryModal(true)}
                className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-bold text-white transition-colors flex items-center gap-2 shadow-sm"
              >
                Verify & Deliver
              </button>
            )}
            {request.paymentStatus === 'DUE' && request.paymentMethod !== 'CASH_ON_DELIVERY' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-bold text-white transition-colors flex items-center gap-2 shadow-sm"
              >
                Record Payment
              </button>
            )}
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
                     request.status === "submitted" ? "20%" :
                     request.status === "assigned" ? "40%" :
                     request.status === "under_review" || request.status === "correction_required" ? "60%" :
                     request.status === "approved" ? "80%" : "100%"
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
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${getTimelineStepStatus(3) !== 'pending' ? 'text-[#13448a]' : 'text-gray-400'}`}>Under Review</span>
            </div>

            <div className="flex flex-col items-center z-10 bg-white px-2">
              <div style={{ width: '36px', height: '36px' }} className={`rounded-full flex items-center justify-center border-2 ${
                getTimelineStepStatus(4) === 'completed' || getTimelineStepStatus(4) === 'active' ? "bg-[#13448a] border-[#13448a] text-white" : "border-gray-200 bg-white text-gray-400"
              }`}>
                <span className="text-[14px] font-bold">5</span>
              </div>
              <span className={`text-[11px] font-extrabold mt-2 tracking-wider uppercase ${getTimelineStepStatus(4) !== 'pending' ? 'text-[#13448a]' : 'text-gray-400'}`}>Approved</span>
            </div>

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

                {request.deliveryStatus && request.deliveryStatus !== 'PENDING' && request.deliveryStatus !== 'NOT_REQUIRED' && (
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
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pending Documents Review Block */}
            {(request.documents || []).filter(d => d.status === 'pending').length > 0 && (
              <div className="bg-amber-50 rounded-2xl border border-amber-200 shadow-sm p-6 space-y-6">
                <div className="pb-4.5 border-b border-amber-200/50 flex items-center justify-between">
                  <h2 className="text-[17px] font-extrabold text-amber-900 flex items-center gap-2">
                    Action Required: Review Re-uploads
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {(request.documents || []).filter(d => d.status === 'pending').map((doc, idx) => (
                    <div key={idx} className="border border-amber-200 bg-white rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:border-amber-400 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
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

                      <div className="flex items-center gap-2 pt-2 border-t border-amber-100 mt-1">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await agentApi.downloadDocument(doc._id);
                              window.open(res.data.data.url, '_blank');
                            } catch (err) {
                              toast.error("Failed to load document");
                            }
                          }}
                          className="flex-1 h-8 bg-amber-100 hover:bg-amber-200 text-[12px] font-bold text-amber-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await agentApi.acceptDocument(doc._id);
                              toast.success("Document verified!");
                              fetchRequestDetails();
                            } catch (e) {
                              toast.error("Failed to accept document");
                            }
                          }}
                          className="flex-1 h-8 bg-emerald-100 hover:bg-emerald-200 text-[12px] font-bold text-emerald-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const reason = "Document did not pass verification";
                              await agentApi.rejectDocument(doc._id, reason);
                              if (request.status !== 'correction_required') {
                                await agentApi.requestCorrection(request._id, `Document ${doc.originalName} was rejected. Please upload a clear and valid copy.`);
                              }
                              toast.success("Document rejected");
                              fetchRequestDetails();
                            } catch (e) {
                              toast.error(e?.response?.data?.message || "Failed to reject document");
                            }
                          }}
                          className="flex-1 h-8 bg-red-100 hover:bg-red-200 text-[12px] font-bold text-red-800 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-6">
              <div className="pb-4.5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
                  Document Gallery
                </h2>
                <span className="text-[12px] font-bold text-gray-400">{(request.documents || []).length} Documents Uploaded</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(request.documents || []).filter(d => d.status !== 'pending').map((doc, idx) => (
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
                            const res = await agentApi.downloadDocument(doc._id);
                            window.open(res.data.data.url, '_blank');
                          } catch (err) {
                            if (err.response?.status === 404) {
                              toast.error("Document file not found. Automatically requesting re-upload from citizen.");
                              try {
                                await agentApi.rejectDocument(doc._id, 'Document file not found on server. Please re-upload.');
                                await agentApi.requestCorrection(request._id, `Document ${doc.originalName} is missing and needs to be re-uploaded.`);
                                fetchRequestDetails();
                              } catch (e) {
                                toast.error(e?.response?.data?.message || 'An error occurred');
        console.error(e);
                              }
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
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="border-2 border-dashed border-gray-200 hover:border-[#13448a] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors min-h-[72px] bg-gray-50"
              >
                <span className="h-7 w-7 rounded-full bg-white flex items-center justify-center text-[#13448a] border border-gray-100 shadow-sm">
                  +
                </span>
                <span className="text-[12.5px] font-bold text-gray-700 mt-2 block">
                  Upload Additional Document
                </span>
                <span className="text-[10px] font-bold text-gray-400 block mt-0.5">Verification Report, Agent Notes, etc.</span>
              </button>
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
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Address</span>
                  <div className="mt-0.5 text-gray-850 font-bold space-y-0.5 whitespace-pre-wrap">
                    <p>{request.citizen?.address || 'No address provided.'}</p>
                    {(request.citizen?.city || request.citizen?.state || request.citizen?.postalCode) && (
                      <p>{[request.citizen?.city, request.citizen?.state, request.citizen?.postalCode].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
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
                  <option value="under_review">In Progress (Under Review)</option>
                  <option value="correction_required">Documents Required (Correction)</option>
                  <option value="approved">Approved</option>
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
                  <option value="Final Certificate">Final Certificate</option>
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

      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Record Offline Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-red-500 font-bold p-1">✕</button>
            </div>
            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Amount Due</label>
                <div className="text-[15px] font-extrabold text-gray-800">
                  ₹ {request.serviceSnapshot?.serviceCharge || request.service?.serviceCharge || 0}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Receipt / Reference Number</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] text-[13.5px] font-semibold transition-all outline-none"
                  placeholder="e.g. REC-10293"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Internal Note (Optional)</label>
                <textarea
                  value={agentNote}
                  onChange={(e) => setAgentNote(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] text-[13.5px] font-semibold transition-all outline-none resize-none"
                  rows="2"
                  placeholder="E.g. Paid in cash at counter 3..."
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-bold text-white transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Delivery Modal */}
      {showVerifyDeliveryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Verify Delivery</h3>
              <button onClick={() => setShowVerifyDeliveryModal(false)} className="text-gray-400 hover:text-red-500 font-bold p-1">✕</button>
            </div>
            
            {request.paymentStatus === 'COD_DUE' && (
              <div className="flex gap-2.5 rounded-xl bg-amber-50 p-4 border border-amber-200 text-[12.5px] font-semibold text-amber-800 leading-normal">
                <svg style={{ width: '18px', height: '18px' }} className="text-amber-700 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Collect COD Amount: ₹{request.serviceSnapshot?.serviceCharge || 0}
              </div>
            )}
            
            <form onSubmit={handleVerifyDeliverySubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Verification Result</label>
                <select
                  value={verificationResult}
                  onChange={(e) => setVerificationResult(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] outline-none"
                >
                  <option value="PASSED">Passed (Recipient Verified)</option>
                  <option value="RECIPIENT_NOT_PRESENT">Recipient Not Present</option>
                  <option value="FAILED">Verification Failed / Rejected</option>
                </select>
              </div>

              {verificationResult === 'PASSED' && request.paymentStatus === 'COD_DUE' && (
                <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="codCollected"
                    checked={codCollected}
                    onChange={(e) => setCodCollected(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 bg-white border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="codCollected" className="text-[13px] font-bold text-gray-700 cursor-pointer">
                    I confirm that the COD amount (₹{request.serviceSnapshot?.serviceCharge || 0}) was collected.
                  </label>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowVerifyDeliveryModal(false)}
                  className="flex-1 h-11 border border-gray-200 hover:bg-gray-50 text-[13px] font-bold text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#13448a] hover:bg-[#0c316a] text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors"
                >
                  Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
