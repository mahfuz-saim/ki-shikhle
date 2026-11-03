import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({ baseURL, withCredentials: true });

// Attach Authorization and Refresh tokens to outgoing requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const isChildRoute = window.location.pathname.startsWith('/child') || window.location.pathname.startsWith('/kid');
    const childToken = localStorage.getItem('childToken');
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    const token = isChildRoute && childToken ? childToken : accessToken || childToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (refreshToken && !config.headers['x-refresh-token']) {
      config.headers['x-refresh-token'] = refreshToken;
    }
  }
  return config;
});

// Mutex & Queue to avoid race conditions during concurrent 401s
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt token refresh on auth endpoints themselves
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
      // If already in the middle of a token refresh, queue this request
      if (isRefreshing) {
        return new Promise<any>((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken =
          typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

        const refreshRes = await axios.post(
          `${baseURL}/auth/refresh`,
          { refreshToken: storedRefreshToken || undefined },
          {
            withCredentials: true,
            headers: storedRefreshToken ? { 'x-refresh-token': storedRefreshToken } : {},
          }
        );

        const newAccessToken = refreshRes.data?.data?.accessToken;
        const newRefreshToken = refreshRes.data?.data?.refreshToken;

        if (newAccessToken) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
          }

          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          processQueue(new Error('No access token returned'), null);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);

        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          const currentToken = localStorage.getItem('accessToken');
          const isDemoSession =
            currentToken?.startsWith('demo-') ||
            currentToken?.includes('mock') ||
            currentToken?.includes('demo');

          // If this is a demo session, don't wipe it out on network or 401 blips
          if (!isDemoSession) {
            const isPublicPage =
              path === '/' ||
              path.startsWith('/login') ||
              path.startsWith('/register') ||
              path.startsWith('/privacy') ||
              path.startsWith('/terms') ||
              path.startsWith('/pricing');

            if (!isPublicPage) {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('childToken');
              localStorage.removeItem('userRole');
              localStorage.removeItem('active_child_id');
              localStorage.removeItem('activeChild');
              window.location.href = '/login';
            }
          }
        }
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
