export const BASE_URL = process.env.REACT_APP_BASE_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://villageflow.onrender.com');

export const API_BASE = `${BASE_URL}/api`;

