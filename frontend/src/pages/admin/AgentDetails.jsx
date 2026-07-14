import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { adminApi } from '../../api/adminApi';
import { User, Mail, Phone, Calendar, ArrowLeft, FileText, CheckCircle, Shield, Briefcase, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AgentDetails() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await adminApi.getAgentDetails(id);
        if (response.data) {
          setAgent(response.data.agent);
        }
      } catch (error) {
        toast.error('Failed to load agent details');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-semibold">Agent not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        <Link 
          to={PATHS.ADMIN_AGENTS}
          className="inline-flex items-center gap-2 text-[14px] font-bold text-gray-500 hover:text-[#13448a] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Agents
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          <div className="h-24 w-24 rounded-full bg-[#eff6ff] text-[#13448a] border border-blue-100 flex items-center justify-center font-extrabold text-3xl uppercase flex-shrink-0">
            {agent.firstName?.[0] || 'A'}{agent.lastName?.[0] || ''}
          </div>
          <div className="flex-1 space-y-4 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
                  {agent.firstName} {agent.lastName}
                </h1>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-wider ${
                  agent.agentStatus === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  agent.agentStatus === 'suspended' ? 'bg-amber-100 text-amber-700' :
                  agent.agentStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {agent.agentStatus || 'Unknown Status'}
                </span>
              </div>

              {/* Metrics summary */}
              <div className="flex gap-4">
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-center min-w-[100px]">
                  <span className="block text-[22px] font-extrabold text-[#13448a]">
                    {agent.metrics?.find(m => m._id === 'COMPLETED')?.count || 0}
                  </span>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Completed</span>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-center min-w-[100px]">
                  <span className="block text-[22px] font-extrabold text-emerald-600">
                    {agent.metrics?.find(m => m._id === 'IN_PROGRESS')?.count || 0}
                  </span>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">In Progress</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email</span>
                  <span className="block text-[14px] font-semibold text-gray-800 mt-0.5">{agent.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Department</span>
                  <span className="block text-[14px] font-semibold text-gray-800 mt-0.5">Central Services</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">2FA Active</span>
                  <span className="block text-[14px] font-semibold text-gray-800 mt-0.5">
                    {agent.twoFactorEnabled ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Joined</span>
                  <span className="block text-[14px] font-semibold text-gray-800 mt-0.5">
                    {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Background */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
          <h2 className="text-[18px] font-extrabold text-[#0f294a] mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#13448a]" />
            Agent Background
          </h2>
          <div className="space-y-4">
            <textarea
              className="w-full h-32 p-4 rounded-xl border border-gray-200 text-[14px] font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#13448a] focus:border-transparent transition-all resize-none"
              placeholder="Enter background details, qualifications, or notes about this agent..."
              defaultValue={agent.agentBackground || ''}
              onBlur={async (e) => {
                const newValue = e.target.value.trim();
                if (newValue !== (agent.agentBackground || '')) {
                  try {
                    await adminApi.updateAgentBackground(id, newValue);
                    toast.success('Agent background updated successfully');
                    setAgent({ ...agent, agentBackground: newValue });
                  } catch (err) {
                    toast.error('Failed to update agent background');
                    e.target.value = agent.agentBackground || '';
                  }
                }
              }}
            />
            <p className="text-[12px] font-bold text-gray-400">Click outside the text area to save changes automatically.</p>
          </div>
        </div>

        {/* Assigned Requests */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">
          <h2 className="text-[18px] font-extrabold text-[#0f294a] mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#13448a]" />
            Recent Assignments
          </h2>
          
          <div className="space-y-4">
            {agent.assignedRequests?.length === 0 ? (
              <p className="text-[14.5px] font-semibold text-gray-500">No requests assigned yet.</p>
            ) : (
              agent.assignedRequests?.map(req => (
                <div key={req._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors gap-4">
                  <div className="space-y-1">
                    <span className="text-[14.5px] font-extrabold text-gray-800">{req.service?.name}</span>
                    <span className="block text-[12px] font-semibold text-gray-500 font-mono">{req.requestNumber}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-[13px] font-semibold text-gray-500">
                      Assigned: {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase ${
                      req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      req.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {req.status}
                    </span>
                    <Link 
                      to={PATHS.ADMIN_REQUEST_DETAILS.replace(':id', req._id)}
                      className="text-[#13448a] hover:underline text-[13px] font-bold"
                    >
                      View Request
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
