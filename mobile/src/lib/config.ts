import Constants from 'expo-constants';

// In production builds, always use the deployed backend.
// In dev mode, auto-detect the local dev machine IP so physical devices can reach it.
let devUrl = 'https://wakanda-backend.onrender.com/v1';

if (__DEV__ && Constants.expoConfig?.hostUri) {
  const HOST = Constants.expoConfig.hostUri.split(':')[0];
  devUrl = `http://${HOST}:8000/v1`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || devUrl;
