import { useState, useEffect } from 'react';
import { agentApi } from '../../api/agentApi';

export default function AgentAssignedRequests() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await agentApi.listAssignedRequests({ limit: 100 });
      setRequests(data.data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
                        <td className="px-6 py-4.5 font-bold text-[#13448a]">{req.requestNumber}</td>
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
        </div>
      </div>
    </div>
  );
}
