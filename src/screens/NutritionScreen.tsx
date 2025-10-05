import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Modal,
} from "react-native";
import { MaterialIcons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ThemeContext } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { aiService, AISuggestions, ExtendedAISuggestions } from "../services/aiService";

// Tipagem para o perfil do usuário local
interface Profile {
    name: string;
    condition: string;
    birthDate: string;
    height: number | null;
    weight: number | null;
    restriction: string; 
    age: number | undefined;
    imc?: string | null;
}

// ===================================================================================
// 🤖 Serviço de IA Real (Integração com OpenAI ou fallback)
// ===================================================================================

// ===================================================================================
//  छोटे COMPONENTES REUTILIZÁVEIS
// ===================================================================================

const MealItem = ({ icon, title, description, theme }: any) => {
    const styles = getStyles(theme);
    return (
        <View style={styles.mealRow}>
            <View style={styles.mealIconContainer}>{icon}</View>
            <View style={styles.mealTextContainer}>
                <Text style={styles.mealTitle}>{title}</Text>
                <Text style={styles.mealDesc}>{description}</Text>
            </View>
        </View>
    );
};

const InfoTag = ({ label, type, theme }: any) => {
    const styles = getStyles(theme);
    const style = type === 'condition' ? styles.tagCondition : styles.tagRestriction;
    return <Text style={style}>{label}</Text>;
};

const FoodCategoryCard = ({ title, icon, color, items, theme }: any) => {
    const styles = getStyles(theme);
    const tagStyle = color === theme.accent ? styles.tagGreen : styles.tagRed;
    return (
        <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
                {icon}
                <Text style={[styles.cardTitle, { color, flex: 1, marginLeft: 8 }]}>{title}</Text>
            </View>
            <View style={styles.tagBox}>
                {items.map((item: string, i: number) => (
                    <Text key={i} style={tagStyle}>{item}</Text>
                ))}
            </View>
        </View>
    );
};

