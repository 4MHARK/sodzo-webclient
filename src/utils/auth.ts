import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export async function login(email: string, password: string) {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  // Save the access token from the correct path
  localStorage.setItem("token", res.data.tokens.access.token);
  // Optionally, save refresh token or user info if needed
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
}