import axios from 'axios';

// La URL de tu backend (FastAPI)
const API_URL = 'http://127.0.0.1:8000/api';

// Crear una instancia de Axios configurada
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- FUNCIONES DE SERVICIO ---
// 1. Login ahora usa username
export const loginUser = async (username, password) => {
  // Enviamos { username, password } al backend
  const response = await api.post('/login', { username, password });
  return response.data;
};

// 2. Este ya lo tenías, pero verificamos que esté así:
export const registerUser = async (userData) => {
  // userData debe ser { username, email, password }
  const response = await api.post('/users/', userData);
  return response.data;
};

export const createChild = async (userId, childData) => {
  const response = await api.post(`/users/${userId}/children/`, childData);
  return response.data;
};

// 2. Dashboard
export const getChildDashboard = async (childId) => {
  const response = await api.get(`/children/${childId}/dashboard`);
  return response.data;
};

// 3. Juego e IA
export const sendGameResults = async (gameData) => {
  const response = await api.post('/analyze', gameData);
  return response.data;
};

export const getUserChildren = async (userId) => {
  const response = await api.get(`/users/${userId}/children`);
  return response.data;
};

export default api;