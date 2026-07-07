import httpClient from './httpClient';

export const userApi = {
  async getMyProfile() {
    const { data } = await httpClient.get('/users/me/profile');
    return data.data.user;
  },
  async updateMyProfile(payload) {
    const { data } = await httpClient.patch('/users/me/profile', payload);
    return data.data.user;
  },
};