const RecipeTipsCard = ({ tips, theme }: any) => {
    const styles = getStyles(theme);
    
    const formatRecipeTip = (tip: string) => {
        const parts = tip.split(':');
        if (parts.length >= 2) {
            const title = parts[0].trim();
            const content = parts.slice(1).join(':').trim();
            return { title, content };
        }
        return { title: 'Receita', content: tip };
    };
    
    return (
        <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="chef-hat" size={20} color={theme.accent} />
                <Text style={styles.cardTitle}>Pratos Rápidos e Fáceis</Text>
            </View>
            {tips.map((tip: string, i: number) => {
                const { title, content } = formatRecipeTip(tip);
                return (
                    <View key={i} style={styles.recipeTipItem}>
                        <View style={styles.recipeIconContainer}>
                            <MaterialIcons name="restaurant" size={16} color={theme.accent} />
                        </View>
                        <View style={styles.recipeContentContainer}>
                            <Text style={styles.recipeTitle}>{title}</Text>
                            <Text style={styles.recipeTipText}>{content}</Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
};


// ===================================================================================
// 🃏 COMPONENTES DE CARD PRINCIPAIS
// ===================================================================================

const ProfileCard = ({ profile, loading, onUpdate, theme }: any) => {
    const styles = getStyles(theme);
    const navigation = useNavigation();
    
    if (!profile) return null;

    const handleEditProfile = () => {
        navigation.navigate('ProfileEdit');
    };

    return (
        <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
                <MaterialIcons name="person" size={22} color={theme.primary} />
                <Text style={styles.cardTitle}>Meu Perfil</Text>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.editButtonWrapper} onPress={handleEditProfile}>
                        <LinearGradient colors={['#fef3c7', '#fde68a']} style={styles.editButton}>
                            <MaterialIcons name="edit" size={16} color="#92400e" />
                            <Text style={styles.editText}>Editar</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButtonWrapper} onPress={onUpdate} disabled={loading}>
                        <LinearGradient colors={['#f0f9ff', '#e0f2fe']} style={styles.updateButton}>
                            {loading ? (
                                <ActivityIndicator color="#0369a1" size="small" />
                            ) : (
                                <>
                                    <Feather name="refresh-cw" size={16} color="#0369a1" />
                                    <Text style={styles.updateText}>Atualizar</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.profileInfoRow}>
                <View style={styles.profileInfoBox}><Text style={styles.infoValue}>{profile.age ?? "--"}</Text><Text style={styles.infoLabel}>Idade</Text></View>
                <View style={styles.profileInfoBox}><Text style={styles.infoValue}>{profile.height ? `${profile.height} cm` : "--"}</Text><Text style={styles.infoLabel}>Altura</Text></View>
                <View style={styles.profileInfoBox}><Text style={styles.infoValue}>{profile.weight ? `${profile.weight} kg` : "--"}</Text><Text style={styles.infoLabel}>Peso</Text></View>
                <View style={styles.profileInfoBox}><Text style={styles.infoValue}>{profile.imc || "--"}</Text><Text style={styles.infoLabel}>IMC</Text></View>
            </View>

            {(profile.condition || profile.restriction) && (
                 <View style={styles.tagsContainer}>
                    {profile.condition ? <InfoTag label={`Condição: ${profile.condition}`} type="condition" theme={theme} /> : null}
                    {profile.restriction ? <InfoTag label={`Restrição: ${profile.restriction}`} type="restriction" theme={theme} /> : null}
                </View>
            )}
        </View>
    );
};

const MealPlanCard = ({ mealPlan, profile, theme }: any) => {
    const styles = getStyles(theme);
    
    const mealIcons: { [key: string]: React.ReactNode } = {
        breakfast: <MaterialCommunityIcons name="coffee-outline" size={24} color={theme.accent} />,
        lunch: <MaterialCommunityIcons name="white-balance-sunny" size={24} color={theme.accent} />,
        dinner: <MaterialCommunityIcons name="weather-night" size={24} color={theme.accent} />,
        snacks: <MaterialCommunityIcons name="food-apple-outline" size={24} color={theme.accent} />,
    };

    const mealTitles: { [key: string]: string } = {
        breakfast: "Café da Manhã",
        lunch: "Almoço",
        dinner: "Jantar",
        snacks: "Lanches"
    };

    if (!mealPlan) return null;

    return (
        <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
                <Feather name="clipboard" size={20} color={theme.accent} />
                <Text style={styles.cardTitle}>Plano Alimentar {profile?.condition ? `para ${profile.condition}` : ""}</Text>
            </View>
            <Text style={styles.planText}>Este plano alimentar é uma sugestão gerada por IA e não substitui a orientação de um profissional de saúde.</Text>
            
            {Object.entries(mealPlan).map(([key, description]) => (
                <MealItem
                    key={key}
                    icon={mealIcons[key] || mealIcons.snacks}
                    title={mealTitles[key]}
                    description={description as string}
                    theme={theme}
                />
            ))}
        </View>
    );
};


// ===================================================================================
// 🖥️ TELA PRINCIPAL (Main Screen Component)
// ===================================================================================
export default function NutritionScreen() {
    const { theme } = useContext(ThemeContext);
    const { user, refreshUserProfile } = useAuth();
    const styles = getStyles(theme);

    const [loading, setLoading] = useState<boolean>(false);
    const [extendedSuggestions, setExtendedSuggestions] = useState<ExtendedAISuggestions | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<"success" | "error">("success");

    const showMessage = (msg: string, type: "success" | "error" = "success") => {
        setMessage(msg);
        setMessageType(type);
    };

    // Função auxiliar para atualizar profile a partir dos dados do usuário
    const updateProfileFromUser = (userData: any) => {
        let age: number | undefined = undefined;
        if (userData.birthDate) {
            const birth = new Date(userData.birthDate);
            if (!isNaN(birth.getTime())) {
                const today = new Date();
                age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                    age--;
                }
            }
        }

        const imc =
            userData.weight && userData.height
                ? (userData.weight / Math.pow(userData.height / 100, 2)).toFixed(1)
                : null;

        const profileFromUser = {
            name: userData.name,
            condition: userData.condition ?? '',
            birthDate: userData.birthDate ?? '',
            height: userData.height ?? null,
            weight: userData.weight ?? null,
            restriction: userData.restriction ?? '',
            age,
            imc,
        };

        setProfile(profileFromUser);
    };

    useEffect(() => {
        console.log('🔍 NutritionScreen - useEffect executado com user:', user);
        if (user) {
            console.log('📊 Dados do usuário recebidos:', {
                name: user.name,
                condition: user.condition,
                birthDate: user.birthDate,
                height: user.height,
                weight: user.weight,
                restriction: user.restriction
            });

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

            const imc =
                user.weight && user.height
                    ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1)
                    : null;

            const newProfile = {
                name: user.name,
                condition: user.condition ?? '',
                birthDate: user.birthDate ?? '',
                height: user.height ?? null,
                weight: user.weight ?? null,
                restriction: user.restriction ?? '',
                age,
                imc,
            };

            console.log('👤 Profile criado:', newProfile);
            setProfile(newProfile);
        } else {
            console.log('❌ Usuário não encontrado no AuthContext');
        }
        
        // Define sugestões iniciais para que a tela não fique vazia
        if (!extendedSuggestions) {
            setExtendedSuggestions({
                mealPlan: {
                    breakfast: "Carregando sugestão personalizada...",
                    lunch: "Carregando sugestão personalizada...",
                    dinner: "Carregando sugestão personalizada...",
                    snacks: "Carregando sugestão personalizada...",
                },
                recipeTips: ["Carregando pratos rápidos e fáceis..."],
                recommendedFoods: ["Carregando alimentos recomendados..."],
                foodsToAvoid: ["Carregando alimentos a evitar..."],
                reasoning: "Carregando sugestões personalizadas..."
            });
            // Tenta obter as sugestões da IA na primeira vez
            updateSuggestions(true);
        }
    }, [user]);

    // Recarrega dados quando a tela recebe foco
    useFocusEffect(
        React.useCallback(() => {
            console.log('🎯 NutritionScreen recebeu foco - recarregando dados');
            
            const loadUserData = async () => {
                try {
                    // Primeiro tenta recarregar do banco local
                    const refreshedUser = await refreshUserProfile();
                    
                    if (refreshedUser) {
                        console.log('🔄 Dados atualizados do usuário:', {
                            name: refreshedUser.name,
                            condition: refreshedUser.condition,
                            birthDate: refreshedUser.birthDate,
                            height: refreshedUser.height,
                            weight: refreshedUser.weight,
                            restriction: refreshedUser.restriction
                        });

                        // Recalcula idade e IMC
                        let age: number | undefined = undefined;
                        if (refreshedUser.birthDate) {
                            const birth = new Date(refreshedUser.birthDate);
                            if (!isNaN(birth.getTime())) {
                                const today = new Date();
                                age = today.getFullYear() - birth.getFullYear();
                                const m = today.getMonth() - birth.getMonth();
                                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                                    age--;
                                }
                            }
                        }

                        const imc =
                            refreshedUser.weight && refreshedUser.height
                                ? (refreshedUser.weight / Math.pow(refreshedUser.height / 100, 2)).toFixed(1)
                                : null;

                        const refreshedProfile = {
                            name: refreshedUser.name,
                            condition: refreshedUser.condition ?? '',
                            birthDate: refreshedUser.birthDate ?? '',
                            height: refreshedUser.height ?? null,
                            weight: refreshedUser.weight ?? null,
                            restriction: refreshedUser.restriction ?? '',
                            age,
                            imc,
                        };

                        console.log('🔄 Profile atualizado ao receber foco:', refreshedProfile);
                        setProfile(refreshedProfile);
                    } else if (user) {
                        // Fallback: usa dados do contexto se não conseguir recarregar
                        console.log('⚠️ Usando dados do contexto como fallback');
                        updateProfileFromUser(user);
                    }
                } catch (error) {
                    console.error('❌ Erro ao recarregar dados do usuário:', error);
                    // Em caso de erro, usa dados do contexto atual
                    if (user) {
                        console.log('🔄 Usando dados do contexto após erro');
                        updateProfileFromUser(user);
                    }
                }
            };
            
            loadUserData();
        }, [refreshUserProfile, user])
    );

    const updateSuggestions = async (isInitialLoad = false) => {
        if (!user || !profile) {
             if (!isInitialLoad) showMessage("Configure seu perfil primeiro.", "error");
            return;
        }

        setLoading(true);

        try {
            // Usa o serviço de IA expandido
            const aiSuggestions = await aiService.generateExtendedNutritionSuggestions(user);
            setExtendedSuggestions(aiSuggestions);
            
            if (!isInitialLoad) {
                const currentProvider = aiService.getCurrentProvider();
                const providerNames = {
                    'gemini': 'Google Gemini',
                    'openai': 'OpenAI GPT',
                    'huggingface': 'Hugging Face',
                    'fallback': 'sistema inteligente'
                };
                const providerName = providerNames[currentProvider as keyof typeof providerNames] || 'IA';
                showMessage(`Sugestões atualizadas com sucesso usando ${providerName}!`, "success");
            }
        } catch (err) {
            console.error("Erro ao atualizar sugestões:", err);
            if (!isInitialLoad) showMessage("Não foi possível atualizar as sugestões.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Usar dados da IA ou fallback
    const recommendedFoods = extendedSuggestions?.recommendedFoods && extendedSuggestions.recommendedFoods.length > 0 
        ? extendedSuggestions.recommendedFoods 
        : ["Pães integrais", "Aveia", "Frutas", "Vegetais folhosos", "Peixes", "Carnes magras", "Grãos", "Oleaginosas", "Iogurte natural"];
    
    const avoidFoods = extendedSuggestions?.foodsToAvoid && extendedSuggestions.foodsToAvoid.length > 0 
        ? extendedSuggestions.foodsToAvoid 
        : ["Açúcar refinado", "Refrigerantes", "Ultraprocessados", "Pães brancos", "Arroz branco", "Batata frita", "Doces", "Álcool em excesso"];

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.headerContainer}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="food-apple" size={36} color={theme.primary} />
                </View>
                <Text style={styles.title}>Alimentação</Text>
                <Text style={styles.subtitle}>Sugestões personalizadas com IA</Text>
            </View>
            
            <ProfileCard profile={profile} loading={loading} onUpdate={() => updateSuggestions()} theme={theme} />
            
            <MealPlanCard mealPlan={extendedSuggestions?.mealPlan} profile={profile} theme={theme} />

            {extendedSuggestions?.recipeTips && extendedSuggestions.recipeTips.length > 0 && (
                <RecipeTipsCard tips={extendedSuggestions.recipeTips} theme={theme} />
            )}

            <FoodCategoryCard
                title="Alimentos Recomendados"
                icon={<Feather name="check-circle" size={20} color={theme.accent} />}
                color={theme.accent}
                items={recommendedFoods}
                theme={theme}
            />

            <FoodCategoryCard
                title="Alimentos a Evitar"
                icon={<Feather name="alert-circle" size={20} color={theme.error} />}
                color={theme.error}
                items={avoidFoods}
                theme={theme}
            />
            
            {/* O Modal de Mensagem pode ficar aqui ou no seu componente App principal */}
            <MessageOverlay message={message} type={messageType} onClose={() => setMessage(null)} theme={theme} />
        </ScrollView>
    );
}


// ===================================================================================
// 💅 ESTILOS (StylesSheet)
// ===================================================================================

const MessageOverlay = ({ message, type, onClose, theme }: any) => {
    const styles = getStyles(theme);
    return (
        <Modal transparent={true} animationType="fade" visible={!!message}>
            <View style={styles.modalOverlay}>
                <View style={styles.messageBox}>
                    <MaterialIcons
                        name={type === "success" ? "check-circle" : "error"}
                        size={40}
                        color={type === "success" ? theme.accent : theme.error}
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


const getStyles = (theme: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    iconContainer: {
        backgroundColor: theme.primary + '20',
        borderRadius: 36,
        width: 72,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    title: { fontSize: 28, fontWeight: "700", color: theme.text, marginBottom: 4 },
    subtitle: { fontSize: 16, color: theme.secundaryText, marginBottom: 24 },
    card: {
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardHeaderRow: { 
        flexDirection: "row", 
        alignItems: "center", 
        marginBottom: 16 
    },
    cardTitle: { fontSize: 18, fontWeight: "600", color: theme.text, flex: 1, marginLeft: 12 },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButtonWrapper: {
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    editButtonWrapper: {
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    editButton: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: "center",
        gap: 6,
    },
    editText: { color: "#92400e", fontWeight: "600", fontSize: 14 },
    updateButton: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignItems: "center",
        gap: 6,
    },
    updateText: { color: "#0369a1", fontWeight: "600", fontSize: 14 },
    profileInfoRow: { flexDirection: "row", justifyContent: "space-around" },
    profileInfoBox: { flex: 1, alignItems: "center", gap: 4 },
    infoLabel: { fontSize: 13, color: theme.secundaryText },
    infoValue: { fontSize: 18, fontWeight: "600", color: theme.text },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.background,
        paddingTop: 16,
    },
    tagCondition: {
        backgroundColor: theme.primary + '20',
        color: theme.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        fontSize: 13,
        fontWeight: '500',
        overflow: 'hidden',
    },
    tagRestriction: {
        backgroundColor: theme.error + '20',
        color: theme.error,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        fontSize: 13,
        fontWeight: '500',
        overflow: 'hidden',
    },
    planText: { fontSize: 14, color: theme.secundaryText, marginBottom: 20, lineHeight: 20 },
    mealRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingBottom: 16,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.background,
    },
    mealIconContainer: { marginRight: 16, marginTop: 2 },
    mealTextContainer: { flex: 1 },
    mealTitle: { fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 6 },
    mealDesc: { fontSize: 14, color: theme.secundaryText, lineHeight: 21 },
    tagBox: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tagGreen: {
        backgroundColor: theme.accent + '20',
        color: theme.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        fontSize: 13,
        fontWeight: '500',
        overflow: 'hidden',
    },
    tagRed: {
        backgroundColor: theme.error + '20',
        color: theme.error,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        fontSize: 13,
        fontWeight: '500',
        overflow: 'hidden',
    },
    recipeTipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingHorizontal: 8,
        backgroundColor: theme.background,
        borderRadius: 8,
        padding: 12,
    },
    recipeIconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    recipeContentContainer: {
        flex: 1,
    },
    recipeTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 4,
    },
    recipeTipText: {
        fontSize: 14,
        color: theme.secundaryText,
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    messageBox: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: theme.card,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        elevation: 10,
    },
    messageText: {
        marginTop: 16,
        fontSize: 16,
        textAlign: "center",
        color: theme.text,
        lineHeight: 22,
    },
    closeButton: {
        marginTop: 24,
        backgroundColor: theme.primary,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 10,
    },
    closeButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});