import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // If on a /kid route, prefer childToken if present
    const isKidRoute = window.location.pathname.startsWith('/kid');
    const childToken = localStorage.getItem('childToken');
    const accessToken = localStorage.getItem('accessToken');

    const token = (isKidRoute && childToken) ? childToken : (accessToken || childToken);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        const refresh = await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = refresh.data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem('accessToken', newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        }
      } catch {
        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (path !== '/' && !path.startsWith('/login') && !path.startsWith('/register') && !path.startsWith('/privacy') && !path.startsWith('/terms')) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('childToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('active_child_id');
            localStorage.removeItem('activeChild');
            window.location.href = '/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
