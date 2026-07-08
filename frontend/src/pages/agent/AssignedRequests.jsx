import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PATHS } from '../../config/paths';
import { agentApi } from '../../api/agentApi';

export default function AgentAssignedRequests() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await agentApi.listAssignedRequests({ page: currentPage, limit: itemsPerPage });
      setRequests(response.data?.requests || []);
      const meta = response.meta || {};
      setTotalPages(meta.totalPages || 1);
      setTotalItems(meta.total || (response.data?.requests || []).length);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage]);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        <div>
          <h1 className="text-[28px] font-extrabold text-[#0f294a] tracking-tight">
            All Assigned Requests
          </h1>
          <p className="text-[14.5px] text-gray-500 font-semibold mt-0.5">
            View all requests currently assigned to you for processing.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 font-bold">Loading requests...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-4.5">Request ID</th>
                    <th className="px-6 py-4.5">Citizen Name</th>
                    <th className="px-6 py-4.5">Service Type</th>
                    <th className="px-6 py-4.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[13px] font-semibold text-gray-600">
                  {requests.length > 0 ? (
                    requests.map((req) => (
                      <tr key={req._id} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-6 py-4.5 font-bold text-[#13448a]">
                          <Link to={PATHS.AGENT_REQUEST_DETAILS.replace(':id', req._id)} className="hover:underline">
                            {req.requestNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4.5 text-gray-800 font-bold">{req.citizen?.firstName} {req.citizen?.lastName}</td>
                        <td className="px-6 py-4.5">{req.serviceSnapshot?.serviceName || req.service?.name}</td>
                        <td className="px-6 py-4.5 uppercase text-[10px] font-extrabold text-gray-700">{req.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-[14px] text-gray-400 font-bold bg-white">
                        No assigned requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {!isLoading && requests.length > 0 && (
            <div className="px-6 py-4.5 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-4 text-[12.5px] font-bold text-gray-400">
              <span>
                Showing <span className="text-gray-700">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="text-gray-700">{totalItems}</span> assigned requests
              </span>

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
          )}
        </div>
      </div>
    </div>
  );
}
