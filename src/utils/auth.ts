import axios from "axios";
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {User} from '../contexts/UserContext';
import toast from "react-hot-toast";


// const API_URL = import.meta.env.VITE_API_URL;

export async function login(email: string, password: string, setUser: (user: User | null) => void,
  setToken: (token: string | null) => void) {
  const res = await axios.post(`http://10.17.1.248:4000/v1/auth/login`, { email, password });

  // Set user and token in context (and localStorage)
  setUser(res.data.user);
  setToken(res.data.tokens.access.token);

  return res.data;
}

export const useLogout = () => {
  const { setUser } = useUser();
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    setUser(null);
    setToken(null);
    toast.success("Logged out successfully");
    navigate('/landing'); // redirect to landing page
  };

  return logout;
};