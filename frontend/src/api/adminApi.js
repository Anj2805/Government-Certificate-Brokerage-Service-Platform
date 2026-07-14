import httpClient from './httpClient';

export const adminApi = {
  getDashboardMetrics: () => httpClient.get('/admin/dashboard/metrics').then(res => res.data),
  getAnalytics: (params) => httpClient.get('/admin/analytics', { params }).then(res => res.data),
  globalSearch: (q) => httpClient.get('/admin/search', { params: { q } }).then(res => res.data),
  listUsers: (params) => httpClient.get('/admin/users', { params }).then(res => res.data),
  getUserDetails: (id) => httpClient.get(`/admin/users/${id}`).then(res => res.data),
  listAgents: (params) => httpClient.get('/admin/agents', { params }).then(res => res.data),
  getAgentDetails: (id) => httpClient.get(`/admin/agents/${id}`).then(res => res.data),
  approveAgent: (id) => httpClient.patch(`/admin/agents/${id}/approve`).then(res => res.data),
  rejectAgent: (id, reason) => httpClient.patch(`/admin/agents/${id}/reject`, { reason }).then(res => res.data),
  suspendAgent: (id, reason) => httpClient.patch(`/admin/agents/${id}/suspend`, { reason }).then(res => res.data),
  updateAgentBackground: (id, background) => httpClient.patch(`/admin/agents/${id}/background`, { background }).then(res => res.data),
  updateAgentDepartment: (id, department) => httpClient.patch(`/admin/agents/${id}/department`, { department }).then(res => res.data),
  listRequests: (params) => httpClient.get('/admin/requests', { params }).then(res => res.data),
  getRequestDetails: (id) => httpClient.get(`/admin/requests/${id}`).then(res => res.data),
  assignAgent: (requestId, agentId) => httpClient.post(`/requests/admin/${requestId}/assign`, { agentId }).then(res => res.data),
  reassignAgent: (requestId, agentId) => httpClient.post(`/requests/admin/${requestId}/reassign`, { agentId }).then(res => res.data),
  listDeadLetters: () => httpClient.get('/admin/jobs/dead-letter').then(res => res.data),
  getDeadLetterDetails: (jobId) => httpClient.get(`/admin/jobs/dead-letter/${jobId}`).then(res => res.data),
  replayDeadLetter: (jobId) => httpClient.post(`/admin/jobs/${jobId}/replay`).then(res => res.data),
  downloadDocument: (documentId) => httpClient.get(`/documents/${documentId}/download?json=true`),
  rejectDocument: (documentId, rejectionReason) => httpClient.patch(`/documents/${documentId}/reject`, { rejectionReason }).then(res => res.data),
  requestCorrection: (requestId, reason) => httpClient.post(`/requests/agent/${requestId}/request-correction`, { reason }).then(res => res.data)
};
