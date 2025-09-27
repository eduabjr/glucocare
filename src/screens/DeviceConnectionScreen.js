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
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
  MaterialCommunityIcons,
  Feather,
  MaterialIcons,
} from "@expo/vector-icons";

// Mock BLE para rodar no ambiente de desenvolvimento/Expo Go
const BLEMock = {
  startDeviceScan: (filter1, filter2, callback) => {
    // Simula a descoberta de dispositivos após 1 segundo
    setTimeout(() => {
      // O mock deve simular o objeto 'error, device' que o manager real retorna
      callback(null, { id: "MOCK-1", name: "Glicosímetro Simulado 1" });
      setTimeout(() => {
        callback(null, { id: "MOCK-2", name: "Glicosímetro Simulado 2" });
      }, 500);
    }, 1000);
  },
  stopDeviceScan: () => {
    console.log("Mock: Device scan stopped.");
  },
  connectToDevice: async (id) => {
    console.log(`Mock: Connecting to ${id}...`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simula tempo de conexão
    return {
      id,
      name: `Dispositivo Simulado ${id.split('-')[1]}`,
      discoverAllServicesAndCharacteristics: async () => {
        console.log("Mock: Services discovered.");
      },
    };
  },
  destroy: () => {
    console.log("Mock: BleManager instance destroyed.");
  },
};

let BleManager = null;
// Tentativa de carregar o módulo nativo apenas se não for 'web'
if (Platform.OS !== "web") {
  try {
    const { BleManager: NativeBle } = require("react-native-ble-plx");
    BleManager = NativeBle;
  } catch (e) {
    console.log("⚠️ BLE nativo não disponível. Usando mock. Erro:", e.message);
  }
}

export default function DeviceConnectionScreen() {
  const [manager, setManager] = useState(null);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Usa o Manager Nativo se estiver carregado, caso contrário, usa o Mock
    const instance = BleManager ? new BleManager() : BLEMock;
    setManager(instance);

    return () => {
      try {
        // Limpeza: Garante que a instância do manager seja destruída
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
      } catch (e) {
        console.warn("Erro ao destruir BLE Manager:", e);
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

    // Armazena IDs já vistos para evitar duplicatas, especialmente importante para o mock
    const discoveredIds = new Set();
    
    // Certifica-se de parar qualquer scan anterior
    if (scanning) {
        manager.stopDeviceScan();
    }

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Erro no scan BLE:", error);
        Alert.alert("Erro", "Falha ao escanear dispositivos.");
        setScanning(false);
        manager.stopDeviceScan(); // Para o scan em caso de erro
        return;
      }

      if (device && device.name && !discoveredIds.has(device.id)) {
        discoveredIds.add(device.id);
        setDevices((prev) => [...prev, device]);
      }
    });

    // Para o scan após 8 segundos
    const timeout = setTimeout(() => {
      if (manager && typeof manager.stopDeviceScan === 'function') {
        manager.stopDeviceScan();
        setScanning(false);
      }
    }, 8000);

    return () => clearTimeout(timeout); // Limpa o timeout se o componente for desmontado
  };

  const connectToDevice = async (device) => {
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

      if (res.canceled === false) { // Verifica se a seleção não foi cancelada
        Alert.alert("Arquivo importado", `Nome: ${res.assets[0].name}`);
        console.log("Arquivo importado:", res.assets[0]);
      }
    } catch (err) {
      console.error("Erro ao importar arquivo:", err);
      Alert.alert("Erro", "Não foi possível importar o arquivo.");
    }
  };

  const renderHeader = () => (
    <View>
      {/* CARD 1 - Conexão Bluetooth */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="bluetooth-connect"
            size={22}
            color="#2563eb"
          />
          <Text style={styles.cardTitle}>Conexão Bluetooth</Text>
        </View>

        {/* Ícone centralizado do celular */}
        <View style={styles.centerIcon}>
          <View style={styles.circleIcon}>
            <MaterialCommunityIcons name="cellphone" size={40} color="#2563eb" />
          </View>
        </View>

        {/* Status conectado/desconectado */}
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

        {/* Botão conectar */}
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

      {/* CARD 2 - Importar Arquivo */}
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
      
      {/* Linha final com 2 cards */}
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
}

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

  // Ícone celular centralizado
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

  // Status conectado/desconectado
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