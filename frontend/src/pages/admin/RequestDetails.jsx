import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PATHS } from '../../config/paths';

const AVAILABLE_AGENTS = [
  { name: "Rajesh Kumar", id: "SS-AG-782", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80", dept: "Revenue Department" },
  { name: "Priya Sharma", id: "SS-AG-903", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80", dept: "Revenue Department" },
  { name: "Sunita Verma", id: "SS-AG-250", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80", dept: "Social Justice & Empowerment" }
];

export default function AdminRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const requestId = id || "REQ-2024-9350";

  // State managed data
  const [requestInfo, setRequestInfo] = useState({
    id: requestId,
    serviceType: "Income Certificate",
    priority: "High",
    dateSubmitted: "Oct 12, 2023",
    feePaid: "₹150.00",
    status: "In Progress",
    purpose: "For applying for state higher education scholarship scheme.",
    citizen: {
      name: "Anjali Sinha",
      email: "anjali.sinha@gmail.com",
      phone: "+91 98765 09105",
      address: "Flat 402, Green Glen Layout, Sector 4, Outer Ring Road, Bangalore"
    },
    agent: {
      name: "Rajesh Kumar",
      id: "SS-AG-782",
      badge: "REV-981",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80"
    },
    documents: [
      { name: "Aadhaar_Card_Anjali.pdf", type: "Identity Proof", status: "Verified" },
      { name: "Electricity_Bill_Sept2023.pdf", type: "Address Proof", status: "Verified" },
      { name: "Income_Declaration_Self.pdf", type: "Income Declaration", status: "Verified" }
    ],
    timeline: [
      { event: "Physical Verification In Progress", details: "Agent contacted local tehsil officer for verification.", time: "Oct 15, 2023 • 11:45 AM" },
      { event: "Agent Assigned", details: "Assigned to Agent Rajesh Kumar for review.", time: "Oct 13, 2023 • 09:00 AM" },
      { event: "Documents Verified", details: "System automated checks and verification verified successfully.", time: "Oct 12, 2023 • 02:30 PM" },
      { event: "Request Submitted", details: "Citizen submitted application with fees.", time: "Oct 12, 2023 • 10:15 AM" }
    ]
  });

  // Modal controls
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Form selections
  const [selectedAgentName, setSelectedAgentName] = useState(requestInfo.agent.name);
  const [selectedStatus, setSelectedStatus] = useState(requestInfo.status);
  const [rejectReason, setRejectReason] = useState("");

  const handleAssignAgent = (e) => {
    e.preventDefault();
    const agentDetails = AVAILABLE_AGENTS.find(ag => ag.name === selectedAgentName);
    setRequestInfo(prev => ({
      ...prev,
      agent: {
        name: agentDetails.name,
        id: agentDetails.id,
        badge: "REV-" + Math.floor(100 + Math.random() * 900),
        avatar: agentDetails.avatar
      },
      timeline: [
        { event: "Agent Reassigned", details: `Admin reassigned verification to ${agentDetails.name}.`, time: new Date().toLocaleString() },
        ...prev.timeline
      ]
    }));
    setShowAssignModal(false);
    alert(`Successfully assigned request to Agent ${agentDetails.name}`);
  };

  const handleStatusChange = (e) => {
    e.preventDefault();
    setRequestInfo(prev => ({
      ...prev,
      status: selectedStatus,
      timeline: [
        { event: `Status Updated to ${selectedStatus}`, details: `Admin manually updated application status.`, time: new Date().toLocaleString() },
        ...prev.timeline
      ]
    }));
    setShowStatusModal(false);
    alert(`Successfully changed status to "${selectedStatus}"`);
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    setRequestInfo(prev => ({
      ...prev,
      status: "Rejected",
      timeline: [
        { event: "Application Rejected", details: `Rejection reason: "${rejectReason}"`, time: new Date().toLocaleString() },
        ...prev.timeline
      ]
    }));
    setShowRejectModal(false);
    alert(`Application has been rejected. Reason: ${rejectReason}`);
  };

  const handleCompleteRequest = () => {
    if (window.confirm("Are you sure you want to mark this request as completed and issue the certificate?")) {
      setRequestInfo(prev => ({
        ...prev,
        status: "Completed",
        timeline: [
          { event: "Application Completed", details: "Certificate successfully signed and issued to Citizen.", time: new Date().toLocaleString() },
          ...prev.timeline
        ]
      }));
      alert("Application marked as Completed. Digital certificate dispatched.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[12.5px] font-bold text-gray-450">
              <button onClick={() => navigate(PATHS.ADMIN_REQUESTS)} className="hover:text-[#13448a]">Requests</button>
              <span>/</span>
              <span className="text-gray-600 font-semibold">{requestId}</span>
            </div>
            
            <h1 className="text-[26px] font-extrabold text-[#0f294a]">
              Request Profile: {requestInfo.serviceType}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => setShowAssignModal(true)}
              className="h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[13px] font-bold text-gray-700 transition-colors shadow-sm"
            >
              Assign Agent
            </button>
            <button
              onClick={() => setShowStatusModal(true)}
              className="h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[13px] font-bold text-gray-700 transition-colors shadow-sm"
            >
              Change Status
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="h-10 px-4 rounded-lg bg-red-50 hover:bg-red-100 text-[13px] font-bold text-red-650 transition-colors"
            >
              Reject Request
            </button>
            <button
              onClick={handleCompleteRequest}
              className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-bold text-white transition-colors shadow-sm"
            >
              Complete & Issue
            </button>
          </div>
        </div>

        {/* Info Grid (3 columns on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Column 1 & 2: Main Application Dossier */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Full Request Information */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[15px] font-extrabold text-[#0f294a] pb-3 border-b border-gray-150 uppercase tracking-wider">Request Details</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px] font-semibold text-gray-650">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Request ID</span>
                  <span className="text-gray-800 font-bold block mt-0.5">{requestInfo.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Priority</span>
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 mt-1 uppercase">{requestInfo.priority}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Date Submitted</span>
                  <span className="text-gray-800 font-bold block mt-0.5">{requestInfo.dateSubmitted}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Base Fee Paid</span>
                  <span className="text-emerald-600 font-extrabold block mt-0.5">{requestInfo.feePaid} (Paid)</span>
                </div>
              </div>

              <div className="pt-2 text-[13px] font-semibold text-gray-650">
                <span className="text-[10px] text-gray-400 block uppercase">Statement of Purpose</span>
                <p className="mt-1 text-gray-700 leading-relaxed font-semibold italic bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                  "{requestInfo.purpose}"
                </p>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[15px] font-extrabold text-[#0f294a] pb-3 border-b border-gray-150 uppercase tracking-wider">Uploaded Documents Dossier</h3>

              <div className="divide-y divide-gray-100">
                {requestInfo.documents.map((doc, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between gap-4 text-[13px]">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-gray-50 border border-gray-150 flex items-center justify-center shrink-0 text-[#13448a]">
                        📄
                      </div>
                      <div>
                        <span className="font-extrabold text-gray-800 block truncate max-w-xs">{doc.name}</span>
                        <span className="text-[11px] text-gray-400 font-bold block">{doc.type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        {doc.status}
                      </span>
                      
                      <button
                        onClick={() => alert(`Downloading ${doc.name}...`)}
                        className="text-[#13448a] hover:underline font-extrabold text-[12.5px]"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status History Timeline */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[15px] font-extrabold text-[#0f294a] pb-3 border-b border-gray-150 uppercase tracking-wider">Status Audit History</h3>

              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[3.5px] top-2 bottom-2 w-[1.5px] bg-gray-150"></div>

                {requestInfo.timeline.map((log, idx) => (
                  <div key={idx} className="relative text-[13px] font-semibold text-gray-650">
                    <span className={`absolute -left-[27.5px] top-1.5 h-2.5 w-2.5 rounded-full ${
                      idx === 0 ? 'bg-[#13448a] ring-4 ring-[#13448a]/15' : 'bg-gray-300'
                    }`} />
                    
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <h4 className="font-extrabold text-gray-800 text-[13.5px]">{log.event}</h4>
                        <p className="text-[12.5px] text-gray-450 mt-0.5 font-semibold leading-relaxed">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold shrink-0">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Column 3: Citizen & Agent Card Panel */}
          <div className="space-y-6">
            
            {/* Citizen Information Card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[12px] font-extrabold text-[#0f294a] uppercase tracking-wider pb-3 border-b border-gray-50">Citizen Information</h3>
              
              <div className="text-[13px] font-semibold text-gray-650 space-y-3">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Full Name</span>
                  <span className="text-gray-800 font-bold block mt-0.5">{requestInfo.citizen.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Email Address</span>
                  <span className="text-gray-850 font-bold block mt-0.5">{requestInfo.citizen.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Phone Number</span>
                  <span className="text-gray-850 font-bold block mt-0.5">{requestInfo.citizen.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Verification Address</span>
                  <span className="text-gray-800 font-semibold block mt-0.5 leading-relaxed">{requestInfo.citizen.address}</span>
                </div>
              </div>
            </div>

            {/* Agent Information Card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[12px] font-extrabold text-[#0f294a] uppercase tracking-wider pb-3 border-b border-gray-50">Assigned Agent Info</h3>
              
              <div className="flex items-center gap-3">
                <img
                  src={requestInfo.agent.avatar}
                  alt={requestInfo.agent.name}
                  className="h-12 w-12 rounded-full object-cover border border-gray-150 shrink-0"
                />
                <div>
                  <h4 className="text-[14.5px] font-extrabold text-gray-800">{requestInfo.agent.name}</h4>
                  <span className="text-[11px] text-gray-400 font-bold uppercase block mt-0.5">Agent ID: {requestInfo.agent.id}</span>
                  <span className="text-[11px] text-[#13448a] font-bold block">Badge: {requestInfo.agent.badge}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAssignModal(true)}
                className="h-9 w-full border border-gray-200 hover:border-[#13448a] hover:bg-[#13448a]/5 text-[12px] font-bold text-gray-700 hover:text-[#13448a] rounded-lg transition-colors flex items-center justify-center"
              >
                Reassign Agent
              </button>
            </div>

            {/* Service Process Status Card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[12px] font-extrabold text-[#0f294a] uppercase tracking-wider pb-3 border-b border-gray-50">Application Status</h3>
              
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-gray-400 font-semibold">Workflow Stage</span>
                <span className={`inline-flex px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${
                  requestInfo.status === "Completed"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : requestInfo.status === "Rejected"
                      ? "bg-red-50 text-red-700 border-red-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {requestInfo.status}
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL 1: ASSIGN AGENT */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Assign Agent</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <form onSubmit={handleAssignAgent} className="space-y-4 text-[13.5px] font-semibold">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Choose Agent</label>
                <select
                  value={selectedAgentName}
                  onChange={(e) => setSelectedAgentName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a]"
                >
                  {AVAILABLE_AGENTS.map((ag, idx) => (
                    <option key={idx} value={ag.name}>{ag.name} ({ag.dept})</option>
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
                  Confirm Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHANGE STATUS */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Update Request Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <form onSubmit={handleStatusChange} className="space-y-4 text-[13.5px] font-semibold">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">New Milestone</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
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

      {/* MODAL 3: REJECT REQUEST */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Reject Application</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4 text-[13.5px] font-semibold">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Reason for Rejection *</label>
                <textarea
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Scanned Aadhaar document is completely blurry..."
                  rows="3"
                  className="w-full p-3 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 h-11 border border-gray-200 hover:bg-gray-50 text-[13px] font-bold text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
