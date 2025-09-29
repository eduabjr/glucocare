import 'react-native-get-random-values';
import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';
// Importações de serviço assumidas
import { initDB, saveOrUpdateUser, getUser, UserProfile } from '../services/dbService'; 
import { v4 as uuidv4 } from 'uuid';
// Assumindo que GoogleSyncService está em '../services/googleSync'
import GoogleSyncService from '../services/googleSync'; 
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator'; 

type ProfileSetupScreenProps = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

// Reflete os dados potencialmente incompletos salvos no SecureStore
interface SecureStoreProfile {
    id?: string;
    name?: string;
    birthDate?: string;
    condition?: string;
    height?: number; 
    weight?: number; 
    restriction?: string;
    email?: string;
    googleId?: string;
}

// Rascunho de perfil usado internamente
interface DraftProfile {
    id: string;
    name: string;
    birthDate: string;
    condition: string;
    height: number | null; 
    weight: number | null; 
    restriction: string; 
    email: string;
    googleId: string | null; 
    onboardingCompleted: boolean;
    biometricEnabled: boolean;
    syncedAt: string;
}

// 💡 FUNÇÃO AUXILIAR: Limpa a entrada numérica para permitir apenas dígitos e um separador decimal (vírgula ou ponto)
const formatNumericInput = (text: string): string => {
    // 1. Remove tudo que não for dígito, vírgula ou ponto
    let cleanedText = text.replace(/[^\d.,]/g, '');
    
    // 2. Padroniza todos os separadores para vírgula temporariamente
    cleanedText = cleanedText.replace(/\./g, ',');
    
    // 3. Garante que só há uma vírgula (decimal) e as move para o final
    const parts = cleanedText.split(',');
    if (parts.length > 1) {
        // Junta a parte inteira com o primeiro grupo de decimais
        cleanedText = parts[0] + ',' + parts.slice(1).join('');
    }
    
    return cleanedText;
};


