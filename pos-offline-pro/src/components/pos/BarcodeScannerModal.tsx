import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  Zap,
  Keyboard as KeyboardIcon,
  X,
  Camera as CameraIcon,
  Check,
} from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerModal({
  visible,
  onClose,
  onScan,
}: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);
  const [flashlight, setFlashlight] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(true);

  useEffect(() => {
    if (visible) {
      setIsScanningActive(true);
      setFlashlight(false);
      setIsManualInput(false);
      setManualCode("");
      if (!permission?.granted) {
        requestPermission();
      }
    }
  }, [visible]);

  const handleBarcodeScannedResult = (result: { data: string; type?: string }) => {
    if (!isScanningActive || !result?.data) return;

    const code = result.data.trim();
    if (!code) return;

    // Throttle / Debounce
    setIsScanningActive(false);

    // Provide feedback and trigger onScan
    onScan(code);
  };

  const handleConfirmManual = () => {
    if (!manualCode.trim()) {
      Alert.alert("Perhatian", "Masukkan kode barcode terlebih dahulu.");
      return;
    }
    const code = manualCode.trim();
    setManualCode("");
    setIsManualInput(false);
    onScan(code);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Scan Barcode Produk</Text>
              <Text style={styles.subtitle}>
                Support Barcode Toko & Produk Supermarket / FMCG
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Scanner Viewfinder Box */}
          <View style={styles.scannerBox}>
            {isManualInput ? (
              <View style={styles.manualContainer}>
                <Text style={styles.manualLabel}>
                  Ketik Barcode / SKU Produk (8 - 13 Digit)
                </Text>
                <TextInput
                  value={manualCode}
                  onChangeText={setManualCode}
                  placeholder="8998866200224..."
                  placeholderTextColor="#71717a"
                  style={styles.manualInput}
                  autoFocus
                  keyboardType="numeric"
                  onSubmitEditing={handleConfirmManual}
                />
                <TouchableOpacity
                  onPress={handleConfirmManual}
                  style={styles.manualConfirmBtn}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.manualConfirmBtnText}>Gunakan Barcode Ini</Text>
                </TouchableOpacity>
              </View>
            ) : !permission ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#0097A7" />
                <Text style={styles.infoText}>Menyiapkan kamera...</Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.centerContainer}>
                <CameraIcon size={44} color="#a1a1aa" />
                <Text style={styles.permText}>Izin Kamera Diperlukan</Text>
                <Text style={styles.permSubtext}>
                  Aktifkan kamera untuk scan barcode produk secara instan.
                </Text>
                <TouchableOpacity
                  onPress={requestPermission}
                  style={styles.permButton}
                >
                  <Text style={styles.permButtonText}>Izinkan Kamera</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraWrapper}>
                <CameraView
                  facing="back"
                  enableTorch={flashlight}
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      "qr",
                      "ean13",
                      "ean8",
                      "upc_a",
                      "upc_e",
                      "code128",
                      "code39",
                      "code93",
                      "itf14",
                      "codabar",
                      "pdf417",
                      "aztec",
                      "datamatrix",
                    ],
                  }}
                  onBarcodeScanned={isScanningActive ? handleBarcodeScannedResult : undefined}
                  style={StyleSheet.absoluteFill}
                />

                {/* Laser guide & Target overlay */}
                <View style={styles.targetFrame}>
                  <View style={styles.laserLine} />
                  {/* Corner marks */}
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>

                <View style={styles.hintContainer}>
                  <Text style={styles.hintText}>
                    Arahkan kotak kamera ke barcode produk
                  </Text>
                </View>
              </View>
            )}
          </View>



          {/* Bottom Action Buttons */}
          <View style={styles.bottomBar}>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                onPress={() => setFlashlight(!flashlight)}
                activeOpacity={0.7}
                style={[
                  styles.bottomButton,
                  flashlight && {
                    backgroundColor: "rgba(245, 158, 11, 0.2)",
                    borderColor: "#f59e0b",
                  },
                ]}
              >
                <Zap size={14} color={flashlight ? "#f59e0b" : "#a1a1aa"} />
                <Text
                  style={[
                    styles.bottomButtonText,
                    flashlight && { color: "#f59e0b" },
                  ]}
                >
                  Senter
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsManualInput(!isManualInput)}
                activeOpacity={0.7}
                style={[
                  styles.bottomButton,
                  isManualInput && {
                    backgroundColor: "#0097A7",
                    borderColor: "#0097A7",
                  },
                ]}
              >
                <KeyboardIcon size={14} color={isManualInput ? "#ffffff" : "#a1a1aa"} />
                <Text
                  style={[
                    styles.bottomButtonText,
                    isManualInput && { color: "#ffffff" },
                  ]}
                >
                  {isManualInput ? "Kamera" : "Ketik Barcode"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={styles.closeActionBtn}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#ffffff" }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#18181b",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#27272a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 11,
    color: "#a1a1aa",
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  scannerBox: {
    height: 240,
    backgroundColor: "#09090b",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cameraWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  targetFrame: {
    width: 220,
    height: 120,
    borderWidth: 1,
    borderColor: "rgba(0, 151, 167, 0.4)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  laserLine: {
    width: "100%",
    height: 2,
    backgroundColor: "#0097A7",
    shadowColor: "#0097A7",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  corner: {
    position: "absolute",
    width: 16,
    height: 16,
    borderColor: "#0097A7",
  },
  topLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  hintContainer: {
    position: "absolute",
    bottom: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hintText: {
    fontSize: 11,
    color: "#e4e4e7",
  },
  centerContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: {
    fontSize: 12,
    color: "#a1a1aa",
    marginTop: 8,
  },
  permText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 8,
  },
  permSubtext: {
    fontSize: 11,
    color: "#a1a1aa",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  permButton: {
    backgroundColor: "#0097A7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  permButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  manualContainer: {
    padding: 16,
    width: "100%",
    alignItems: "center",
  },
  manualLabel: {
    fontSize: 12,
    color: "#a1a1aa",
    marginBottom: 8,
  },
  manualInput: {
    width: "100%",
    backgroundColor: "#27272a",
    color: "#ffffff",
    fontFamily: "monospace",
    textAlign: "center",
    fontSize: 16,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3f3f46",
    marginBottom: 10,
  },
  manualConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0097A7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    width: "100%",
  },
  manualConfirmBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    marginLeft: 6,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  bottomButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "#3f3f46",
  },
  bottomButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d4d4d8",
    marginLeft: 6,
  },
  closeActionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "#3f3f46",
    alignItems: "center",
    justifyContent: "center",
  },
});
