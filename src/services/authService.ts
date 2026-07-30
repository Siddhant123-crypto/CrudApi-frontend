import api from './api';

// POST /auth/login  — { email, password }
export const authLogin = async (email: string, password: string) => {
  const response = await api.post('/auth/login', {email, password});
  return response.data; // LoginResponse { message, response: LoginData }
};

// POST /user/login  — { email, password }
export const userLogin = async (email: string, password: string) => {
  const response = await api.post('/user/login', {email, password});
  return response.data;
};

// POST /user/register
export const userRegister = async (formData: FormData) => {
  const response = await api.post('/user/register', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// POST /farmer/save
export const farmerRegister = async (formData: FormData) => {
  const response = await api.post('/farmer/save', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// POST /farmer/login  — { email, password }
export const farmerLogin = async (email: string, password: string) => {
  const response = await api.post('/farmer/login', {email, password});
  return response.data;
};

// POST /newuser/login  — { email, password }
export const newUserLogin = async (email: string, password: string) => {
  const response = await api.post('/newuser/login', {email, password});
  return response.data;
};

// POST /forgotpassword — { email, password, confirmPassword }
export const forgotPassword = async (email: string, password: string, confirmPassword: string) => {
  const response = await api.post('/forgotpassword', {
    email,
    password,
    confirmPassword,
  });
  return response.data;
};