export default function ProfileSetupScreen({ navigation }: ProfileSetupScreenProps) {
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>(''); // Mantendo o email no estado
    const [googleId, setGoogleId] = useState<string | null>(null);
    const [birthDate, setBirthDate] = useState<Date>(new Date(1990, 0, 1));
    const [showDate, setShowDate] = useState<boolean>(false);
    const [condition, setCondition] = useState<string>('');
    const [height, setHeight] = useState<string>(''); 
    const [weight, setWeight] = useState<string>(''); 
    const [restrictions, setRestrictions] = useState<string[]>([]);

    const restrictionOptions = [
        'Lactose',
        'Glúten',
        'Amendoim',
        'Ovos',
        'Peixes',
        'Crustáceos',
        'Frutos Secos',
    ];

    useEffect(() => {
        (async () => {
            try {
                await initDB();
                const user = await getUser();

                if (user) {
                    // Carrega do DB (UserProfile)
                    setUserId(user.id);
                    setName(user.name); 
                    setEmail(user.email); // Carrega email
                    setGoogleId(user.googleId || null);
                    
                    const dateString = user.birthDate;
                    setBirthDate(dateString ? new Date(dateString) : new Date(1990, 0, 1));
                    setCondition(user.condition);
                    setHeight(user.height !== null && user.height !== 0 ? String(user.height).replace('.', ',') : ''); // Formata para vírgula
                    setWeight(user.weight !== null && user.weight !== 0 ? String(user.weight).replace('.', ',') : ''); // Formata para vírgula
                    
                    const userRestrictions = user.restriction;
                    setRestrictions(userRestrictions.split(',').filter(r => r));
                        
                } else {
                    // Tenta carregar do SecureStore
                    const saved = await SecureStore.getItemAsync('user_profile');
                    if (saved) {
                        const profile: SecureStoreProfile = JSON.parse(saved); 
                        
                        setUserId(profile.id ?? uuidv4()); 
                        setName(profile.name ?? ''); 
                        setEmail(profile.email ?? ''); // Carrega email
                        setGoogleId(profile.googleId ?? null);
                        
                        const dateSaved = profile.birthDate;
                        setBirthDate(dateSaved ? new Date(dateSaved) : new Date(1990, 0, 1));
                        
                        setCondition(profile.condition ?? ''); 
                        setHeight(profile.height ? String(profile.height).replace('.', ',') : ''); // Formata para vírgula
                        setWeight(profile.weight ? String(profile.weight).replace('.', ',') : ''); // Formata para vírgula
                        
                        const savedRestrictions = profile.restriction ?? '';
                        setRestrictions(savedRestrictions.split(',').filter(r => r));

                    } else {
                        setUserId(uuidv4());
                    }
                }
            } catch (err) {
                console.error('Erro ao inicializar perfil:', err);
                setUserId(uuidv4());
            }
        })();
    }, []);

    const toggleRestriction = (item: string) => {
        setRestrictions((prev) =>
            prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
        );
    };

    // Usa a vírgula/ponto para o parse
    const parsedHeight = height ? Number(height.replace(',', '.')) : 0; 
    const parsedWeight = weight ? Number(weight.replace(',', '.')) : 0; 

    const onDateChange = (_event: DateTimePickerEvent, selected: Date | undefined) => {
        setShowDate(false);
        if (selected) {
            setBirthDate(selected);
        }
    };

    const handleSave = async () => {
        try {
            if (!name.trim()) return Alert.alert('Erro', 'Digite seu nome.');
            if (!birthDate || isNaN(birthDate.getTime()))
                return Alert.alert('Erro', 'Informe sua data de nascimento.');
            if (!condition) return Alert.alert('Erro', 'Selecione sua condição.');
            if (parsedHeight <= 0 || isNaN(parsedHeight)) return Alert.alert('Erro', 'Altura inválida (use cm).');
            if (parsedWeight <= 0 || isNaN(parsedWeight)) return Alert.alert('Erro', 'Peso inválido.');

            const registeredEmail = await SecureStore.getItemAsync('registered_email');
            const finalEmail = email.trim() || registeredEmail || 'placeholder@app.com';
            
            // Define a data de sincronização atual (necessária pelo UserProfile)
            const currentSyncedAt = new Date().toISOString(); 

            // 1. Cria o rascunho (DraftProfile: googleId pode ser null)
            const draftProfile: DraftProfile = {
                id: userId || uuidv4(),
                name: name.trim(),
                birthDate: birthDate.toISOString(),
                condition,
                height: parsedHeight,
                weight: parsedWeight,
                restriction: restrictions.join(','), 
                email: finalEmail, 
                googleId: googleId, 
                onboardingCompleted: true, 
                biometricEnabled: false, 
                syncedAt: currentSyncedAt, // Inicializa 'syncedAt'
            };

            // 2. Normaliza para UserProfile (UserProfile.googleId é string).
            const profileToSave: UserProfile = {
                ...draftProfile,
                height: draftProfile.height ?? 0, 
                weight: draftProfile.weight ?? 0, 
                googleId: draftProfile.googleId ?? '', 
            }
            
            const savedUser = await saveOrUpdateUser(profileToSave);
            
            if (typeof savedUser !== 'boolean') {
                 await SecureStore.setItemAsync('user_profile', JSON.stringify(savedUser));
            }

            // Lógica de sincronização do Google Drive
            try {
                const token = await SecureStore.getItemAsync('google_token');
                if (token && GoogleSyncService && typeof GoogleSyncService.uploadReadingsToDrive === 'function') {
                    // Aviso: Este é um ponto potencial de problema de lógica. 
                    // O perfil deve ser salvo, mas o upload de leituras é outra coisa.
                    // Mantendo o código original do usuário aqui, mas sinalizando.
                    await GoogleSyncService.uploadReadingsToDrive(token); 
                }
            } catch (err) {
                console.warn('Falha ao sincronizar perfil (erro de execução do Drive):', err);
            }

            const biometricStatus = await SecureStore.getItemAsync('biometric_setup_done');

            if (!biometricStatus) {
                Alert.alert('Sucesso', 'Perfil criado! Próxima etapa: Biometria.');
                navigation.replace('BiometricSetup');
            } else {
                Alert.alert('Sucesso', 'Perfil atualizado!');
                navigation.replace('DrawerRoutes'); 
            }
        } catch (err) {
            console.error('handleSave profile - erro:', err);
            Alert.alert('Erro', 'Não foi possível salvar o perfil.');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Configurações</Text>
                    <Text style={styles.subtitle}>Edite suas informações pessoais</Text>

                    {/* Nome */}
                    <View style={styles.inputWrapper}>
                        <Feather name="user" size={18} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome Completo"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    {/* 💡 NOVO: Email */}
                    <View style={styles.inputWrapper}>
                        <Feather name="mail" size={18} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Seu Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Data de nascimento */}
                    <View style={styles.inputWrapper}>
                        <Feather name="calendar" size={18} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="DD/MM/AAAA"
                            keyboardType="numeric"
                            value={birthDate.toLocaleDateString('pt-BR')}
                            editable={false} 
                        />
                        <TouchableOpacity onPress={() => setShowDate(true)}>
                            <Feather name="calendar" size={20} color="#2563eb" />
                        </TouchableOpacity>
                    </View>
                    {showDate && (
                        <DateTimePicker
                            value={birthDate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange} 
                            maximumDate={new Date()} 
                        />
                    )}

                    {/* Condição */}
                    <View style={styles.inputWrapper}>
                        <Feather name="list" size={18} color="#9ca3af" style={styles.inputIcon} />
                        {Platform.OS === 'ios' ? (
                            // Wrapper de texto para iOS
                            <TextInput
                                style={styles.input}
                                placeholder="Selecione a Condição"
                                value={
                                    condition === 'pre-diabetes' ? 'Pré-diabetes' :
                                    condition === 'tipo-1' ? 'Diabetes Tipo 1' :
                                    condition === 'tipo-2' ? 'Diabetes Tipo 2' :
                                    ''
                                }
                                editable={false}
                            />
                        ) : null}
                        <Picker
                            selectedValue={condition}
                            onValueChange={setCondition}
                            style={[styles.pickerStyle, Platform.OS === 'ios' && { position: 'absolute', width: '100%', opacity: 0 }]}
                            itemStyle={styles.pickerItemStyle}
                        >
                            <Picker.Item label="Selecione a Condição" value="" color="#9ca3af" />
                            <Picker.Item label="Pré-diabetes" value="pre-diabetes" />
                            <Picker.Item label="Diabetes Tipo 1" value="tipo-1" />
                            <Picker.Item label="Diabetes Tipo 2" value="tipo-2" />
                        </Picker>
                    </View>


                    {/* Altura (cm) - Usando formatNumericInput */}
                    <View style={styles.inputWrapper}>
                        <Feather name="trending-up" size={18} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Altura (cm)"
                            keyboardType="numeric"
                            value={height}
                            // 💡 AJUSTE: Limpa e formata a entrada em tempo real
                            onChangeText={(text) => setHeight(formatNumericInput(text))} 
                        />
                    </View>

                    {/* Peso (kg) - Usando formatNumericInput */}
                    <View style={styles.inputWrapper}>
                        <Feather name="activity" size={18} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Peso (kg)"
                            keyboardType="numeric"
                            value={weight}
                            // 💡 AJUSTE: Limpa e formata a entrada em tempo real
                            onChangeText={(text) => setWeight(formatNumericInput(text))}
                        />
                    </View>

                    {/* Restrições Alimentares */}
                    <Text style={[styles.sectionLabel, { marginTop: 10, marginBottom: 5 }]}>Restrições Alimentares</Text>
                    <View style={styles.restrictionButtonsContainer}>
                        {restrictionOptions.map((item) => {
                            const isSelected = restrictions.includes(item);
                            return (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.restrictionButton,
                                        isSelected && styles.restrictionButtonSelected,
                                    ]}
                                    onPress={() => toggleRestriction(item)}
                                >
                                    <Text
                                        style={[
                                            styles.restrictionButtonText,
                                            isSelected && styles.restrictionButtonTextSelected,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Botão Salvar */}
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveText}>Salvar Alterações</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f0f6ff' },
    container: { flexGrow: 1, justifyContent: 'center', padding: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
        color: '#111827',
    },
    subtitle: { fontSize: 14, textAlign: 'center', color: '#6b7280', marginBottom: 20 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 10,
        marginBottom: 14,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 15, paddingVertical: 10, color: '#111827' },
    sectionLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
    restrictionButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: 10,
    },
    restrictionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        backgroundColor: '#f9fafb',
    },
    restrictionButtonSelected: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    restrictionButtonText: {
        color: '#374151',
        fontSize: 13,
        fontWeight: '500',
    },
    restrictionButtonTextSelected: {
        color: '#fff',
    },
    saveButton: {
        backgroundColor: '#2563eb',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    saveText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    pickerStyle: {
        flex: 1,
        color: '#111827',
        height: 40,
    },
    pickerItemStyle: {
        fontSize: 15,
    },
});
