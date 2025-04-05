import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

export const allocateMemory = async (
  pid: string,
  size: number,
  strategy: string
) => {
  const response = await API.post('/allocate', {
    pid,
    size,
    strategy
  });
  return response.data;
};

// Deallocate memory
export const deallocateMemory = async (pid: string) => {
  const response = await API.delete(`/deallocate/${pid}`);
  return response.data;
};

export const suggestStrategy = async (size: number) => {
  const response = await API.post(`/suggest-strategy?size=${size}`);
  return response.data;
};
