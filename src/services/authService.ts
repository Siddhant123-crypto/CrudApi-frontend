import api from './api';

// POST /auth/login
export const authLogin = async (email: string, password: string) => {
  const response = await api.post('/auth/login', {
    email,
    password,
  });

  return response.data;
};

// POST /admin/login
export const adminLogin = async (email: string, password: string) => {
  const response = await api.post('/admin/login', {
    email,
    password,
  });

  return response.data;
};

// POST /user/login
export const userLogin = async (email: string, password: string) => {
  const response = await api.post('/user/login', {
    email,
    password,
  });

  return response.data;
};

// POST /user/register
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
// POST /farmer/save
export const farmerRegister = async (formData: FormData) => {
  const response = await api.post('/farmer/save', formData);

  return response.data;
};

// POST /farmer/login
export const farmerLogin = async (email: string, password: string) => {
  const response = await api.post('/farmer/login', {
    email,
    password,
  });

  return response.data;
};

// POST /newuser/login
export const newUserLogin = async (email: string, password: string) => {
  const response = await api.post('/newuser/login', {
    email,
    password,
  });

  return response.data;
};

// POST /forgotpassword
export const forgotPassword = async (
  email: string,
  password: string,
  confirmPassword: string,
) => {
  const response = await api.post('/forgotpassword', {
    email,
    password,
    confirmPassword,
  });

  return response.data;
};

// POST /auth/check-user
export const checkUser = async (identifier: string) => {
  const response = await api.post('/auth/check-user', {
    identifier,
  });

  return response.data;
};

// POST /auth/google
export const googleLogin = async (idToken: string) => {
  const response = await api.post('/auth/google', {
    idToken,
  });

  return response.data;
};