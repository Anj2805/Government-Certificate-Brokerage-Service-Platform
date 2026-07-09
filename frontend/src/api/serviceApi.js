import httpClient from './httpClient';

export const serviceApi = {
  async listServices(params = {}) {
    const { data } = await httpClient.get('/services', { params });
    return data;
  },
  async getServiceDetails(id) {
    const { data } = await httpClient.get(`/services/${id}`);
    return data.data?.service || data.data;
  },
  async createService(payload) {
    const { data } = await httpClient.post('/services', payload);
    return data;
  },
  async updateService(id, payload) {
    const { data } = await httpClient.patch(`/services/${id}`, payload);
    return data;
  },
  async setActiveStatus(id, isActive) {
    const { data } = await httpClient.patch(`/services/${id}/status`, { isActive });
    return data;
  },
  async deleteService(id) {
    const { data } = await httpClient.delete(`/services/${id}`);
    return data;
  }
};
