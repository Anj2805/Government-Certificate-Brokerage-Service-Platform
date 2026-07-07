import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { requestApi } from '../../api/requestApi';

export default function RequestTrack() {
  const { id } = useParams();
  const navigate = useNavigate();

  // State
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await requestApi.getRequestDetails(id);
      setRequest(data);
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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen text-[#111827] bg-[#f8fafc]">
        <div className="max-w-[1344px] w-full mx-auto px-6 py-20 flex-1 flex flex-col items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[14.5px] text-gray-550 font-bold">Loading tracking information...</p>
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
          <h1 className="text-[22px] font-extrabold text-gray-900 mt-6">Failed to Load Tracking Details</h1>
          <p className="text-[14px] text-gray-500 font-semibold mt-2">
            The request tracking timeline could not be loaded. Please verify your internet connection or request ID.
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

  // Get dynamic state variables
  const statusLabel = request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ');
  const appliedDate = new Date(request.createdAt);
  const estDays = request.serviceSnapshot?.estimatedProcessingDays || request.service?.estimatedProcessingDays || 7;
  const estDate = new Date(appliedDate.getTime() + estDays * 24 * 60 * 60 * 1000);
  const estDateStr = estDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Find date for each status transition in the history
  const getStatusTime = (targetStatus) => {
    const entry = request.statusHistory?.find(h => h.toStatus === targetStatus);
    if (!entry) return null;
    return new Date(entry.changedAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Build the list of stages to display in the UI timeline
  const milestones = [
    {
      key: 'draft',
      label: 'Draft Created',
      description: 'Application details entered and draft initiated.',
      time: getStatusTime('draft') || new Date(request.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      isCompleted: true,
      isActive: request.status === 'draft'
    },
    {
      key: 'submitted',
      label: 'Documents Submitted',
      description: 'Application submitted for review.',
      time: getStatusTime('submitted'),
      isCompleted: request.status !== 'draft',
      isActive: request.status === 'submitted'
    },
    {
      key: 'assigned',
      label: 'Agent Assigned',
      description: 'Request assigned to a service agent.',
      time: getStatusTime('assigned'),
      isCompleted: !['draft', 'submitted'].includes(request.status),
      isActive: request.status === 'assigned'
    },
    {
      key: 'in_progress',
      label: 'Verification In-Progress',
      description: 'Agent is verifying uploaded papers and matching records.',
      time: getStatusTime('in_progress') || getStatusTime('documents_required'),
      isCompleted: ['completed', 'rejected'].includes(request.status),
      isActive: ['in_progress', 'documents_required'].includes(request.status)
    },
    {
      key: 'completed',
      label: 'Certificate Issued',
      description: 'Request marked completed in the service workflow.',
      time: getStatusTime('completed'),
      isCompleted: request.status === 'completed',
      isActive: request.status === 'completed'
    }
  ];

  // If request is cancelled or rejected, append the terminal status to the milestones list
  if (['cancelled', 'rejected'].includes(request.status)) {
    milestones.push({
      key: request.status,
      label: request.status === 'cancelled' ? 'Request Cancelled' : 'Request Rejected',
      description: request.status === 'cancelled' ? 'This application was cancelled by the user.' : 'This application was rejected by the auditing authority.',
      time: getStatusTime(request.status),
      isCompleted: true,
      isActive: true,
      isTerminal: true
    });
  }

  // Calculate active track percentage
  let completedCount = milestones.filter(m => m.isCompleted).length;
  let totalSteps = milestones.length;
  let trackPct = Math.round(((completedCount - 1) / (totalSteps - 1)) * 100);

  // Dynamic alert banner info based on status
  const getBannerInfo = () => {
    switch (request.status) {
      case 'draft':
        return {
          title: "Application is in Draft Mode",
          desc: "You have not submitted this request yet. Please complete the form and submit your request to begin processing.",
          colorClass: "bg-blue-50 border-blue-200 text-blue-800",
          iconColor: "text-blue-500",
          iconBg: "bg-blue-500/10"
        };
      case 'submitted':
        return {
          title: "Awaiting Agent Assignment",
          desc: "Your request has been successfully submitted and is in the queue for agent allocation. No further action is required from you.",
          colorClass: "bg-amber-50 border-amber-200 text-amber-800",
          iconColor: "text-amber-500",
          iconBg: "bg-amber-500/10"
        };
      case 'assigned':
        return {
          title: "Agent Allocated",
          desc: "An agent has been assigned to your request. They are currently reviewing your documents to verify authenticity.",
          colorClass: "bg-indigo-50 border-indigo-200 text-indigo-800",
          iconColor: "text-indigo-500",
          iconBg: "bg-indigo-500/10"
        };
      case 'documents_required':
        return {
          title: "Action Required: Re-upload Documents",
          desc: "The assigned agent has identified issues with one or more uploaded files. Open Request Details and upload a clearer copy.",
          colorClass: "bg-red-50 border-red-200 text-red-800",
          iconColor: "text-red-600",
          iconBg: "bg-red-600/10"
        };
      case 'in_progress':
        return {
          title: "Physical Verification Stage",
          desc: "The assigned agent is processing the application. Timelines can vary based on service workload.",
          colorClass: "bg-[#fffbeb] border-[#fef3c7] text-amber-900",
          iconColor: "text-[#f58220]",
          iconBg: "bg-[#f58220]/10"
        };
      case 'completed':
        return {
          title: "Application Successful",
          desc: "This request is marked completed. Review the Document Gallery on the details page for available files.",
          colorClass: "bg-emerald-50 border-emerald-250 text-emerald-800",
          iconColor: "text-emerald-600",
          iconBg: "bg-emerald-600/10"
        };
      case 'cancelled':
        return {
          title: "Application Cancelled",
          desc: "You cancelled this application request. If this was a mistake, please start a new service request.",
          colorClass: "bg-gray-50 border-gray-200 text-gray-800",
          iconColor: "text-gray-500",
          iconBg: "bg-gray-500/10"
        };
      case 'rejected':
        return {
          title: "Application Rejected",
          desc: "The reviewing authority has rejected your request. You can see the rejection reason in your Status History.",
          colorClass: "bg-red-50 border-red-200 text-red-800",
          iconColor: "text-red-600",
          iconBg: "bg-red-600/10"
        };
      default:
        return {
          title: "Processing Application",
          desc: "Your application is being processed by the SevaSetu portal.",
          colorClass: "bg-gray-50 border-gray-200 text-gray-800",
          iconColor: "text-gray-500",
          iconBg: "bg-gray-500/10"
        };
    }
  };

  const banner = getBannerInfo();

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-6">

        {/* Dynamic Alert Banner */}
        <div className={`border rounded-2xl p-5 flex items-start gap-4 shadow-sm relative ${banner.colorClass}`}>
          <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center border font-bold ${banner.iconBg} ${banner.iconColor}`}>
            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="flex-1 pr-6">
            <h4 className="text-[14.5px] font-extrabold tracking-tight">{banner.title}</h4>
            <p className="text-[13px] font-semibold mt-1 leading-relaxed opacity-90">
              {banner.desc}
            </p>
          </div>
        </div>

        {/* Service Header Info Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[12.5px] font-bold text-gray-400">
              <button
                onClick={() => navigate(-1)}
                className="hover:text-[#13448a] flex items-center gap-1 transition-colors font-bold"
              >
                ← Back
              </button>
              <span>/</span>
              <span className="text-gray-500 font-semibold">Track Request</span>
            </div>
            
            <h1 className="text-[24px] font-extrabold text-[#0f294a] leading-tight">
              {request.serviceSnapshot?.serviceName || request.service?.name}
            </h1>

            <div className="flex items-center gap-3">
              <span className="inline-flex px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-[11px] font-bold text-gray-600">
                ID: {request.requestNumber}
              </span>
              <span className="flex items-center gap-1 text-[11.5px] text-gray-450 font-semibold">
                <svg style={{ width: '13.5px', height: '13.5px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Submitted on {appliedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Assigned Agent Widget inside Header */}
          <div className="border border-gray-100 rounded-2xl p-4.5 bg-gray-50/50 flex items-center gap-4.5 max-w-sm shrink-0">
            {request.assignedAgent ? (
              <>
                <div className="relative">
                  {request.assignedAgent.avatar ? (
                    <img
                      src={request.assignedAgent.avatar}
                      alt={request.assignedAgent.firstName}
                      className="h-11 w-11 rounded-full object-cover border border-gray-150"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-[#eff6ff] text-[#13448a] flex items-center justify-center font-extrabold border border-blue-100">
                      {request.assignedAgent.firstName.charAt(0)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white"></span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-405 block uppercase tracking-wider">Assigned Agent</span>
                  <h4 className="text-[14px] font-extrabold text-gray-800 mt-0.5">{request.assignedAgent.firstName} {request.assignedAgent.lastName}</h4>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Link
                      to={PATHS.CITIZEN_REQUEST_DETAILS.replace(":id", request._id)}
                      className="h-7 px-2.5 rounded bg-[#13448a] hover:bg-[#0c316a] text-[10.5px] font-bold text-white transition-colors flex items-center justify-center no-underline"
                    >
                      Message
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 py-1">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-150 text-gray-400 font-bold">
                  ?
                </div>
                <div>
                  <span className="text-[10.5px] font-bold text-gray-400 block uppercase">Assignment Pending</span>
                  <span className="text-[11.5px] text-gray-500 font-semibold block mt-0.5">Allocation under progress</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Grid: Left Timeline (2/3), Right Sidebars (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Live Progress Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Title section */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
                <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Live Progress Timeline
              </h2>

              <div className="flex items-center gap-4 text-[11px] font-bold">
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Completed
                </span>
                <span className="flex items-center gap-1 text-[#f58220]">
                  <span className="h-2 w-2 rounded-full bg-[#f58220]"></span>
                  Active / Pending
                </span>
              </div>
            </div>

            {/* Vertical timeline trail */}
            <div className="relative pl-8 ml-3 space-y-6 text-[13px] font-semibold text-gray-655">
              
              {/* Connector lines */}
              <div className="absolute left-[3px] top-4 bottom-4 w-[2px] bg-gray-100 z-0"></div>
              
              {/* Active connector path based on progress percentage */}
              <div className="absolute left-[3px] top-4 w-[2px] bg-emerald-500 z-0 transition-all duration-500" style={{
                height: `${trackPct}%`
              }}></div>

              {milestones.map((milestone, index) => {
                let dotClass = "border-gray-200 bg-white text-gray-300";
                if (milestone.isActive) {
                  dotClass = milestone.isTerminal && request.status === 'cancelled'
                    ? "bg-red-50 text-red-600 border-red-400 ring-4 ring-red-100"
                    : milestone.isTerminal && request.status === 'rejected'
                      ? "bg-red-50 text-red-600 border-red-400 ring-4 ring-red-100"
                      : "bg-[#f58220]/15 text-[#f58220] border-[#f58220] ring-4 ring-[#f58220]/15";
                } else if (milestone.isCompleted) {
                  dotClass = "bg-emerald-50 text-emerald-600 border-emerald-400";
                }

                return (
                  <div key={index} className="relative z-10">
                    <span className={`absolute -left-[35px] top-1.5 h-6 w-6 rounded-full flex items-center justify-center border-2 text-[12px] font-bold ${dotClass}`}>
                      {milestone.isCompleted && !milestone.isActive ? "✓" : milestone.isActive && milestone.isTerminal ? "✕" : index + 1}
                    </span>
                    
                    <div className={`bg-white rounded-xl border p-5 shadow-sm space-y-2 transition-all ${
                      milestone.isActive ? 'border-[#f58220]/50 ring-1 ring-[#f58220]/10' : 'border-gray-150'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h3 className={`text-[14.5px] font-extrabold ${milestone.isActive ? 'text-[#f58220]' : 'text-gray-800'}`}>
                          {milestone.label}
                        </h3>
                        {milestone.time && (
                          <span className="text-[10px] text-gray-400 font-bold">{milestone.time}</span>
                        )}
                      </div>
                      <p className="text-[13px] text-gray-500 leading-relaxed font-semibold">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                );
              })}

            </div>

          </div>

          {/* Sidebar Modules (Right Column) */}
          <div className="space-y-6">
            
            {/* Required Actions Widget */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-[14.5px] font-extrabold text-[#0f294a]">Required Actions</h3>
                <p className="text-[12.5px] text-gray-450 font-semibold mt-0.5">Items needing your attention</p>
              </div>

              {request.status === 'documents_required' ? (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-[12.5px] font-semibold text-red-800 leading-normal">
                    <h4 className="font-extrabold">Upload Corrected Documents</h4>
                    <p className="mt-0.5 opacity-90 text-[11.5px]">Please go to details page to re-upload documents as requested by agent.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gray-100 text-[#13448a] border border-gray-200 flex items-center justify-center shrink-0">
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="text-[12.5px] font-semibold text-gray-550 leading-normal">
                    <h4 className="font-extrabold text-gray-800">No Pending Tasks</h4>
                      <p className="mt-0.5 text-gray-400">No additional document action is currently required.</p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => alert("Submission receipt download initiated.")}
                className="h-11 w-full bg-[#13448a] hover:bg-[#0c316a] text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Submission Receipt
              </button>
            </div>

            {/* Help & Support Widget */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
              <div className="bg-[#13448a] text-white px-5 py-3.5 text-[11px] font-bold tracking-wider uppercase">
                Help & Support
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-150 shrink-0 text-gray-500">
                    <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-extrabold text-gray-800 leading-normal">Facing issues?</h4>
                    <p className="text-[11.5px] text-gray-400 font-bold">Support module planned</p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="h-10 w-full cursor-not-allowed border border-gray-200 text-[12.5px] font-bold text-gray-400 rounded-lg flex items-center justify-center"
                >
                  Coming Soon
                </button>
              </div>
            </div>

            {/* Service Estimates Widget */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[12px] font-extrabold text-[#0f294a] uppercase tracking-wider pb-3 border-b border-gray-50">Service Estimates</h3>
              
              <div className="text-[13.5px] font-semibold text-gray-500 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Avg. Processing Time</span>
                  <span className="text-gray-800 font-extrabold">{estDays} Days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Est. Completion Date</span>
                  <span className="text-[#f58220] font-extrabold">{estDateStr}</span>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 italic font-semibold leading-relaxed pt-2 border-t border-gray-50">
                *Estimates are based on historical data for regional offices and may vary based on workload.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e2e8f0] py-6 px-6 mt-12">
        <div className="max-w-[1344px] w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12.5px] font-semibold text-gray-550">
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
