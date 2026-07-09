import httpClient from './httpClient';

export const adminApi = {
  getDashboardMetrics: () => httpClient.get('/admin/dashboard/metrics').then(res => res.data),
  listAgents: (params) => httpClient.get('/admin/agents', { params }).then(res => res.data),
  approveAgent: (id) => httpClient.patch(`/admin/agents/${id}/approve`).then(res => res.data),
  rejectAgent: (id, reason) => httpClient.patch(`/admin/agents/${id}/reject`, { reason }).then(res => res.data),
  suspendAgent: (id, reason) => httpClient.patch(`/admin/agents/${id}/suspend`, { reason }).then(res => res.data),
  listRequests: (params) => httpClient.get('/admin/requests', { params }).then(res => res.data),
  getRequestDetails: (id) => httpClient.get(`/admin/requests/${id}`).then(res => res.data),
  assignAgent: (requestId, agentId) => httpClient.post(`/requests/admin/${requestId}/assign`, { agentId }).then(res => res.data),
  reassignAgent: (requestId, agentId) => httpClient.post(`/requests/admin/${requestId}/reassign`, { agentId }).then(res => res.data),
  listDeadLetters: () => httpClient.get('/admin/jobs/dead-letter').then(res => res.data),
  getDeadLetterDetails: (jobId) => httpClient.get(`/admin/jobs/dead-letter/${jobId}`).then(res => res.data),
  replayDeadLetter: (jobId) => httpClient.post(`/admin/jobs/${jobId}/replay`).then(res => res.data)
};
