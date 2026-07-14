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
  async uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await httpClient.post('/users/me/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return data.data.user;
  },
  async removeProfilePhoto() {
    const { data } = await httpClient.delete('/users/me/profile/photo');
    return data.data.user;
  },
  async uploadIdProof(payload, file) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('idProofType', payload.idProofType);
    const { data } = await httpClient.post('/users/me/id-proof', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data.user;
  },
  async verifyIdProof(userId, payload) {
    const { data } = await httpClient.patch(`/users/${userId}/id-proof-status`, payload);
    return data.data.user;
  },
};
