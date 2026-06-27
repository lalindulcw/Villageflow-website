import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';

import { API_BASE } from './config';

// Global Axios Request Interceptor to automatically attach JWT authorization headers
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Set custom request header to protect cookie sessions from CSRF
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global Axios Response Interceptor to handle silent token refresh on 401 Unauthorized
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Skip refresh loop for the refresh endpoint itself
    if (originalRequest.url && originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Check if error is 401 (Unauthorized) and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        console.log('🔄 Access token expired. Attempting silent token refresh...');
        const res = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        
        if (res.status === 200 && res.data.token) {
          const newToken = res.data.token;
          localStorage.setItem('token', newToken);
          console.log('✅ Token refreshed successfully. Retrying request.');
          
          // Update the authorization header on the original request and retry
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          originalRequest.withCredentials = true;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed. Logging out user.', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
