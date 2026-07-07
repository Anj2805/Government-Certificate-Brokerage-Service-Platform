import { useState } from 'react';

const INITIAL_AGENTS = [
  { 
    id: "SS-AG-782", 
    name: "Rajesh Kumar", 
    email: "rajesh.kumar@sevasetu.gov.in", 
    phone: "+91 98765 43210",
    department: "Revenue Department", 
    status: "Approved", 
    joinedDate: "Oct 10, 2023",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80",
    idProof: "Aadhaar Card Verified",
    govBadge: "Badge ID: REV-981",
    experience: "5 Years Public Admin"
  },
  { 
    id: "SS-AG-903", 
    name: "Priya Sharma", 
    email: "priya.sharma@sevasetu.gov.in", 
    phone: "+91 98765 43211",
    department: "Revenue Department", 
    status: "Approved", 
    joinedDate: "Nov 01, 2023",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80",
    idProof: "Voter ID Verified",
    govBadge: "Badge ID: REV-439",
    experience: "3 Years Municipal Officer"
  },
  { 
    id: "SS-AG-114", 
    name: "Anil Deshmukh", 
    email: "anil.deshmukh@sevasetu.gov.in", 
    phone: "+91 98765 43212",
    department: "Health & Family Welfare", 
    status: "Pending Approval", 
    joinedDate: "Dec 12, 2023",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80",
    idProof: "Aadhaar Card Submitted",
    govBadge: "Pending Issuance",
    experience: "4 Years Health Inspector"
  },
  { 
    id: "SS-AG-250", 
    name: "Sunita Verma", 
    email: "sunita.verma@sevasetu.gov.in", 
    phone: "+91 98765 43213",
    department: "Social Justice & Empowerment", 
    status: "Approved", 
    joinedDate: "Jan 03, 2024",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80",
    idProof: "Passport Verified",
    govBadge: "Badge ID: SJE-210",
    experience: "6 Years Social worker"
  },
  { 
    id: "SS-AG-305", 
    name: "Vikram Malhotra", 
    email: "vikram.malhotra@sevasetu.gov.in", 
    phone: "+91 98765 43214",
    department: "Income Tax Department", 
    status: "Suspended", 
    joinedDate: "Feb 18, 2024",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=128&h=128&q=80",
    idProof: "Aadhaar Card Verified",
    govBadge: "Badge ID: ITD-032",
    experience: "8 Years Tax Assessor"
  }
];

