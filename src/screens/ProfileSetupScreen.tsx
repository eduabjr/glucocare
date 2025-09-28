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
// 🚀 CORREÇÃO PRINCIPAL: Importar UserProfile
import { initDB, saveOrUpdateUser, getUser, UserProfile } from '../services/dbService'; 
import { v4 as uuidv4 } from 'uuid';
import GoogleSyncService from '../services/googleSync';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator'; 

type ProfileSetupScreenProps = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

// 🛑 REMOVIDO: A definição da interface UserProfile localmente. 
// Ela agora é importada do dbService.

// Manter SecureStoreProfile tipado localmente, pois reflete os dados salvos em SecureStore, 
// que podem ser incompletos (undefined)
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
    provider?: 'manual' | 'google'; 
    onboardingCompleted?: boolean;
    biometricEnabled?: boolean;
}

// Criar uma interface para o objeto de rascunho de perfil (antes de normalizar)
interface DraftProfile {
    id: string;
    name: string;
    birthDate: string;
    condition: string;
    height: number | null; 
    weight: number | null; 
    restriction: string; 
    email: string;
    googleId: string | null; // Permite null no rascunho
    onboardingCompleted: boolean;
    biometricEnabled: boolean;
}

export default function ProfileSetupScreen({ navigation }: ProfileSetupScreenProps) {
    const [userId, setUserId] = useState<string | null>(null);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
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
                    // Os dados do DB já são UserProfile (googleId: string)
                    setUserId(user.id);
                    setName(user.name); 
                    setEmail(user.email);
                    setGoogleId(user.googleId); // user.googleId é string ('')
                    
                    const dateString = user.birthDate;
                    setBirthDate(dateString ? new Date(dateString) : new Date(1990, 0, 1));
                    setCondition(user.condition);
                    setHeight(user.height !== null ? String(user.height) : ''); 
                    setWeight(user.weight !== null ? String(user.weight) : '');   
                    
                    const userRestrictions = user.restriction;
                    setRestrictions(userRestrictions.split(',').filter(r => r));
                        
                } else {
                    const saved = await SecureStore.getItemAsync('user_profile');
                    if (saved) {
                        const profile: SecureStoreProfile = JSON.parse(saved); 
                        
                        setUserId(profile.id ?? uuidv4()); 
                        setName(profile.name ?? ''); 
                        setEmail(profile.email ?? ''); 
                        setGoogleId(profile.googleId ?? null); // Permite null/undefined virar null aqui
                        
                        const dateSaved = profile.birthDate;
                        setBirthDate(dateSaved ? new Date(dateSaved) : new Date(1990, 0, 1));
                        
                        setCondition(profile.condition ?? ''); 
                        setHeight(profile.height ? String(profile.height) : '');  
                        setWeight(profile.weight ? String(profile.weight) : '');   
                        
                        const savedRestrictions = profile.restriction ?? '';
                        setRestrictions(savedRestrictions.split(',').filter(r => r));

                    } else {
                        setUserId(uuidv4());
                    }
                }
            } catch (err) {
                console.error('Erro init profile:', err);
                setUserId(uuidv4());
            }
        })();
    }, []);

    const toggleRestriction = (item: string) => {
        setRestrictions((prev) =>
            prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
        );
    };

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

            const finalEmail = email.trim() || await SecureStore.getItemAsync('registered_email') || 'placeholder@app.com';

            // 🚀 AJUSTE CRÍTICO: Cria-se um rascunho (DraftProfile) que permite googleId: string | null.
            const draftProfile: DraftProfile = {
                id: userId || uuidv4(),
                name: name.trim(),
                birthDate: birthDate.toISOString(),
                condition,
                height: parsedHeight,
                weight: parsedWeight,
                restriction: restrictions.join(','), 
                email: finalEmail, 
                googleId: googleId, // Pode ser null aqui
                
                onboardingCompleted: true, 
                biometricEnabled: false,  
            };

            // 🚀 AJUSTE FINAL: Normaliza o googleId para string ('') antes de passar para saveOrUpdateUser, 
            // satisfazendo a interface UserProfile importada do dbService (onde googleId é string).
            const profileToSave: UserProfile = {
                ...draftProfile,
                email: draftProfile.email,
                googleId: draftProfile.googleId ?? '', // Garante que é string
            }

            const savedUser = await saveOrUpdateUser(profileToSave);
            
            // ... (Resto do código de salvamento e navegação)
            
            if (typeof savedUser !== 'boolean') {
                 await SecureStore.setItemAsync('user_profile', JSON.stringify(savedUser));
            }


            // Lógica de sincronização do Google Drive (inalterada)
            try {
                const token = await SecureStore.getItemAsync('google_token');
                if (token && GoogleSyncService && typeof GoogleSyncService.uploadReadingsToDrive === 'function') {
                    await GoogleSyncService.uploadReadingsToDrive(token); 
                } else if (token) {
                    console.warn('GoogleSyncService ou uploadReadingsToDrive não é uma função.');
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


                    {/* Altura */}
                    <View style={styles.inputWrapper}>
                        <Feather name="trending-up" size={18} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Altura (cm)"
                            keyboardType="numeric"
                            value={height}
                            onChangeText={setHeight}
                        />
                    </View>

                    {/* Peso */}
                    <View style={styles.inputWrapper}>
                        <Feather name="activity" size={18} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Peso (kg)"
                            keyboardType="numeric"
                            value={weight}
                            onChangeText={setWeight}
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