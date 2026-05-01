/**
 * Моки для React Native модулей при запуске в web
 */

// @ts-nocheck

// Mock expo modules
if (typeof global !== 'undefined') {
  // SecureStore
  (global as any).expoSecureStore = {
    getItemAsync: async (key: string) => localStorage.getItem(key),
    setItemAsync: async (key: string, value: string) => localStorage.setItem(key, value),
    deleteItemAsync: async (key: string) => localStorage.removeItem(key),
  };

  // Camera
  (global as any).CameraView = () => null;
  (global as any).useCameraPermissions = () => [{ granted: true, canAskAgain: true }, () => {}];

  // Audio
  (global as any).Audio = {
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    setAudioModeAsync: async () => {},
    Recording: {
      createAsync: async () => ({
        recording: {
          stopAndUnloadAsync: async () => {},
          getURI: () => 'mock://audio',
        }
      }),
    }
  };

  // ImageManipulator
  (global as any).ImageManipulator = {
    manipulateAsync: async (uri: string) => ({ uri }),
    SaveFormat: { JPEG: 'jpeg' },
  };

  // Expo location
  (global as any).Location = {
    requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
    getCurrentPositionAsync: async () => ({
      coords: { latitude: 55.7558, longitude: 37.6173 }
    }),
  };

  // FileSystem
  (global as any).FileSystem = {
    documentDirectory: '/mock/',
    cacheDirectory: '/mock/cache/',
    makeDirectoryAsync: async () => {},
    readAsStringAsync: async () => '',
    writeAsStringAsync: async () => {},
    deleteAsync: async () => {},
  };
}

// Mock react-native modules
const mockModule = {
  default: () => null,
  __esModule: true,
};

// SafeAreaContext
// @ts-ignore
window['react-native-safe-area-context'] = {
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
};

console.log('[web-mocks] React Native mocks loaded for web environment');