export default function ManageAgents() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Detail Modal state
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleApprove = (agentId) => {
    setAgents(prev => prev.map(ag => {
      if (ag.id === agentId) {
        alert(`Approved agent: ${ag.name}`);
        const updated = { ...ag, status: "Approved" };
        if (selectedAgent && selectedAgent.id === agentId) {
          setSelectedAgent(updated);
        }
        return updated;
      }
      return ag;
    }));
  };

  const handleReject = (agentId) => {
    setAgents(prev => prev.map(ag => {
      if (ag.id === agentId) {
        alert(`Rejected agent registration: ${ag.name}`);
        const updated = { ...ag, status: "Rejected" };
        if (selectedAgent && selectedAgent.id === agentId) {
          setSelectedAgent(updated);
        }
        return updated;
      }
      return ag;
    }));
  };

  const handleSuspend = (agentId) => {
    setAgents(prev => prev.map(ag => {
      if (ag.id === agentId) {
        alert(`Suspended agent access: ${ag.name}`);
        const updated = { ...ag, status: "Suspended" };
        if (selectedAgent && selectedAgent.id === agentId) {
          setSelectedAgent(updated);
        }
        return updated;
      }
      return ag;
    }));
  };

  // Filter list
  const filteredAgents = agents.filter(ag => {
    const matchesSearch = ag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ag.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ag.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || ag.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
              Manage Service Agents
            </h1>
            <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
              Register, approve, verify, and moderate government service agents.
            </p>
          </div>

          <div className="inline-flex h-11 items-center px-4 rounded-lg bg-gray-50 border border-gray-200 text-[13px] font-bold text-gray-600">
            Total Registrations: {agents.length}
          </div>
        </div>

        {/* Filter and Search Bar */}
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
              placeholder="Search agent ID, name, or department..."
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
              <option value="Approved">Approved Only</option>
              <option value="Pending Approval">Pending Approval Only</option>
              <option value="Suspended">Suspended Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Agents Table Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              </svg>
              Agent Administration Roster
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4.5">Agent Details</th>
                  <th className="px-6 py-4.5">Agent ID</th>
                  <th className="px-6 py-4.5">Department</th>
                  <th className="px-6 py-4.5">Joined Date</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px] font-semibold text-gray-600">
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((ag, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={ag.avatar}
                            alt={ag.name}
                            className="h-10 w-10 rounded-full object-cover border border-gray-150 shrink-0"
                          />
                          <div>
                            <span className="font-extrabold text-gray-800 block">{ag.name}</span>
                            <span className="text-[11.5px] text-gray-400 font-bold block mt-0.5">{ag.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5 font-bold text-[#13448a]">{ag.id}</td>
                      <td className="px-6 py-4.5 text-gray-700">{ag.department}</td>
                      <td className="px-6 py-4.5 text-gray-500">{ag.joinedDate}</td>
                      <td className="px-6 py-4.5">
                        {ag.status === "Approved" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-100">
                            Approved
                          </span>
                        )}
                        {ag.status === "Pending Approval" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border bg-blue-50 text-blue-700 border-blue-100">
                            Pending
                          </span>
                        )}
                        {ag.status === "Suspended" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border bg-amber-50 text-amber-700 border-amber-100">
                            Suspended
                          </span>
                        )}
                        {ag.status === "Rejected" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border bg-red-50 text-red-700 border-red-100">
                            Rejected
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAgent(ag);
                            setShowDetailModal(true);
                          }}
                          className="h-8 px-3 rounded border border-[#e2e8f0] hover:border-[#13448a] hover:bg-[#13448a]/5 text-[11.5px] font-bold text-gray-700 hover:text-[#13448a] transition-all"
                        >
                          View Credentials
                        </button>
                        
                        {ag.status === "Pending Approval" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(ag.id)}
                              className="h-8 px-3 rounded bg-emerald-600 hover:bg-emerald-700 text-[11.5px] font-bold text-white transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(ag.id)}
                              className="h-8 px-3 rounded bg-red-600 hover:bg-red-700 text-[11.5px] font-bold text-white transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        ) : ag.status === "Approved" ? (
                          <button
                            type="button"
                            onClick={() => handleSuspend(ag.id)}
                            className="h-8 px-3 rounded border border-amber-200 hover:bg-amber-50 text-[11.5px] font-bold text-amber-600 hover:text-amber-700 transition-all"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApprove(ag.id)}
                            className="h-8 px-3 rounded border border-emerald-200 hover:bg-emerald-50 text-[11.5px] font-bold text-emerald-600 hover:text-emerald-700 transition-all"
                          >
                            Re-Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-[14px] text-gray-400 font-bold bg-white">
                      No service agents match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* AGENT DETAIL MODAL */}
      {showDetailModal && selectedAgent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Agent Security Credentials</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            {/* Profile Overview */}
            <div className="flex items-center gap-4 border-b border-gray-50 pb-5">
              <img
                src={selectedAgent.avatar}
                alt={selectedAgent.name}
                className="h-16 w-16 rounded-full object-cover border border-gray-150 shrink-0"
              />
              <div>
                <h4 className="text-[18px] font-extrabold text-gray-800">{selectedAgent.name}</h4>
                <p className="text-[12.5px] font-bold text-[#13448a] mt-0.5">{selectedAgent.department}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[11.5px] text-gray-400 font-semibold">ID: {selectedAgent.id}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide border ${
                    selectedAgent.status === "Approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : selectedAgent.status === "Pending Approval"
                        ? "bg-blue-50 text-blue-700 border-blue-100"
                        : selectedAgent.status === "Suspended"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-red-50 text-red-700 border-red-100"
                  }`}>
                    {selectedAgent.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-2 gap-4 text-[13px] font-semibold text-gray-700">
              <div>
                <span className="text-[10px] text-gray-450 block uppercase tracking-wider">Email Address</span>
                <span className="block mt-0.5 text-gray-800 font-bold">{selectedAgent.email}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-450 block uppercase tracking-wider">Contact Phone</span>
                <span className="block mt-0.5 text-gray-800 font-bold">{selectedAgent.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-450 block uppercase tracking-wider">Verification ID Paperwork</span>
                <span className="block mt-0.5 text-gray-850 font-bold">{selectedAgent.idProof}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-450 block uppercase tracking-wider">Government Authorization badge</span>
                <span className="block mt-0.5 text-gray-850 font-bold">{selectedAgent.govBadge}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-gray-450 block uppercase tracking-wider">Professional Experience</span>
                <span className="block mt-0.5 text-gray-850 font-bold">{selectedAgent.experience}</span>
              </div>
            </div>

            {/* Action Bar inside details */}
            <div className="border-t border-gray-100 pt-5 flex items-center justify-between gap-3">
              <div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="h-10 px-4 border border-gray-200 hover:bg-gray-50 text-[12.5px] font-bold text-gray-700 rounded-lg transition-colors"
                >
                  Close details
                </button>
              </div>

              <div className="flex gap-2">
                {selectedAgent.status === "Pending Approval" ? (
                  <>
                    <button
                      onClick={() => handleReject(selectedAgent.id)}
                      className="h-10 px-4 bg-red-650 hover:bg-red-750 text-[12.5px] font-bold text-white rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(selectedAgent.id)}
                      className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-[12.5px] font-bold text-white rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                  </>
                ) : selectedAgent.status === "Approved" ? (
                  <button
                    onClick={() => handleSuspend(selectedAgent.id)}
                    className="h-10 px-4 bg-amber-600 hover:bg-amber-700 text-[12.5px] font-bold text-white rounded-lg transition-colors"
                  >
                    Suspend Account
                  </button>
                ) : (
                  <button
                    onClick={() => handleApprove(selectedAgent.id)}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-[12.5px] font-bold text-white rounded-lg transition-colors"
                  >
                    Re-Approve Account
                  </button>
                )}
              </div>
            </div>

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
