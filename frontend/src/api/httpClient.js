import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const httpClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const url = originalRequest.url || '';

      if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return httpClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearSession();
        window.dispatchEvent(new Event('auth-logout'));
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${apiBaseUrl}/auth/refresh-token`, { refreshToken });
        const { data } = response.data;

        tokenStorage.setSession(data);
        const newAccessToken = data.tokens.accessToken;

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        isRefreshing = false;

        return httpClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        tokenStorage.clearSession();
        window.dispatchEvent(new Event('auth-logout'));
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 401) {
      tokenStorage.clearSession();
      window.dispatchEvent(new Event('auth-logout'));
    }

    return Promise.reject(error);
  },
);

export default httpClient;
