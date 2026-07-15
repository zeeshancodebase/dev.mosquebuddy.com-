
// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(true); // default true to avoid flash; corrected after check

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const savedUser = await auth.getUser();
      const token = await auth.getToken();
      const seenWelcome = await auth.hasSeenWelcome();

      if (savedUser && token) {
        setUser(savedUser);
        setIsLoggedIn(true);
      }
      setHasSeenWelcome(seenWelcome);
    } catch (error) {
      console.log("Session check error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(token, userData) {
    await auth.setSession(token, userData);
    await auth.markWelcomeSeen();
    setUser(userData);
    setIsLoggedIn(true);
    setHasSeenWelcome(true);
  }

  async function logout() {
    await auth.clearSession();
    setUser(null);
    setIsLoggedIn(false);
    // hasSeenWelcome stays true — don't show the welcome screen again after a logout
  }

  async function skipAuth() {
    await auth.markWelcomeSeen();
    setHasSeenWelcome(true);
  }

  function hasRole(roleName) {
    if (!user || !user.userRoles) return false;
    return user.userRoles.some((ur) => ur.role?.name === roleName);
  }

  function isSuperAdmin() {
    return hasRole("super_admin");
  }

  function isMosqueAdmin() {
    return hasRole("mosque_admin");
  }

  function isVolunteer() {
    return hasRole("trusted_volunteer");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        hasSeenWelcome,
        login,
        logout,
        skipAuth,
        hasRole,
        isSuperAdmin,
        isMosqueAdmin,
        isVolunteer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}


// below code is perfect for a normal login flow above code allows skip login button
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { auth } from "../lib/auth";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     checkSession();
//   }, []);

//   async function checkSession() {
//     try {
//       const savedUser = await auth.getUser();
//       const token = await auth.getToken();

//       if (savedUser && token) {
//         setUser(savedUser);
//         setIsLoggedIn(true);
//       }
//     } catch (error) {
//       console.log("Session check error:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   }

//   async function login(token, userData) {
//     await auth.setSession(token, userData);
//     setUser(userData);
//     setIsLoggedIn(true);
//   }

//   async function logout() {
//     await auth.clearSession();
//     setUser(null);
//     setIsLoggedIn(false);
//   }

//   function hasRole(roleName) {
//     if (!user || !user.userRoles) return false;
//     return user.userRoles.some((ur) => ur.role?.name === roleName);
//   }

//   function isSuperAdmin() {
//     return hasRole("super_admin");
//   }

//   function isMosqueAdmin() {
//     return hasRole("mosque_admin");
//   }

//   function isVolunteer() {
//     return hasRole("trusted_volunteer");
//   }

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         isLoggedIn,
//         isLoading,
//         login,
//         logout,
//         hasRole,
//         isSuperAdmin,
//         isMosqueAdmin,
//         isVolunteer,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used inside AuthProvider");
//   }
//   return context;
// }