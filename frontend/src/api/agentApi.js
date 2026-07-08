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
};
