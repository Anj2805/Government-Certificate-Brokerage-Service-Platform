import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { requestApi } from '../../api/requestApi';

export default function MyRequests() {
  const navigate = useNavigate();

  // API State
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("All Time");

  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const fetchCounter = useRef(0);

  // Summary State for Cards
  const [summary, setSummary] = useState({
    totalRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    documentsRequiredRequests: 0
  });

  const fetchSummary = async () => {
    try {
      const summaryData = await requestApi.getRequestsSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error("Failed to load request summary:", err);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    setIsError(false);

    const currentFetchId = ++fetchCounter.current;

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (statusFilter !== "All") {
        params.status = statusFilter;
      }

      if (timeFilter !== "All Time") {
        params.timeFilter = timeFilter;
      }

      const response = await requestApi.listOwnRequests(params);

      // Prevent stale responses from overwriting newer results
      if (currentFetchId !== fetchCounter.current) {
        return;
      }

      const list = response.data?.requests || [];
      const meta = response.meta || {};

      setRequests(list);
      setTotalItems(meta.total || list.length);
      setTotalPages(meta.totalPages || 1);
    } catch (err) {
      if (currentFetchId === fetchCounter.current) {
        console.error(err);
        setIsError(true);
      }
    } finally {
      if (currentFetchId === fetchCounter.current) {
        setIsLoading(false);
      }
    }
  };

  // Fetch summary once on mount
  useEffect(() => {
    fetchSummary();
  }, []);

  // Combined effect to fetch requests when query variables change (debounced for inputs)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchRequests();
    }, 300);

    return () => clearTimeout(handler);
  }, [currentPage, statusFilter, timeFilter, searchTerm]);

  // Handlers that reset page to 1
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleTimeFilterChange = (time) => {
    setTimeFilter(time);
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  // Dynamic calculations for cards read from live summary endpoint
  const totalCount = summary.totalRequests;
  const activeCount = summary.activeRequests;
  const actionNeededCount = summary.documentsRequiredRequests;
  const completedCount = summary.completedRequests;

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + requests.length;

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const exportToCSV = async () => {
    try {
      const response = await requestApi.listOwnRequests({ limit: 1000 });
      const allRequests = response.data?.requests || [];
      if (allRequests.length === 0) return;
      const headers = ['Request Number', 'Service Name', 'Category', 'Agent', 'Status', 'Created Date'];
      const rows = allRequests.map(r => {
        const agentName = r.assignedAgent ? `${r.assignedAgent.firstName} ${r.assignedAgent.lastName}` : 'N/A';
        return [
          r.requestNumber,
          r.serviceSnapshot?.serviceName || r.service?.name || '',
          r.serviceSnapshot?.category || r.service?.category || '',
          agentName,
          r.status,
          new Date(r.createdAt).toLocaleDateString()
        ];
      });

      let csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `sevasetu_requests_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export data.");
    }
  };

  if (isLoading && requests.length === 0) {
    return (
      <div className="flex flex-col min-h-screen text-[#111827] bg-[#f8fafc]">
        <div className="max-w-[1344px] w-full mx-auto px-6 py-20 flex-1 flex flex-col items-center justify-center">
          <div className="h-10 w-10 border-4 border-[#13448a] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[14.5px] text-gray-500 font-bold">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (isError) {
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
          <h1 className="text-[22px] font-extrabold text-gray-900 mt-6">Failed to Load Requests</h1>
          <p className="text-[14px] text-gray-500 font-semibold mt-2">
            An error occurred while loading your application history. Please try again.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate(PATHS.CITIZEN_DASHBOARD)}
              className="h-11 px-5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[13.5px] font-bold text-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
            <button
              onClick={fetchRequests}
              className="h-11 px-5 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[13.5px] font-bold text-white shadow-md transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">

        {/* Title Header with Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-gray-400">
              <Link to={PATHS.CITIZEN_DASHBOARD} className="hover:text-[#13448a] no-underline">Citizen Dashboard</Link>
              <span>›</span>
              <span className="text-gray-500">My Requests</span>
            </div>
            <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight mt-1">
              My Requests
            </h1>
            <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
              Manage and track all your active government service applications.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(PATHS.CITIZEN_CREATE_REQUEST)}
            className="h-11 px-5 rounded-lg bg-[#13448a] hover:bg-[#0c316a] text-[13.5px] font-bold text-white shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            New Request
          </button>
        </div>

        {/* Mini Stats Card Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4.5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-[#eff6ff] text-[#13448a] flex items-center justify-center shrink-0">
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div>
              <span className="text-[12px] font-bold text-gray-400 block uppercase tracking-wider">Total Requests</span>
              <span className="text-[20px] font-extrabold text-gray-800 mt-0.5 block">{totalCount}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4.5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-[#eff6ff] text-[#13448a] flex items-center justify-center shrink-0">
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <span className="text-[12px] font-bold text-gray-400 block uppercase tracking-wider">Active Now</span>
              <span className="text-[20px] font-extrabold text-gray-800 mt-0.5 block">{activeCount}</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4.5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-50 text-red-655 flex items-center justify-center shrink-0">
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <span className="text-[12px] font-bold text-gray-400 block uppercase tracking-wider">Action Needed</span>
              <span className="text-[20px] font-extrabold text-red-550 mt-0.5 block">{actionNeededCount}</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4.5 shadow-sm flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <span className="text-[12px] font-bold text-gray-400 block uppercase tracking-wider">Total Completed</span>
              <span className="text-[20px] font-extrabold text-gray-800 mt-0.5 block">{completedCount}</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search */}
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
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by Request ID or Service..."
              className="w-full h-11 pl-10 pr-4 rounded-lg bg-white border border-[#e2e8f0] focus:ring-2 focus:ring-[#13448a] focus:border-[#13448a] text-[13.5px] font-semibold text-gray-700 placeholder-gray-400 transition-all outline-none"
            />
          </div>

          {/* Buttons filters */}
          <div className="flex items-center gap-3 self-end md:self-auto relative">

            {/* Status dropdown filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen);
                  setTimeDropdownOpen(false);
                }}
                className="h-11 px-4 rounded-lg border border-[#e2e8f0] bg-white hover:bg-gray-50 text-[13px] font-bold text-gray-700 transition-colors flex items-center gap-2 shadow-sm uppercase"
              >
                <svg style={{ width: '16px', height: '16px' }} className="text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Status: {statusFilter.replace('_', ' ')}
              </button>

              {statusDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-20 text-[13px] font-semibold text-gray-700">
                  {[
                    { label: "All", value: "All" },
                    { label: "Draft", value: "draft" },
                    { label: "Submitted", value: "submitted" },
                    { label: "Assigned", value: "assigned" },
                    { label: "In Progress", value: "in_progress" },
                    { label: "Action Needed", value: "documents_required" },
                    { label: "Completed", value: "completed" },
                    { label: "Rejected", value: "rejected" },
                    { label: "Cancelled", value: "cancelled" }
                  ].map(st => (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => {
                        handleStatusFilterChange(st.value);
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${statusFilter === st.value ? 'text-[#13448a] font-bold bg-[#13448a]/5' : ''}`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time period filter */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setTimeDropdownOpen(!timeDropdownOpen);
                  setStatusDropdownOpen(false);
                }}
                className="h-11 px-4 rounded-lg border border-[#e2e8f0] bg-white hover:bg-gray-50 text-[13px] font-bold text-gray-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <svg style={{ width: '16px', height: '16px' }} className="text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {timeFilter}
              </button>

              {timeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-20 text-[13px] font-semibold text-gray-700">
                  {["All Time", "Last 30 Days", "Last 6 Months"].map(tf => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => {
                        handleTimeFilterChange(tf);
                        setTimeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${timeFilter === tf ? 'text-[#13448a] font-bold bg-[#13448a]/5' : ''}`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* All Service Applications Card & Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[17px] font-extrabold text-[#0f294a] flex items-center gap-2">
              <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              All Service Applications
            </h2>
            <button
              onClick={exportToCSV}
              className="text-[12.5px] font-bold text-gray-555 hover:text-[#13448a] flex items-center gap-1.5 transition-colors"
            >
              <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4.5">Request Number</th>
                  <th className="px-6 py-4.5">Service Name</th>
                  <th className="px-6 py-4.5">Assigned Agent</th>
                  <th className="px-6 py-4.5">Status</th>
                  <th className="px-6 py-4.5">Created Date</th>
                  <th className="px-6 py-4.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px] font-semibold text-gray-600">
                {requests.length > 0 ? (
                  requests.map((req, idx) => {
                    const serviceName = req.serviceSnapshot?.serviceName || req.service?.name || "Unknown Service";
                    const category = req.serviceSnapshot?.category || req.service?.category || "General";
                    const agentName = req.assignedAgent ? `${req.assignedAgent.firstName} ${req.assignedAgent.lastName}` : "Not Assigned Yet";
                    const createdDate = new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                    return (
                      <tr key={idx} className="hover:bg-gray-50/40 transition-colors">
                        {/* Request Number */}
                        <td className="px-6 py-4.5 font-bold text-[#13448a]">
                          <span onClick={() => navigate(PATHS.CITIZEN_REQUEST_DETAILS.replace(":id", req._id))} className="hover:underline cursor-pointer">
                            {req.requestNumber}
                          </span>
                        </td>

                        {/* Service Name */}
                        <td className="px-6 py-4.5">
                          <span className="font-extrabold text-gray-800 block">{serviceName}</span>
                          <span className="text-[11px] text-gray-400 font-bold block mt-0.5 uppercase tracking-wider">{category}</span>
                        </td>

                        {/* Assigned Agent */}
                        <td className="px-6 py-4.5">
                          {req.assignedAgent ? (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-[#eff6ff] text-[#13448a] flex items-center justify-center text-[10px] font-extrabold border border-blue-100 shrink-0">
                                {agentName.charAt(0)}
                              </div>
                              <span className="font-bold text-gray-700">{agentName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Not Assigned Yet</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4.5">
                          {req.status === "completed" && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                              Completed
                            </span>
                          )}
                          {req.status === "in_progress" && (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                              In Progress
                            </span>
                          )}
                          {req.status === "assigned" && (
                            <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                              Assigned
                            </span>
                          )}
                          {req.status === "documents_required" && (
                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-205 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                              Action Needed
                            </span>
                          )}
                          {req.status === "submitted" && (
                            <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
                              Submitted
                            </span>
                          )}
                          {req.status === "draft" && (
                            <span className="inline-flex items-center gap-1 text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-550"></span>
                              Draft
                            </span>
                          )}
                          {req.status === "rejected" && (
                            <span className="inline-flex items-center gap-1 text-red-800 bg-red-50/50 border border-red-250 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-800"></span>
                              Rejected
                            </span>
                          )}
                          {req.status === "cancelled" && (
                            <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-50 border border-gray-150 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold">
                              <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                              Cancelled
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="px-6 py-4.5 text-gray-500 font-semibold">{createdDate}</td>

                        {/* Action */}
                        <td className="px-6 py-4.5 text-right space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => navigate(PATHS.CITIZEN_REQUEST_DETAILS.replace(":id", req._id))}
                            className="h-8 px-3 rounded-lg border border-[#e2e8f0] hover:border-[#13448a] hover:bg-[#13448a]/5 text-[12px] font-extrabold text-gray-700 hover:text-[#13448a] transition-all inline-flex items-center gap-1"
                          >
                            <svg style={{ width: '13px', height: '13px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-[14px] text-gray-400 font-bold">
                      No matching service requests found. Try adjusting your filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4 text-[12.5px] font-bold text-gray-400">
            <span>
              Showing <span className="text-gray-700">{totalItems === 0 ? 0 : indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)}</span> of <span className="text-gray-700">{totalItems}</span> requests
            </span>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-3.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-extrabold text-gray-700 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => paginate(idx + 1)}
                  className={`h-8 w-8 rounded-lg text-[12px] font-extrabold transition-colors ${
                    currentPage === idx + 1
                      ? 'bg-[#13448a] text-white shadow-sm'
                      : 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-3.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[12px] font-extrabold text-gray-700 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              >
                Next ›
              </button>
            </div>
          </div>

        </div>

        {/* Assistance Help card at bottom */}
        <div className="bg-[#eff6ff]/35 rounded-2xl border border-[#dbeafe] p-6 flex gap-4 shadow-sm items-start">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#1e40af] border border-[#bfdbfe]">
            <svg style={{ width: '18px', height: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="flex-1 sm:flex items-center justify-between gap-6">
            <div>
              <h3 className="text-[14.5px] font-extrabold text-[#0f294a]">Need Assistance?</h3>
              <p className="text-[13px] text-gray-500 font-semibold mt-1 leading-relaxed">
                If you have questions about a specific request, review the request details and status history. Support ticketing is planned for a later phase.
              </p>
            </div>
            <Link to="#" className="inline-flex items-center shrink-0 mt-3 sm:mt-0 text-[13px] font-extrabold text-[#13448a] hover:underline">
              View FAQs
            </Link>
          </div>
        </div>

      </div>

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
