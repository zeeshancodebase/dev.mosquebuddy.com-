// src/lib/auth.js
const TOKEN_KEY = "sabeel_token";
const USER_KEY = "sabeel_user";

export const auth = {
  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
  },

  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    if (typeof window === "undefined") return null;
    try {
      const user = localStorage.getItem(USER_KEY);
      if (!user || user === "undefined") return null;
      return JSON.parse(user);
    } catch {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  hasRole(role) {
    const user = this.getUser();
    if (!user) return false;
    // Support both userRoles and roles structures
    const roles = user.userRoles || user.roles || [];
    return roles.some((r) => {
      const roleName = r.role?.name || r.roleName || r;
      return roleName === role;
    });
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  },
};