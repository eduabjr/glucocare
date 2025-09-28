import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { getUser, UserProfile } from "../services/dbService";

// 🚀 Mock do serviço de IA (mantido inalterado)
async function getAISuggestions(profile: any) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0.1) {
                resolve({
                    breakfast: "1 fatia de pão integral + 1 ovo cozido + 1/2 abacate",
                    lunch: "150g de peito de frango grelhado com salada de folhas verdes e azeite de oliva",
                    dinner: "Sopa de legumes + 1 fatia de pão integral + 1 porção de peixe assado",
                    snacks: "1 maçã + 1 punhado de castanhas",
                });
            } else {
                reject(new Error("Falha na conexão com a IA."));
            }
        }, 2000);
    });
}

// 📌 Componente de mensagem de alerta personalizado (mantido inalterado)
const MessageOverlay = ({
    message,
    type,
    onClose,
}: {
    message: string | null;
    type: "success" | "error";
    onClose: () => void;
}) => {
    return (
        <Modal transparent={true} animationType="fade" visible={!!message}>
            <View style={styles.modalOverlay}>
                <View style={styles.messageBox}>
                    <MaterialIcons
                        name={type === "success" ? "check-circle" : "error"}
                        size={40}
                        color={type === "success" ? "#16a34a" : "#dc2626"}
                    />
                    <Text style={styles.messageText}>{message}</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// 🚀 CORREÇÃO PRINCIPAL: age deve ser number | undefined
interface Profile {
    name: string;
    condition: string;
    birthDate: string;
    height: number | null;  
    weight: number | null;  
    restriction: string; 
    age: number | undefined; // <-- AGORA ACEITA UNDEFINED (resultado do cálculo)
    imc?: string | null;
}

export default function NutritionScreen() {
    const [loading, setLoading] = useState<boolean>(false);
    const [mealPlan, setMealPlan] = useState<any | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    const showMessage = (msg: string, type: "success" | "error" = "success") => {
        setMessage(msg);
        setMessageType(type);
    };

    const clearMessage = () => {
        setMessage(null);
    };

    useEffect(() => {
        (async () => {
            try {
                const user: UserProfile | null = await getUser();
                if (user) {
                    // Cálculo da idade
                    let age: number | undefined = undefined;
                    if (user.birthDate) {
                        const birth = new Date(user.birthDate);
                        if (!isNaN(birth.getTime())) {
                            const today = new Date();
                            age = today.getFullYear() - birth.getFullYear();
                            const m = today.getMonth() - birth.getMonth();
                            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                                age--;
                            }
                        }
                    }

                    // Cálculo do IMC
                    const imc =
                        user.weight && user.height
                            ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
                            : null;

                    // Mapeamento de UserProfile (DB) para Profile (Local)
                    setProfile({
                        name: user.name,
                        condition: user.condition,
                        birthDate: user.birthDate,
                        height: user.height,
                        weight: user.weight,
                        restriction: user.restriction,
                        age, // age é number | undefined
                        imc,
                    });
                }
            } catch (err) {
                console.error("Erro ao carregar perfil:", err);
            }
        })();

        // Plano padrão inicial
        setMealPlan({
            breakfast: "1 fatia de pão integral com 1 ovo cozido e 1/2 abacate.",
            lunch: "125g de filé de frango grelhado com salada de folhas verdes e azeite de oliva.",
            dinner: "Sopa de legumes com 1 fatia de pão integral e 1 porção de peixe assado.",
            snacks: "1 maçã ou 1 punhado de castanhas.",
        });
    }, []);

    const updateSuggestions = async () => {
        if (!profile) {
            showMessage("Configure seu perfil primeiro em 'Perfil'.", "error");
            return;
        }

        try {
            setLoading(true);
            const aiPlan = await getAISuggestions(profile);
            setMealPlan(aiPlan);
            showMessage("Sugestões atualizadas! Plano alimentar adaptado ao seu perfil.", "success");
        } catch (err) {
            console.error("Erro ao atualizar sugestões:", err);
            showMessage("Não foi possível atualizar as sugestões.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={styles.title}>Alimentação</Text>
                <TouchableOpacity
                    style={styles.updateButton}
                    onPress={updateSuggestions}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Feather name="refresh-cw" size={16} color="#fff" />
                            <Text style={styles.updateText}>Atualizar</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Sugestões personalizadas com IA</Text>

            {/* Perfil */}
            {profile && (
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialIcons name="person" size={22} color="#2563eb" />
                        <Text style={styles.cardTitle}>Meu Perfil</Text>
                    </View>
                    <Text style={styles.profileName}>{profile.name}</Text>
                    <Text style={styles.badge}>
                        {profile.condition || "Condição não informada"}
                    </Text>
                    <View style={styles.profileInfoRow}>
                        <View style={styles.profileInfoBox}>
                            <Text style={styles.infoLabel}>Idade</Text>
                            <Text style={styles.infoValue}>{profile.age ?? "--"}</Text>
                        </View>
                        <View style={styles.profileInfoBox}>
                            <Text style={styles.infoLabel}>Altura</Text>
                            <Text style={styles.infoValue}>
                                {profile.height ? `${profile.height} cm` : "--"}
                            </Text>
                        </View>
                        <View style={styles.profileInfoBox}>
                            <Text style={styles.infoLabel}>Peso</Text>
                            <Text style={styles.infoValue}>
                                {profile.weight ? `${profile.weight} kg` : "--"}
                            </Text>
                        </View>
                        <View style={styles.profileInfoBox}>
                            <Text style={styles.infoLabel}>IMC</Text>
                            <Text style={styles.infoValue}>{profile.imc || "--"}</Text>
                        </View>
                    </View>
                    {profile.restriction ? (
                        <Text style={styles.restriction}>
                            Restrições: {profile.restriction}
                        </Text>
                    ) : null}
                </View>
            )}

            {/* Plano Alimentar */}
            {mealPlan && (
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Feather name="clipboard" size={20} color="#16a34a" />
                        <Text style={styles.cardTitle}>
                            Plano Alimentar {profile?.condition ? `para ${profile.condition}` : ""}
                        </Text>
                    </View>
                    <Text style={styles.planText}>
                        Este plano alimentar visa ajudar no controle da glicemia e promover saúde geral.
                    </Text>
                    <View style={styles.mealRow}>
                        <Text style={styles.mealTitle}>Café da Manhã</Text>
                        <Text style={styles.mealDesc}>{mealPlan.breakfast}</Text>
                    </View>
                    <View style={styles.mealRow}>
                        <Text style={styles.mealTitle}>Almoço</Text>
                        <Text style={styles.mealDesc}>{mealPlan.lunch}</Text>
                    </View>
                    <View style={styles.mealRow}>
                        <Text style={styles.mealTitle}>Jantar</Text>
                        <Text style={styles.mealDesc}>{mealPlan.dinner}</Text>
                    </View>
                    <View style={styles.mealRow}>
                        <Text style={styles.mealTitle}>Lanches</Text>
                        <Text style={styles.mealDesc}>{mealPlan.snacks}</Text>
                    </View>
                </View>
            )}

            {/* Alimentos Recomendados */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Feather name="check-circle" size={20} color="#16a34a" />
                    <Text style={[styles.cardTitle, { color: "#16a34a" }]}>Alimentos Recomendados</Text>
                </View>
                <View style={styles.tagBox}>
                    {[
                        "Pães integrais",
                        "Aveia",
                        "Frutas",
                        "Vegetais folhosos",
                        "Peixes",
                        "Carnes magras",
                        "Grãos",
                        "Oleaginosas",
                        "Iogurte natural",
                    ].map((item, i) => (
                        <Text key={i} style={styles.tagGreen}>
                            {item}
                        </Text>
                    ))}
                </View>
            </View>

            {/* Alimentos a Evitar */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Feather name="alert-circle" size={20} color="#dc2626" />
                    <Text style={[styles.cardTitle, { color: "#dc2626" }]}>Alimentos a Evitar</Text>
                </View>
                <View style={styles.tagBox}>
                    {[
                        "Açúcar refinado",
                        "Refrigerantes",
                        "Ultraprocessados",
                        "Pães brancos",
                        "Arroz branco",
                        "Batata frita",
                        "Doces",
                        "Álcool em excesso",
                    ].map((item, i) => (
                        <Text key={i} style={styles.tagRed}>
                            {item}
                        </Text>
                    ))}
                </View>
            </View>
            <MessageOverlay message={message} type={messageType} onClose={clearMessage} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f0f6ff", padding: 16 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    title: { fontSize: 22, fontWeight: "700", color: "#111" },
    subtitle: { fontSize: 14, color: "#666", marginBottom: 16 },
    updateButton: {
        flexDirection: "row",
        backgroundColor: "#16a34a",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    updateText: { color: "#fff", fontWeight: "600", marginLeft: 6 },
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
    profileName: { fontSize: 16, fontWeight: "600", color: "#111" },
    badge: {
        alignSelf: "flex-start",
        backgroundColor: "#e0f2fe",
        color: "#0284c7",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginVertical: 6,
        fontSize: 12,
    },
    profileInfoRow: { flexDirection: "row", justifyContent: "space-between" },
    profileInfoBox: { flex: 1, alignItems: "center" },
    infoLabel: { fontSize: 12, color: "#666" },
    infoValue: { fontSize: 14, fontWeight: "600", color: "#111" },
    restriction: { marginTop: 8, fontSize: 13, color: "#b91c1c" },
    planText: { fontSize: 13, color: "#444", marginBottom: 12 },
    mealRow: { marginBottom: 8 },
    mealTitle: { fontSize: 14, fontWeight: "600", color: "#111" },
    mealDesc: { fontSize: 13, color: "#555" },
    tagBox: { flexDirection: "row", flexWrap: "wrap" },
    tagGreen: {
        backgroundColor: "#dcfce7",
        color: "#166534",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        margin: 4,
        fontSize: 13,
    },
    tagRed: {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        margin: 4,
        fontSize: 13,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    messageBox: {
        width: 300,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
        alignItems: "center",
        elevation: 5,
    },
    messageText: {
        marginTop: 10,
        fontSize: 16,
        textAlign: "center",
        color: "#333",
    },
    closeButton: {
        marginTop: 20,
        backgroundColor: "#2563eb",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    closeButtonText: {
        color: "#fff",
        fontWeight: "600",
    },
});