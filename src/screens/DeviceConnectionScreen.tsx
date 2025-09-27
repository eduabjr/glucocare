import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from "react-native";
// IMPORTANTE: O tipo 'DocumentPickerResult' não é estritamente necessário aqui,
// mas 'as any' é usado para contornar problemas de tipagem.
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialCommunityIcons,
  Feather,
  MaterialIcons,
} from "@expo/vector-icons";

// Tipos de dados para as leituras de dispositivos
interface Device {
  id: string;
  name: string;
}

interface ConnectionProps {
  navigation: any;
}

const BLEMock = {
  startDeviceScan: (_filter1: any, _filter2: any, callback: Function) => {
    setTimeout(() => {
      callback(null, { id: "MOCK-1", name: "Glicosímetro Simulado 1" });
      setTimeout(() => {
        callback(null, { id: "MOCK-2", name: "Glicosímetro Simulado 2" });
      }, 500);
    }, 1000);
  },
  stopDeviceScan: () => {
    console.log("Mock: Device scan stopped.");
  },
  connectToDevice: async (id: string) => {
    console.log(`Mock: Connecting to ${id}...`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return {
      id,
      name: `Dispositivo Simulado ${id.split("-")[1]}`,
      discoverAllServicesAndCharacteristics: async () => {
        console.log("Mock: Services discovered.");
      },
    };
  },
  destroy: () => {
    console.log("Mock: BleManager instance destroyed.");
  },
};

let BleManager: any = null;
if (Platform.OS !== "web") {
  try {
    // Tenta carregar o módulo nativo em plataformas que não são Web (incluindo Android)
    const { BleManager: NativeBle } = require("react-native-ble-plx");
    BleManager = NativeBle;
  } catch (e: any) {
    console.log("⚠️ BLE nativo não disponível. Usando mock. Erro:", e.message);
  }
}

const DeviceConnectionScreen: React.FC<ConnectionProps> = ({ navigation: _navigation }) => {
  const [manager, setManager] = useState<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const instance = BleManager ? new BleManager() : BLEMock;
    setManager(instance);

    return () => {
      try {
        if (instance && typeof instance.destroy === "function") {
          instance.destroy();
        }
      } catch (e: unknown) { 
        if (e instanceof Error) {
            console.warn("Erro ao destruir BLE Manager:", e.message);
        } else {
            console.warn("Erro desconhecido ao destruir BLE Manager:", e);
        }
      }
    };
  }, []);

  const scanForDevices = () => {
    if (!manager) {
      Alert.alert(
        "Erro de Inicialização",
        "O gerenciador Bluetooth não foi carregado corretamente."
      );
      return;
    }

    setDevices([]);
    setScanning(true);
    const discoveredIds = new Set();

    if (scanning) {
      manager.stopDeviceScan();
    }

    manager.startDeviceScan(null, null, (error: any, device: Device) => {
      if (error) {
        console.error("Erro no scan BLE:", error);
        Alert.alert("Erro", "Falha ao escanear dispositivos.");
        setScanning(false);
        manager.stopDeviceScan();
        return;
      }

      if (device && device.name && !discoveredIds.has(device.id)) {
        discoveredIds.add(device.id);
        setDevices((prevDevices) => [...prevDevices, device]);
      }
    });

    const timeout = setTimeout(() => {
      if (manager && typeof manager.stopDeviceScan === "function") {
        manager.stopDeviceScan();
        setScanning(false);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  };

  const connectToDevice = async (device: Device) => {
    if (scanning) {
      manager.stopDeviceScan();
      setScanning(false);
    }

    try {
      const connected = await manager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      setConnectedDevice(connected);
      Alert.alert(
        "Conectado!",
        `Dispositivo ${device.name || device.id} conectado.`
      );
    } catch (err) {
      console.error("Erro ao conectar:", err);
      Alert.alert("Erro", "Não foi possível conectar ao dispositivo.");
    }
  };

  const handleFileImport = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/xml",
          "application/pdf",
        ],
        copyToCacheDirectory: true,
      });

      // CORREÇÃO DEFINITIVA DO TS2339:
      // Asserção de tipo para 'any' para forçar o TypeScript a aceitar 
      // a propriedade 'assets', que é a estrutura correta no Android.
      const result = res as any;

      if (result.type === 'success' && result.assets && result.assets.length > 0) {
        Alert.alert("Arquivo importado", `Nome: ${result.assets[0].name}`);
        console.log("Arquivo importado:", result.assets[0]);
      } else if (result.type === 'cancel') {
        console.log("Importação de arquivo cancelada.");
      } else {
        console.log("Falha na leitura ou nenhum arquivo selecionado.");
      }
    } catch (err) {
      console.error("Erro ao importar arquivo:", err);
      Alert.alert("Erro", "Não foi possível importar o arquivo.");
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="bluetooth-connect"
            size={22}
            color="#2563eb"
          />
          <Text style={styles.cardTitle}>Conexão Bluetooth</Text>
        </View>

        <View style={styles.centerIcon}>
          <View style={styles.circleIcon}>
            <MaterialCommunityIcons name="cellphone" size={40} color="#2563eb" />
          </View>
        </View>

        <View
          style={[
            styles.statusBox,
            { backgroundColor: connectedDevice ? "#dcfce7" : "#f3f4f6" },
          ]}
        >
          <MaterialCommunityIcons
            name={connectedDevice ? "check-circle" : "wifi-off"}
            size={18}
            color={connectedDevice ? "#16a34a" : "#9ca3af"}
          />
          <Text
            style={[
              styles.statusText,
              { color: connectedDevice ? "#16a34a" : "#6b7280" },
            ]}
          >
            {connectedDevice ? connectedDevice.name : "Desconectado"}
          </Text>
        </View>

        <TouchableOpacity
          style={{ borderRadius: 10, overflow: "hidden", marginBottom: 12 }}
          onPress={scanForDevices}
          disabled={scanning}
        >
          <LinearGradient
            colors={["#2563eb", "#4338ca"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <MaterialCommunityIcons name="bluetooth" size={18} color="#fff" />
            <Text style={styles.buttonText}>
              {scanning ? "Escaneando..." : "Conectar Glicosímetro"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.instructions}>
          • Certifique-se que o Bluetooth está ativado{"\n"}
          • Coloque o glicosímetro em modo de pareamento{"\n"}
          • Mantenha os dispositivos próximos
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="upload" size={20} color="#16a34a" />
          <Text style={styles.cardTitle}>Importar Arquivo</Text>
        </View>

        <TouchableOpacity style={styles.uploadBox} onPress={handleFileImport}>
          <MaterialCommunityIcons name="file-upload" size={48} color="#16a34a" />
          <Text style={styles.uploadText}>
            Arraste seu arquivo aqui {"\n"} ou clique para selecionar
          </Text>
        </TouchableOpacity>

        <Text style={styles.formats}>
          Formatos aceitos: CSV (.csv) · Excel (.xlsx) · XML (.xml) · PDF (.pdf)
        </Text>

        <View style={styles.infoBox}>
          <Feather name="info" size={16} color="#2563eb" />
          <Text style={styles.infoText}>
            Como exportar do seu glicosímetro: conecte o dispositivo no
            computador e exporte os dados como CSV ou PDF através do software do
            fabricante.
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="devices" size={22} color="#2563eb" />
            <Text style={styles.cardTitle}>Bluetooth</Text>
          </View>
          <Text style={styles.listItem}>• Accu-Chek Guide</Text>
          <Text style={styles.listItem}>• OneTouch Verio</Text>
          <Text style={styles.listItem}>• FreeStyle Libre</Text>
        </View>

        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="file-import"
              size={22}
              color="#16a34a"
            />
            <Text style={styles.cardTitle}>Importação de Arquivos</Text>
          </View>
          <Text style={styles.listItem}>• Arquivos CSV</Text>
          <Text style={styles.listItem}>• Relatórios PDF</Text>
          <Text style={styles.listItem}>• Dados XML</Text>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      data={devices}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.deviceItem}
          onPress={() => connectToDevice(item)}
        >
          <MaterialIcons name="devices" size={20} color="#2563eb" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.deviceName}>{item.name || "Sem nome"}</Text>
            <Text style={styles.deviceId}>{item.id}</Text>
          </View>
        </TouchableOpacity>
      )}
      ListHeaderComponent={renderHeader}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f1f5f9" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginLeft: 8, color: "#111" },

  centerIcon: { alignItems: "center", marginVertical: 10 },
  circleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e0ebff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  statusBox: {
    flexDirection: "row",
    alignSelf: "center",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 14,
  },
  statusText: { fontSize: 14, marginLeft: 6 },

  gradientButton: {
    flexDirection: "row",
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14, marginLeft: 6 },

  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  deviceName: { fontSize: 15, fontWeight: "600" },
  deviceId: { fontSize: 12, color: "#666" },

  instructions: { fontSize: 13, color: "#555", marginTop: 10, lineHeight: 20 },

  uploadBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#ccc",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
    textAlign: "center",
    marginTop: 6,
  },
  formats: { fontSize: 12, color: "#555", marginBottom: 12 },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    padding: 10,
  },
  infoText: { flex: 1, marginLeft: 6, fontSize: 12, color: "#1e3a8a" },

  row: { flexDirection: "row", justifyContent: "space-between" },
  halfCard: { flex: 1, marginRight: 8 },
  listItem: { fontSize: 13, color: "#333", marginBottom: 6 },
});

export default DeviceConnectionScreen;