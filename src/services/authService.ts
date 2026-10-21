import api from './api';
export const authLogin = async (email: string, password: string) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  return response.data;
};
export const adminLogin = async (email: string, password: string) => {
  const response = await api.post('/admin/auth/login', {
    email,
    password,
  });
  return response.data;
};
export const userLogin = async (email: string, password: string) => {
  const response = await api.post('/user/login', {
    email,
    password,
  });
  return response.data;
};
export const userRegister = async (formData: FormData) => {
  console.log('USER REGISTER API CALL');
  const response = await api.post(
    '/user/register',
    formData,
  );
  console.log(
    'USER REGISTER RESPONSE:',
    response.data,
  );
  return response.data;
};
export const farmerRegister = async (formData: FormData) => {
  const response = await api.post('/farmer/save', formData);
  return response.data;
};
export const farmerLogin = async (email: string, password: string) => {
  const response = await api.post('/farmer/login', {
    email,
    password,
  });
  return response.data;
};
export const newUserLogin = async (email: string, password: string) => {
  const response = await api.post('/newuser/login', {
    email,
    password,
  });
  return response.data;
};
export const forgotPassword = async (email: string) => {
  const response = await api.post('/user/forgot-password', {
    email,
  });
  return response.data;
};

export const resetPassword = async (token: string, newPassword: string) => {
  const response = await api.post('/user/reset-password', {
    token,
    newPassword,
  });
  return response.data;
};
export const checkUser = async (identifier: string) => {
  const response = await api.post('/auth/check-user', {
    identifier,
  });
  return response.data;
};
export const googleLogin = async (idToken: string) => {
  const response = await api.post('/auth/google', {
    idToken,
  });
  return response.data;
};
