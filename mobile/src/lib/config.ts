import Constants from 'expo-constants';

let HOST = 'localhost';

// Automatically detect the host IP address when running in Expo development mode
if (__DEV__ && Constants.expoConfig?.hostUri) {
  HOST = Constants.expoConfig.hostUri.split(':')[0];
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || `http://${HOST}:8000/v1`;
