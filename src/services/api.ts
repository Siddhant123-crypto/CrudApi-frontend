import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://172.16.20.156:8080';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('userToken');

    console.log('=================================');
    console.log('API REQUEST');
    console.log('METHOD:', config.method);
    console.log('URL:', `${config.baseURL}${config.url}`);
    console.log('TOKEN:', token ? 'YES' : 'NO');

    if (token) {
      console.log('TOKEN LENGTH:', token.length);

      if (config.headers) {
        config.headers.set(
          'Authorization',
          `Bearer ${token}`,
        );
      }
    }

    return config;
  },
  error => {
    console.log('REQUEST INTERCEPTOR ERROR:', error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  response => {
    console.log('=================================');
    console.log('API RESPONSE');
    console.log('STATUS:', response.status);
    console.log('URL:', response.config.url);

    return response;
  },
  error => {
    console.log('=================================');
    console.log('API ERROR');

    console.log(
      'MESSAGE:',
      error?.message,
    );

    console.log(
      'CODE:',
      error?.code,
    );

    console.log(
      'URL:',
      error?.config?.url,
    );

    console.log(
      'BASE URL:',
      error?.config?.baseURL,
    );

    console.log(
      'STATUS:',
      error?.response?.status,
    );

    console.log(
      'DATA:',
      error?.response?.data,
    );

    return Promise.reject(error);
  },
);

export { BASE_URL };

export default api;