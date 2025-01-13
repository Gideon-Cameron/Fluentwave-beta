import axios from 'axios';

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: 'https://fluentwave-backend-beta.onrender.com/api',
  withCredentials: true,  // Include cookies (refresh token)
});

// Request Interceptor (Attach Access Token to Headers)
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor (Handle Expired Access Token)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and not already retried
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const refreshResponse = await axios.post(
          '/users/refresh',
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.accessToken;

        // Store new access token
        localStorage.setItem('accessToken', newAccessToken);
        
        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError);
        localStorage.removeItem('accessToken');  // Clear token on failure
        window.location.href = '/login';  // Redirect to login
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
