import { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import toast from 'react-hot-toast';

export default function DeadLetterJobs() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.listDeadLetters();
      setJobs(response.data?.jobs || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dead-letter jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplay = async (jobId) => {
    if (!window.confirm('Are you sure you want to replay this job?')) return;
    setIsReplaying(true);
    try {
      await adminApi.replayDeadLetter(jobId);
      toast.success('Job successfully queued for replay');
      fetchJobs();
      setShowDetailsModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to replay job');
    } finally {
      setIsReplaying(false);
    }
  };

  const handleViewDetails = async (jobId) => {
    try {
      const response = await adminApi.getDeadLetterDetails(jobId);
      setSelectedJob(response.data?.job || response.data);
      setShowDetailsModal(true);
    } catch (err) {
      toast.error('Failed to load job details');
    }
  };
  return (
    <div className="flex flex-col min-h-screen text-[#111827]">
      <div className="max-w-[1344px] w-full mx-auto px-6 py-8 flex-1 space-y-8">
        
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-red-700 to-red-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Dead-Letter Queue Management
            </h1>
            <p className="text-red-100 font-medium mt-2 max-w-xl text-sm leading-relaxed">
              Review and replay background jobs that failed to process.
            </p>
          </div>
          
          <button
            onClick={fetchJobs}
            className="relative z-10 h-12 px-6 rounded-xl bg-white text-red-800 text-[14px] font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 hover:bg-red-50 transition-all duration-300 flex items-center gap-2 group"
          >
            <svg style={{ width: '18px', height: '18px' }} className="transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh List
          </button>
        </div>

        {/* DLQ Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4.5">Job ID</th>
                  <th className="px-6 py-4.5">Type</th>
                  <th className="px-6 py-4.5">Target</th>
                  <th className="px-6 py-4.5">Attempts</th>
                  <th className="px-6 py-4.5">Last Failed At</th>
                  <th className="px-6 py-4.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[13px] font-semibold text-gray-600">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p className="mt-3 text-[13px] font-bold text-gray-500">Loading dead-letter jobs...</p>
                    </td>
                  </tr>
                ) : jobs.length > 0 ? (
                  jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4.5 font-bold text-red-600">{job._id.substring(0, 10)}...</td>
                      <td className="px-6 py-4.5 font-extrabold text-gray-800">{job.jobType}</td>
                      <td className="px-6 py-4.5 text-gray-700">{job.recipientReference || 'N/A'}</td>
                      <td className="px-6 py-4.5 text-gray-500">
                        <span className="inline-flex items-center justify-center bg-gray-100 text-gray-700 font-bold px-2 py-0.5 rounded border border-gray-200">
                          {job.attemptCount}
                        </span>
                      </td>
                      <td className="px-6 py-4.5 font-semibold text-gray-500">
                        {new Date(job.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4.5 text-right shrink-0 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(job._id)}
                            className="h-8 px-3 rounded border border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-[11.5px] font-bold text-gray-700 transition-all"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleReplay(job._id)}
                            disabled={isReplaying}
                            className="h-8 px-3 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-[11.5px] font-bold text-red-700 transition-all disabled:opacity-50"
                          >
                            Replay
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-[14px] text-gray-400 font-bold bg-white">
                      The dead-letter queue is empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-[17px] font-extrabold text-red-650 flex items-center gap-2">
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Job Details: {selectedJob._id}
              </h3>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-450 hover:text-gray-700 font-extrabold">✕</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-[13.5px]">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Job Type</span>
                  <span className="font-extrabold text-gray-800">{selectedJob.jobType}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Status</span>
                  <span className="font-extrabold text-red-600 uppercase tracking-wider">{selectedJob.status}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Attempts</span>
                  <span className="font-extrabold text-gray-800">{selectedJob.attemptCount} / {selectedJob.maxAttempts}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Last Updated</span>
                  <span className="font-extrabold text-gray-800">{new Date(selectedJob.updatedAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <span className="block text-[12px] font-bold text-gray-400 uppercase mb-1.5">Last Error</span>
                <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 text-[13px] font-mono break-words whitespace-pre-wrap">
                  {selectedJob.lastErrorMessageSafe || selectedJob.lastError || "No error message recorded."}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="h-11 px-6 border border-gray-200 hover:bg-gray-50 text-[13px] font-bold text-gray-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleReplay(selectedJob._id)}
                disabled={isReplaying}
                className="h-11 px-6 bg-red-600 hover:bg-red-700 text-[13px] font-bold text-white rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M23 4v6h-6M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {isReplaying ? 'Replaying...' : 'Replay Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
