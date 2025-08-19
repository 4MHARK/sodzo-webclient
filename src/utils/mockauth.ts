import { mockUser } from "../data/mockData";
import { User } from "../types/index";

// Mock login that returns a promise
export function loginMock(
  setUser: (user: User | null) => void,
  setToken: (token: string | null) => void
): Promise<{ user: User; token: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      setUser(mockUser);
      setToken("mock-token-123");
      resolve({ user: mockUser, token: "mock-token-123" });
    }, 500); // half second delay
  });
}

// Mock logout that returns a promise
export function logoutMock(
  setUser: (user: User | null) => void,
  setToken: (token: string | null) => void
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      setUser(null);
      setToken(null);
      resolve();
    }, 500);
  });
}
