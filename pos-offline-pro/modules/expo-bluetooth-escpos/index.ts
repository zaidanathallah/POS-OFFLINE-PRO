import { requireNativeModule, Platform } from "expo-modules-core";

export interface NativeBluetoothDevice {
  id: string;
  name: string;
  address: string;
  connected: boolean;
  rssi?: number;
  signalLevel?: number;
  distanceEstimate?: string;
}

let nativeModule: any = null;
try {
  if (Platform.OS === "android") {
    nativeModule = requireNativeModule("ExpoBluetoothEscpos");
  }
} catch (e) {
  console.log("ExpoBluetoothEscpos native module note:", e);
}

export const ExpoBluetoothEscpos = {
  isAvailable: (): boolean => {
    return nativeModule !== null;
  },

  isBluetoothAvailable: async (): Promise<boolean> => {
    if (!nativeModule) return false;
    try {
      return await nativeModule.isBluetoothAvailable();
    } catch {
      return false;
    }
  },

  getPairedDevices: async (): Promise<NativeBluetoothDevice[]> => {
    if (!nativeModule) return [];
    try {
      return await nativeModule.getPairedDevices();
    } catch {
      return [];
    }
  },

  connect: async (address: string): Promise<boolean> => {
    if (!nativeModule) return false;
    try {
      return await nativeModule.connect(address);
    } catch {
      return false;
    }
  },

  disconnect: async (): Promise<boolean> => {
    if (!nativeModule) return true;
    try {
      return await nativeModule.disconnect();
    } catch {
      return false;
    }
  },

  isConnected: async (): Promise<boolean> => {
    if (!nativeModule) return false;
    try {
      return await nativeModule.isConnected();
    } catch {
      return false;
    }
  },

  printRawBase64: async (base64Data: string, address?: string): Promise<boolean> => {
    if (!nativeModule) return false;
    try {
      return await nativeModule.printRawBase64(base64Data, address || null);
    } catch {
      return false;
    }
  },

  convertImageToRasterBase64: async (imageBase64OrUri: string): Promise<string> => {
    if (!nativeModule || !nativeModule.convertImageToRasterBase64) return "";
    try {
      return await nativeModule.convertImageToRasterBase64(imageBase64OrUri);
    } catch {
      return "";
    }
  },
};
