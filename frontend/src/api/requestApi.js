import httpClient from './httpClient';

export const requestApi = {
  async createRequest(payload) {
    const { data } = await httpClient.post('/requests', payload);
    return data.data.request;
  },
  async submitRequest(id, payload = {}) {
    const { data } = await httpClient.patch(`/requests/${id}/submit`, payload);
    return data.data.request;
  },
  async listOwnRequests(params = {}) {
    const { data } = await httpClient.get('/requests/my', { params });
    return data;
  },
  async getRequestDetails(id) {
    const { data } = await httpClient.get(`/requests/${id}`);
    return data.data.request;
  },
  async cancelRequest(id, payload = {}) {
    const { data } = await httpClient.patch(`/requests/${id}/cancel`, payload);
    return data.data.request;
  },
  async getRequestsSummary() {
    const { data } = await httpClient.get('/requests/my/summary');
    return data.data;
  },
  async attachDocument(id, documentId) {
    const { data } = await httpClient.post(`/requests/${id}/documents`, { documentId });
    return data.data.request;
  },
};
