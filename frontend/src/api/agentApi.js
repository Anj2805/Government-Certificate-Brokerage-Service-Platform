import httpClient from './httpClient';

export const agentApi = {
  async getDashboardStats() {
    const { data } = await httpClient.get('/agents/dashboard/stats');
    return data.data.stats;
  },
  async listAssignedRequests(params = {}) {
    const { data } = await httpClient.get('/agents/requests', { params });
    return data;
  },
  async getRequestDetails(id) {
    const { data } = await httpClient.get(`/agents/requests/${id}`);
    return data.data.request;
  },
  async updateProgress(id, payload) {
    const { data } = await httpClient.patch(`/agents/requests/${id}/progress`, payload);
    return data.data.request;
  },
  async uploadAdditionalDocument(id, formData) {
    // Note: formData should contain 'document' file and payload like 'title', 'documentType'
    const { data } = await httpClient.post(`/agents/requests/${id}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.data.document;
  },
  async dispatchDelivery(id) {
    const { data } = await httpClient.post(`/requests/agent/${id}/dispatch`);
    return data.data.request;
  },
  verifyDelivery(id, payload) {
    return httpClient.post(`/requests/agent/${id}/verify-delivery`, payload).then(res => res.data.data.request);
  },
  downloadDocument: (documentId) => httpClient.get(`/documents/${documentId}/download?json=true`),
  rejectDocument: (documentId, rejectionReason) => httpClient.patch(`/documents/${documentId}/reject`, { rejectionReason }).then(res => res.data),
  acceptDocument: (documentId) => httpClient.patch(`/documents/${documentId}/accept`).then(res => res.data),
  requestCorrection: (requestId, reason) => httpClient.post(`/requests/agent/${requestId}/request-correction`, { reason }).then(res => res.data)
};
