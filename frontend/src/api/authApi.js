import httpClient from './httpClient';

export const authApi = {
  async login(payload) {
    const { data } = await httpClient.post('/auth/login', payload);
    return data.data;
  },
  async register(payload) {
    const { data } = await httpClient.post('/auth/register', payload);
    return data.data;
  },
  async getCurrentUser() {
    const { data } = await httpClient.get('/auth/me');
    return data.data.user;
  },
  async logout() {
    const { data } = await httpClient.post('/auth/logout');
    return data;
  },
  async changePassword(payload) {
    const { data } = await httpClient.post('/auth/change-password', payload);
    return data;
  },
  async forgotPassword(payload) {
    const { data } = await httpClient.post('/auth/forgot-password', payload);
    return data;
  },
  async resetPassword(payload) {
    const { data } = await httpClient.post('/auth/reset-password', payload);
    return data;
  },
  async verifyEmail(payload) {
    const { data } = await httpClient.post('/auth/verify-email', payload);
    return data;
  },
  async resendVerification(payload) {
    const { data } = await httpClient.post('/auth/resend-verification', payload);
    return data;
  },
};
