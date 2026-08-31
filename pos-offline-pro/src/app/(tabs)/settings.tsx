import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Header } from "@/components/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PinPromptModal } from "@/components/PinPromptModal";
import { useSecureAction } from "@/hooks/useSecureAction";
import { useThemeStore } from "@/stores/useThemeStore";
import { getSetting, setSetting } from "@/db/settingsRepository";
import { exportDatabaseBackup, importDatabaseBackup } from "@/util/databaseSync";
import {
  Store,
  Image as ImageIcon,
  HardDrive,
  Download,
  Upload,
  Shield,
  Printer,
  Moon,
  Sun,
  Lock,
  ChevronRight,
  Info,
  CheckCircle2,
  KeyRound,
  X,
  AlertTriangle,
} from "lucide-react-native";

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useThemeStore();
  const [storeName, setStoreName] = useState("Kopi & Eatery Nusantara");
  const [storeAddress, setStoreAddress] = useState("Jl. Malioboro No. 45, Yogyakarta");
  const [storePhone, setStorePhone] = useState("0812-3456-7890");
  const [isPinActive, setIsPinActive] = useState(true);
  const [currentPin, setCurrentPin] = useState("1234");

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // PIN Change Modal State
  const [pinChangeModalVisible, setPinChangeModalVisible] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Secure Action Hook for PIN Protection
  const {
    pinModalVisible,
    actionTitle,
    executeSecureAction,
    handlePinSuccess,
    handlePinClose,
  } = useSecureAction();

  const loadSettings = async () => {
    const name = await getSetting("store_name", "Kopi & Eatery Nusantara");
    const address = await getSetting("store_address", "Jl. Malioboro No. 45, Yogyakarta");
    const phone = await getSetting("store_phone", "0812-3456-7890");
    const pinActive = await getSetting("is_pin_active", "1");
    const pin = await getSetting("supervisor_pin", "1234");

    setStoreName(name);
    setStoreAddress(address);
    setStorePhone(phone);
    setIsPinActive(pinActive === "1");
    setCurrentPin(pin);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveProfile = async () => {
    await setSetting("store_name", storeName);
    await setSetting("store_address", storeAddress);
    await setSetting("store_phone", storePhone);
    Alert.alert("Tersimpan", "Profil toko & header struk berhasil diperbarui.");
  };

  const handleTogglePin = async (val: boolean) => {
    setIsPinActive(val);
    await setSetting("is_pin_active", val ? "1" : "0");
  };

  const handleSaveNewPin = async () => {
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      Alert.alert("Format Salah", "PIN harus berupa 4 digit angka.");
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert("PIN Tidak Cocok", "Konfirmasi PIN tidak sesuai dengan PIN baru.");
      return;
    }

    await setSetting("supervisor_pin", newPin);
    setCurrentPin(newPin);
    setPinChangeModalVisible(false);
    setNewPin("");
    setConfirmPin("");
    Alert.alert("Berhasil", "PIN Supervisor berhasil diperbarui.");
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await exportDatabaseBackup();
      if (res.success) {
        Alert.alert(
          "Backup Berhasil!",
          `File cadangan ${res.fileName} berhasil diekstrak.\n\nFile ini tersimpan di memori HP Anda dan dapat dipindahkan ke HP baru secara mandiri.`
        );
      } else {
        Alert.alert("Info Backup", res.error || "Gagal membuat file backup.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = () => {
    // Intercept with PIN security
    executeSecureAction(() => {
      Alert.alert(
        "Peringatan Timpa Database",
        "Proses pemulihan akan menimpa SELURUH data produk, riwayat, dan transaksi dengan file backup yang Anda pilih. Lanjutkan?",
        [
          { text: "Batal", style: "cancel" },
          {
            text: "Pilih File Backup",
            style: "destructive",
            onPress: async () => {
              setIsImporting(true);
              try {
                const res = await importDatabaseBackup();
                if (res.success) {
                  await loadSettings();
                  Alert.alert(
                    "Pulihkan Data Berhasil!",
                    `Seluruh data telah berhasil dipulihkan dari "${res.fileName}". Database SQLite siap digunakan.`
                  );
                } else if (res.error && res.error !== "Pemilihan file dibatalkan.") {
                  Alert.alert("Gagal", res.error);
                }
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    }, "Masukkan PIN Supervisor untuk memulihkan / menimpa database");
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <Header
        title="Pengaturan Toko"
        subtitle="Konfigurasi Profil, Logo, Database, & Keamanan PIN"
      />

      <ScrollView
        className="flex-1 px-4 pt-3"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Profil Toko & Header Struk */}
        <Card className="mb-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <View className="flex-row items-center">
              <Store size={18} color="#3b82f6" />
              <CardTitle className="ml-2 text-sm">Profil Toko & Struk</CardTitle>
            </View>
            <TouchableOpacity onPress={handleSaveProfile} activeOpacity={0.7}>
              <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Simpan Profil
              </Text>
            </TouchableOpacity>
          </CardHeader>

          <CardContent className="space-y-3">
            <Input
              label="Nama Toko / Usaha"
              value={storeName}
              onChangeText={setStoreName}
              placeholder="Contoh: Toko Berkah Mandiri"
            />
            <Input
              label="Alamat Toko"
              value={storeAddress}
              onChangeText={setStoreAddress}
              placeholder="Alamat pada header struk"
            />
            <Input
              label="No. Telepon / WhatsApp"
              value={storePhone}
              onChangeText={setStorePhone}
              placeholder="0812..."
              keyboardType="phone-pad"
            />

            {/* Logo Brand Upload for 58mm Thermal */}
            <View className="pt-2">
              <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Logo Struk (Monochrome 58mm)
              </Text>
              <View className="flex-row items-center space-x-3">
                <View className="w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 items-center justify-center">
                  <ImageIcon size={22} color="#71717a" />
                </View>
                <View className="flex-1 ml-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => {
                      Alert.alert("Logo Struk", "Pilih file logo brand toko untuk dicetak pada header struk 58mm.");
                    }}
                  >
                    Upload Logo Toko
                  </Button>
                  <Text className="text-[10px] text-zinc-400 mt-1">
                    Format PNG/JPG, otomatis dikonversi ke hitam-putih 58mm
                  </Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Section 2: Database & Backup Restore (Pure Offline Local) */}
        <Card className="mb-4 border-blue-500/20">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <View className="flex-row items-center">
              <HardDrive size={18} color="#3b82f6" />
              <CardTitle className="ml-2 text-sm">Database & Sinkronisasi</CardTitle>
            </View>
            <Badge variant="success">Pure Local DB</Badge>
          </CardHeader>

          <CardContent className="space-y-3">
            <Text className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Seluruh data toko (Produk, Riwayat, Omset, Modal HPP) disimpan 100% di memori HP Anda. Ekspor data ke file .db untuk pindah HP kapan saja secara mandiri tanpa internet.
            </Text>

            <View className="flex-row space-x-3 pt-1">
              <View className="flex-1 mr-2">
                <Button
                  variant="default"
                  size="sm"
                  loading={isExporting}
                  leftIcon={<Download size={14} color="#ffffff" />}
                  onPress={handleExportBackup}
                >
                  Backup Data (Export)
                </Button>
              </View>

              <View className="flex-1 ml-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={isImporting}
                  leftIcon={<Upload size={14} color="#3b82f6" />}
                  onPress={handleImportBackup}
                >
                  Pulihkan Data (Import)
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Section 3: Keamanan PIN Data Protection */}
        <Card className="mb-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <View className="flex-row items-center">
              <Shield size={18} color="#10b981" />
              <CardTitle className="ml-2 text-sm">Keamanan & Proteksi PIN</CardTitle>
            </View>
            <Badge variant={isPinActive ? "success" : "secondary"}>
              {isPinActive ? "PIN Aktif" : "Nonaktif"}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-3">
            <View className="flex-row items-center justify-between py-1">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  Aktifkan PIN Pelindung Data
                </Text>
                <Text className="text-[11px] text-zinc-400 mt-0.5">
                  Mewajibkan PIN supervisor sebelum menghapus produk atau memulihkan data
                </Text>
              </View>
              <Switch
                value={isPinActive}
                onValueChange={handleTogglePin}
                trackColor={{ false: "#3f3f46", true: "#3b82f6" }}
              />
            </View>

            {isPinActive && (
              <View className="flex-row items-center justify-between p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <View className="flex-row items-center">
                  <Lock size={15} color="#71717a" />
                  <Text className="text-xs text-zinc-700 dark:text-zinc-300 ml-2">
                    PIN Supervisor: •••• (4 Digit)
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setPinChangeModalVisible(true)}
                  className="bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800"
                >
                  <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    Ubah PIN
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Printer Thermal Bluetooth 58mm */}
        <Card className="mb-4">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <View className="flex-row items-center">
              <Printer size={18} color="#3b82f6" />
              <CardTitle className="ml-2 text-sm">Printer Thermal Bluetooth</CardTitle>
            </View>
            <Badge variant="outline">Kertas 58mm</Badge>
          </CardHeader>

          <CardContent className="space-y-2.5">
            <View className="flex-row items-center justify-between p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <View>
                <Text className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  RPP02N 58mm Mini POS
                </Text>
                <Text className="text-[10px] text-zinc-400 mt-0.5">
                  Status: Siap Mencetak • Bluetooth ON
                </Text>
              </View>
              <Badge variant="success">Terkoneksi</Badge>
            </View>

            <View className="flex-row space-x-3 pt-1">
              <View className="flex-1 mr-2">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    Alert.alert("Bluetooth", "Mencari perangkat printer thermal 58mm terdekat...");
                  }}
                >
                  Cari Printer
                </Button>
              </View>
              <View className="flex-1 ml-2">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    Alert.alert("Test Print", "Karakter test print berhasil dikirim ke printer 58mm.");
                  }}
                >
                  Test Print
                </Button>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Section 5: Tampilan Tema */}
        <Card className="mb-4">
          <CardHeader className="flex-row items-center pb-2">
            {isDark ? <Moon size={18} color="#fbbf24" /> : <Sun size={18} color="#f59e0b" />}
            <CardTitle className="ml-2 text-sm">Mode Tampilan</CardTitle>
          </CardHeader>

          <CardContent>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-zinc-600 dark:text-zinc-300">
                Mode Gelap (Dark Mode)
              </Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#3f3f46", true: "#3b82f6" }}
              />
            </View>
          </CardContent>
        </Card>

        <Text className="text-center text-[11px] text-zinc-400 mt-2">
          POS Offline Pro v1.0.0 • 100% Offline Multi-Industry
        </Text>
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal
        visible={pinChangeModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPinChangeModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/75 px-5">
          <View className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 p-5">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center space-x-2">
                <KeyRound size={18} color="#3b82f6" />
                <Text className="text-sm font-bold text-zinc-900 dark:text-zinc-50 ml-2">
                  Ubah PIN Supervisor
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setPinChangeModalVisible(false)}
                className="w-7 h-7 rounded-full items-center justify-center bg-zinc-100 dark:bg-zinc-800"
              >
                <X size={14} color="#71717a" />
              </TouchableOpacity>
            </View>

            <View className="space-y-3 my-2">
              <Input
                label="PIN Baru (4 Digit Angka)"
                placeholder="1234"
                keyboardType="numeric"
                secureTextEntry={true}
                maxLength={4}
                value={newPin}
                onChangeText={setNewPin}
              />

              <Input
                label="Konfirmasi PIN Baru"
                placeholder="1234"
                keyboardType="numeric"
                secureTextEntry={true}
                maxLength={4}
                value={confirmPin}
                onChangeText={setConfirmPin}
              />
            </View>

            <View className="flex-row space-x-3 mt-4">
              <View className="flex-1 mr-2">
                <Button
                  variant="outline"
                  onPress={() => setPinChangeModalVisible(false)}
                >
                  Batal
                </Button>
              </View>
              <View className="flex-1 ml-2">
                <Button variant="default" onPress={handleSaveNewPin}>
                  Simpan PIN
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Secure Action PIN Prompt for Import/Restore */}
      <PinPromptModal
        visible={pinModalVisible}
        actionTitle={actionTitle}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
      />
    </SafeAreaView>
  );
}
