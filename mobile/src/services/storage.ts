const isWeb = typeof window !== 'undefined' && window.localStorage;

interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

let adapter: StorageAdapter;

if (isWeb) {
  adapter = {
    async getItem(key: string) {
      return localStorage.getItem(key);
    },
    async setItem(key: string, value: string) {
      localStorage.setItem(key, value);
    },
    async removeItem(key: string) {
      localStorage.removeItem(key);
    },
  };
} else {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  adapter = {
    getItem: AsyncStorage.getItem.bind(AsyncStorage),
    setItem: AsyncStorage.setItem.bind(AsyncStorage),
    removeItem: AsyncStorage.removeItem.bind(AsyncStorage),
  };
}

export const storage = adapter;
