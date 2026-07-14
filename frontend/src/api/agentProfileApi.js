import httpClient from './httpClient';

export const agentProfileApi = {
  getProfile: () => {
    return httpClient.get('/agents/profile').then((res) => res.data.data);
  },

  updateProfile: (data) => {
    return httpClient.patch('/agents/profile', data).then((res) => res.data.data);
  },

  uploadProfilePhoto: (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return httpClient.post('/agents/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((res) => res.data.data)
    .catch((err) => {
      console.error("Profile photo upload error:", err.response?.data || err);
      throw err;
    });
  },

  removeProfilePhoto: () => {
    return httpClient.delete('/agents/profile/photo').then((res) => res.data.data);
  },

  getProfilePerformance: () => {
    return httpClient.get('/agents/dashboard/stats').then((res) => res.data.data);
  },
};
