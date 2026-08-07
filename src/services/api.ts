import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Change this to your machine's local IP when testing on a physical device ──
// For Android emulator use 10.0.2.2, for iOS simulator use localhost
const BASE_URL = 'http://172.16.22.86:8080';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});
// Request interceptor — attach token if available
api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);
// Response interceptor — global error handling
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    console.log("Status:", error.response?.status);
    console.log("Error:", error.response?.data);

    return Promise.reject(error);
  }
);
export { BASE_URL };
export default api;
