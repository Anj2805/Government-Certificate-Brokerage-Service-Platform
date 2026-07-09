import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { adminApi } from '../../api/adminApi';

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
      setRequestInfo(reqData.request || reqData);
      setAgents(agentsData.data?.agents || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load request details');
      navigate(PATHS.ADMIN_REQUESTS);
    } finally {
      setIsLoading(false);
    }
  };

  // Modal controls
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");

  const handleAssignAgent = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) return;
    try {
      if (requestInfo.assignedAgent) {
        await adminApi.reassignAgent(requestInfo._id, selectedAgentId);
      } else {
        await adminApi.assignAgent(requestInfo._id, selectedAgentId);
      }
      alert(`Successfully assigned request to agent.`);
      setShowAssignModal(false);
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to assign agent');
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
                    <div className="mt-0.5 text-[13px] text-gray-700 font-bold">
                      <p>{requestInfo.citizen?.email}</p>
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
                    <div key={idx} className="flex items-center justify-between p-3.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                          <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-[13px] font-extrabold text-gray-800">{doc.originalName}</p>
                          <p className="text-[11.5px] font-bold text-gray-500 mt-0.5">{doc.documentType}</p>
                        </div>
                      </div>
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

            <form onSubmit={handleAssignAgent} className="space-y-4 text-[13.5px] font-semibold">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Request ID</label>
                <div className="h-10 px-3 bg-gray-50 border border-gray-100 rounded-lg flex items-center text-[13px] text-gray-700 font-bold">
                  {requestInfo._id}
                </div>
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
    </div>
  );
}
