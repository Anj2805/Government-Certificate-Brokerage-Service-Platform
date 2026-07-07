import httpClient from './httpClient';

export const serviceApi = {
  async listServices(params = {}) {
    const { data } = await httpClient.get('/services', { params });
    return data;
  },
  async getServiceDetails(id) {
    const { data } = await httpClient.get(`/services/${id}`);
    return data.data.service;
  },
};
