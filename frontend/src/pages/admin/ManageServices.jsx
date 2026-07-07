import { useState } from 'react';

const INITIAL_SERVICES = [
  { id: "SRV-01", name: "Income Certificate Issuance", department: "Revenue Department", estimatedTime: "7-10 Days", fee: "₹150.00", status: "Active", desc: "For proving annual income from all sources." },
  { id: "SRV-02", name: "Domicile Certificate Issuance", department: "Revenue Department", estimatedTime: "10 Days", fee: "₹200.00", status: "Active", desc: "For proving permanent residency in the state." },
  { id: "SRV-03", name: "Birth Certificate Issuance", department: "Health & Family Welfare", estimatedTime: "5-7 Days", fee: "₹100.00", status: "Active", desc: "Official birth registration cert." },
  { id: "SRV-04", name: "Caste Certificate Issuance", department: "Social Justice & Empowerment", estimatedTime: "15 Days", fee: "₹120.00", status: "Active", desc: "Verifying community/caste membership." },
  { id: "SRV-05", name: "PAN Card Linkage Service", department: "Income Tax Department", estimatedTime: "2-3 Days", fee: "₹50.00", status: "Inactive", desc: "Linking Aadhaar card to Permanent Account Number." }
];

export default function ManageServices() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal controls
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    department: "Revenue Department",
    estimatedTime: "",
    fee: "",
    desc: "",
    status: "Active"
  });

  const handleOpenAdd = () => {
    setFormData({
      id: "SRV-0" + (services.length + 1),
      name: "",
      department: "Revenue Department",
      estimatedTime: "",
      fee: "",
      desc: "",
      status: "Active"
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (srv) => {
    setFormData(srv);
    setShowEditModal(true);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.estimatedTime || !formData.fee) {
      alert("Please fill all required fields.");
      return;
    }
    const formattedFee = formData.fee.startsWith("₹") ? formData.fee : `₹${formData.fee}`;
    const newService = { ...formData, fee: formattedFee };

    setServices(prev => [...prev, newService]);
    setShowAddModal(false);
    alert(`Successfully created new service: "${formData.name}"`);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setServices(prev => prev.map(srv => {
      if (srv.id === formData.id) {
        const formattedFee = formData.fee.startsWith("₹") ? formData.fee : `₹${formData.fee}`;
        return { ...formData, fee: formattedFee };
      }
      return srv;
    }));
    setShowEditModal(false);
    alert(`Successfully updated service: "${formData.name}"`);
  };

  const handleToggleStatus = (srvId) => {
    setServices(prev => prev.map(srv => {
      if (srv.id === srvId) {
        const newStatus = srv.status === "Active" ? "Inactive" : "Active";
        alert(`Service status for "${srv.name}" changed to ${newStatus}`);
        return { ...srv, status: newStatus };
      }
      return srv;
    }));
  };

  // Filter list
  const filteredServices = services.filter(srv => {
    const matchesSearch = srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          srv.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || srv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
              Manage Government Services
            </h1>
            <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
              Configure the catalog of public services and certificates available to citizens.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="h-11 px-5 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[13.5px] font-bold text-white shadow-sm transition-colors flex items-center gap-1.5"
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add Service
          </button>
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
              placeholder="Search services or departments..."
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
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Services Table Card */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              Active Services Catalog
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4.5">Service ID</th>
                  <th className="px-6 py-4.5">Service Name</th>
                  <th className="px-6 py-4.5">Department</th>
                  <th className="px-6 py-4.5">Processing Timeline</th>
                  <th className="px-6 py-4.5">Base Fee</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px] font-semibold text-gray-600">
                {filteredServices.length > 0 ? (
                  filteredServices.map((srv, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4.5 font-bold text-[#13448a]">{srv.id}</td>
                      <td className="px-6 py-4.5">
                        <span className="font-extrabold text-gray-800 block">{srv.name}</span>
                        <span className="text-[11.5px] text-gray-400 font-bold block mt-0.5 max-w-sm truncate">{srv.desc}</span>
                      </td>
                      <td className="px-6 py-4.5 text-gray-700">{srv.department}</td>
                      <td className="px-6 py-4.5 text-gray-500">{srv.estimatedTime}</td>
                      <td className="px-6 py-4.5 font-bold text-gray-800">{srv.fee}</td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                          srv.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}>
                          {srv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 text-right space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(srv)}
                          className="h-8 px-3 rounded border border-[#e2e8f0] hover:border-[#13448a] hover:bg-[#13448a]/5 text-[11.5px] font-bold text-gray-700 hover:text-[#13448a] transition-all"
                        >
                          Edit Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(srv.id)}
                          className={`h-8 px-3 rounded border text-[11.5px] font-bold transition-all ${
                            srv.status === "Active"
                              ? "border-red-150 hover:bg-red-50 text-red-600 hover:border-red-300"
                              : "border-emerald-150 hover:bg-emerald-50 text-emerald-600 hover:border-emerald-300"
                          }`}
                        >
                          {srv.status === "Active" ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[14px] text-gray-400 font-bold bg-white">
                      No government services match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL 1: ADD SERVICE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Create Government Service</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-[13.5px] font-semibold">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Service Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Caste Certificate Issuance"
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a]"
                >
                  <option value="Revenue Department">Revenue Department</option>
                  <option value="Health & Family Welfare">Health & Family Welfare</option>
                  <option value="Social Justice & Empowerment">Social Justice & Empowerment</option>
                  <option value="Income Tax Department">Income Tax Department</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Timeline *</label>
                  <input
                    type="text"
                    required
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    placeholder="e.g. 5-7 Days"
                    className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Base Fee *</label>
                  <input
                    type="text"
                    required
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    placeholder="e.g. 150.00"
                    className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  placeholder="Summarize the certificate function and validities..."
                  rows="3"
                  className="w-full p-3 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 h-11 border border-gray-200 hover:bg-gray-50 text-[13px] font-bold text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#13448a] hover:bg-[#0c316a] text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors"
                >
                  Save Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SERVICE */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-[#0f294a]">Edit Government Service</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-[13.5px] font-semibold">
              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Service Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Caste Certificate Issuance"
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a]"
                >
                  <option value="Revenue Department">Revenue Department</option>
                  <option value="Health & Family Welfare">Health & Family Welfare</option>
                  <option value="Social Justice & Empowerment">Social Justice & Empowerment</option>
                  <option value="Income Tax Department">Income Tax Department</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Timeline *</label>
                  <input
                    type="text"
                    required
                    value={formData.estimatedTime}
                    onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                    placeholder="e.g. 5-7 Days"
                    className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Base Fee *</label>
                  <input
                    type="text"
                    required
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    placeholder="e.g. 150.00"
                    className="w-full h-11 px-3.5 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={formData.desc}
                  onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                  placeholder="Summarize the certificate function and validities..."
                  rows="3"
                  className="w-full p-3 rounded-lg border border-gray-200 text-gray-700 focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 h-11 border border-gray-200 hover:bg-gray-50 text-[13px] font-bold text-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-[#13448a] hover:bg-[#0c316a] text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors"
                >
                  Save Changes
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
