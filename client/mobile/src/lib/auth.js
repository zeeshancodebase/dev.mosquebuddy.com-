// src/lib/auth.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "sabeel_token";
const USER_KEY = "sabeel_user";
const WELCOME_SEEN_KEY = "sabeel_welcome_seen";

export const auth = {
  async setSession(token, user) {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async getToken() {
    return await AsyncStorage.getItem(TOKEN_KEY);
  },

  async getUser() {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  async clearSession() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },

  async isLoggedIn() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },

  // ── Welcome / first-launch tracking ──
  // Tracks whether the user has ever seen the Login/Register
  // welcome screen, independent of whether they're logged in.
  // This lets a guest who skipped not get nagged again on next app open.
  async hasSeenWelcome() {
    const value = await AsyncStorage.getItem(WELCOME_SEEN_KEY);
    return value === "true";
  },

  async markWelcomeSeen() {
    await AsyncStorage.setItem(WELCOME_SEEN_KEY, "true");
  },
};


// below is normal code without welcome screen tracking and above code is with welcome screen tracking and skip option for login
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const TOKEN_KEY = "sabeel_token";
// const USER_KEY = "sabeel_user";

// export const auth = {
//   async setSession(token, user) {
//     await AsyncStorage.setItem(TOKEN_KEY, token);
//     await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
//   },

//   async getToken() {
//     return await AsyncStorage.getItem(TOKEN_KEY);
//   },

//   async getUser() {
//     const user = await AsyncStorage.getItem(USER_KEY);
//     return user ? JSON.parse(user) : null;
//   },

//   async clearSession() {
//     await AsyncStorage.removeItem(TOKEN_KEY);
//     await AsyncStorage.removeItem(USER_KEY);
//   },

//   async isLoggedIn() {
//     const token = await AsyncStorage.getItem(TOKEN_KEY);
//     return !!token;
//   },
// };
