import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { adminApi } from '../../api/adminApi';
import { requestApi } from '../../api/requestApi';
import toast from 'react-hot-toast';

export default function AdminRequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [requestInfo, setRequestInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [reqData, agentsData] = await Promise.all([
        adminApi.getRequestDetails(id),
        adminApi.listAgents({ limit: 100 })
      ]);
      setRequestInfo(reqData.data?.request || reqData.request || reqData);
      setAgents(agentsData.data?.agents || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load request details');
      navigate(PATHS.ADMIN_REQUESTS);
    } finally {
      setIsLoading(false);
    }
  };

  // Modal controls
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const handleAssignAgent = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    try {
      if (requestInfo.assignedAgent) {
        await adminApi.reassignAgent(requestInfo._id, selectedAgentId);
      } else {
        await adminApi.assignAgent(requestInfo._id, selectedAgentId);
      }
      toast.success(`Successfully assigned request to agent.`);
      setShowAssignModal(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign agent');
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentReference.trim()) {
      toast.error('Please enter a payment reference number.');
      return;
    }
    try {
      await requestApi.recordPayment(id, {
        paymentReference,
        notes: adminNote
      });
      toast.success('Offline payment recorded successfully.');
      setShowPaymentModal(false);
      setPaymentReference("");
      setAdminNote("");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record payment');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen text-[#111827] items-center justify-center">
        <div className="h-12 w-12 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[14px] font-bold text-gray-500">Loading Request Details...</p>
      </div>
    );
  }

  if (!requestInfo) return null;

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">

        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[12.5px] font-bold text-gray-450">
              <button onClick={() => navigate(PATHS.ADMIN_REQUESTS)} className="hover:text-[#13448a]">Requests</button>
              <span>/</span>
              <span className="text-gray-600 font-semibold">{requestInfo._id.substring(0, 10)}...</span>
            </div>

            <h1 className="text-[26px] font-extrabold text-[#0f294a]">
              Request Profile: {requestInfo.service?.name || "Service Request"}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {requestInfo.paymentStatus === 'DUE' && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-bold text-white transition-colors shadow-sm"
              >
                Record Payment
              </button>
            )}
            {requestInfo.status !== 'completed' && requestInfo.status !== 'rejected' && requestInfo.status !== 'draft' && (
              <button
                onClick={() => {
                  setSelectedAgentId(requestInfo.assignedAgent?._id || (agents.length > 0 ? agents[0]._id : ""));
                  setShowAssignModal(true);
                }}
                className="h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[13px] font-bold text-gray-700 transition-colors shadow-sm"
              >
                {requestInfo.assignedAgent ? "Reassign Agent" : "Assign Agent"}
              </button>
            )}
          </div>
        </div>

        {/* Info Grid (3 columns on desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Column 1 & 2: Main Application Dossier */}
          <div className="lg:col-span-2 space-y-6">

            {/* Full Request Information */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[15px] font-extrabold text-[#0f294a] pb-3 border-b border-gray-150 uppercase tracking-wider flex items-center justify-between">
                <span>Current Status</span>
                <span className="capitalize px-3 py-1 bg-[#eff6ff] text-[#13448a] border border-blue-100 rounded-full text-[12px]">{requestInfo.status}</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px] font-semibold text-gray-650">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Request ID</span>
                  <span className="text-gray-800 font-bold block mt-0.5">{requestInfo._id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Priority</span>
                  <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 mt-1 uppercase">Normal</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Date Submitted</span>
                  <span className="text-gray-800 font-bold block mt-0.5">{new Date(requestInfo.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Base Fee Paid</span>
                  <span className="text-emerald-600 font-extrabold block mt-0.5">₹{requestInfo.service?.baseFee || 0}</span>
                </div>
              </div>

              <div className="pt-2 text-[13px] font-semibold text-gray-650">
                <span className="text-[10px] text-gray-400 block uppercase">Statement of Purpose</span>
                <p className="mt-1 text-gray-700 leading-relaxed font-semibold italic bg-gray-50 p-3.5 rounded-lg border border-gray-100">
                  {requestInfo.metadata?.purpose || "Standard application."}
                </p>
              </div>
            </div>

            {/* Applicant Profile */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[15px] font-extrabold text-[#0f294a] pb-3 border-b border-gray-150 uppercase tracking-wider">Citizen Profile</h3>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#13448a] flex items-center justify-center font-extrabold text-[16px] border border-blue-100 shrink-0">
                  {requestInfo.citizen?.firstName?.[0]}{requestInfo.citizen?.lastName?.[0]}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 w-full">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Full Name</span>
                    <span className="text-gray-800 font-extrabold text-[14px] mt-0.5">{requestInfo.citizen?.firstName} {requestInfo.citizen?.lastName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Account ID</span>
                    <span className="text-gray-800 font-bold text-[13px] mt-0.5">{requestInfo.citizen?._id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Contact Details</span>
                    <div className="mt-0.5 text-[13px] text-gray-700 font-bold space-y-0.5">
                      <p>{requestInfo.citizen?.email}</p>
                      {requestInfo.citizen?.phone && <p>{requestInfo.citizen.phone}</p>}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Address</span>
                    <div className="mt-0.5 text-[13px] text-gray-700 font-bold space-y-0.5 whitespace-pre-wrap">
                      <p>{requestInfo.citizen?.address || 'No address provided.'}</p>
                      {(requestInfo.citizen?.city || requestInfo.citizen?.state || requestInfo.citizen?.postalCode) && (
                        <p>{[requestInfo.citizen?.city, requestInfo.citizen?.state, requestInfo.citizen?.postalCode].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[15px] font-extrabold text-[#0f294a] pb-3 border-b border-gray-150 uppercase tracking-wider">Submitted Documents</h3>

              {(!requestInfo.documents || requestInfo.documents.length === 0) ? (
                <p className="text-[13px] font-semibold text-gray-500">No documents submitted.</p>
              ) : (
                <div className="space-y-3">
                  {requestInfo.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-600 shadow-sm transition-colors group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                          </svg>
                        </div>
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 truncate" title={doc.originalName}>{doc.originalName}</p>
                          <p className="text-xs font-semibold text-gray-500 truncate">{doc.documentType}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await adminApi.downloadDocument(doc._id);
                            window.open(res.data.data.url, '_blank');
                          } catch (err) {
                            if (err.response?.status === 404) {
                              toast.error("Document file not found. Automatically requesting re-upload from citizen.");
                              try {
                                await adminApi.rejectDocument(doc._id, 'Document file not found on server. Please re-upload.');
                                await adminApi.requestCorrection(requestInfo._id, `Document ${doc.originalName} is missing and needs to be re-uploaded.`);
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
                        className="opacity-0 group-hover:opacity-100 h-8 px-3 ml-2 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all flex items-center justify-center shrink-0"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Citizen & Agent Card Panel */}
          <div className="space-y-6">

            {/* Assigned Agent Card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[15px] font-extrabold text-[#0f294a] pb-3 border-b border-gray-150 uppercase tracking-wider">Assigned Agent</h3>

              {requestInfo.assignedAgent ? (
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-100 shrink-0 bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                    {requestInfo.assignedAgent.firstName?.[0]}{requestInfo.assignedAgent.lastName?.[0]}
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-extrabold text-gray-800">{requestInfo.assignedAgent.firstName} {requestInfo.assignedAgent.lastName}</h4>
                    <p className="text-[12px] font-bold text-gray-500 mt-0.5 capitalize">{requestInfo.assignedAgent.agentStatus} Agent</p>
                    <span className="inline-block mt-2 text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      ID: {requestInfo.assignedAgent._id.substring(0, 8)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-[13px] font-bold text-gray-500">No agent assigned yet.</p>
                </div>
              )}
            </div>

            {/* Status History Timeline */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm space-y-4">
              <h3 className="text-[12px] font-extrabold text-[#0f294a] uppercase tracking-wider pb-3 border-b border-gray-50">Audit Timeline</h3>
              <div className="relative pl-3">
                <div className="absolute top-0 bottom-0 left-[23px] w-0.5 bg-gray-100 z-0"></div>
                <div className="space-y-6 relative z-10">
                  {requestInfo.timeline?.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="mt-1 h-5 w-5 rounded-full bg-[#13448a] border-4 border-white shadow-sm flex-shrink-0 z-10"></div>
                      <div>
                        <h4 className="text-[13.5px] font-extrabold text-gray-800">{item.action}</h4>
                        <p className="text-[12.5px] font-semibold text-gray-600 mt-1">{item.details}</p>
                        <p className="text-[11px] font-bold text-gray-400 mt-1.5">{new Date(item.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {(!requestInfo.timeline || requestInfo.timeline.length === 0) && (
                    <p className="text-[13px] font-semibold text-gray-500">No events recorded.</p>
                  )}
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL: ASSIGN AGENT */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Assign Agent</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <form onSubmit={handleAssignAgent} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Request ID</label>
                <input
                  type="text"
                  value={requestInfo._id}
                  disabled
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-100 bg-gray-50 text-[13.5px] font-bold text-gray-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Select Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-[13.5px] text-gray-700 font-semibold focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                >
                  <option value="" disabled>Select an agent...</option>
                  {agents.filter(a => a.agentStatus === 'approved').map((ag, idx) => (
                    <option key={idx} value={ag._id}>{ag.firstName} {ag.lastName}</option>
                  ))}
                </select>
              </div>

              {selectedAgentId && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                  {(() => {
                    const agent = agents.find(a => a._id === selectedAgentId);
                    if (!agent) return null;
                    return (
                      <>
                        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                          <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm uppercase">
                            {agent.firstName?.[0]}{agent.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">{agent.firstName} {agent.lastName}</p>
                            <p className="text-[12px] font-semibold text-gray-500">{agent.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 mb-2">
                          <div className="flex-1">
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Department</span>
                            <span className="text-[13px] font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-md">{agent.department || 'Central Services'}</span>
                          </div>
                          <div className="flex-1">
                            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Designation</span>
                            <span className="text-[13px] font-semibold text-gray-700">{agent.designation || 'Agent'}</span>
                          </div>
                        </div>
                        <div>
                          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Background / Notes</span>
                          <p className="text-[13px] font-medium text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-100">
                            {agent.agentBackground || 'No background information available.'}
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                            {agent.agentStatus}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

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

      {/* MODAL: RECORD PAYMENT */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Record Offline Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-450 hover:text-red-500 font-extrabold">✕</button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Amount Due</label>
                <div className="text-[15px] font-extrabold text-gray-800">
                  ₹ {requestInfo.service?.serviceCharge || 0}
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
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] text-[13.5px] font-semibold transition-all outline-none resize-none"
                  rows="2"
                  placeholder="E.g. Paid in cash at main office..."
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-[13px] font-bold text-white transition-colors shadow-sm"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
