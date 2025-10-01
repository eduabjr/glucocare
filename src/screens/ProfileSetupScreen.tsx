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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Importações do projeto
import { useAuth } from '../context/AuthContext';
import { OnboardingStackParamList } from '../navigation/RootNavigator';
import { saveOrUpdateUser, UserProfile } from '../services/dbService';

// Tipagem da tela
type ProfileSetupScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'ProfileSetup'>;

// Função auxiliar para formatar números
const formatNumericInput = (text: string): string => {
    let cleanedText = text.replace(/[^\d.,]/g, '');
    cleanedText = cleanedText.replace(/\./g, ',');
    const parts = cleanedText.split(',');
    if (parts.length > 1) {
        cleanedText = parts[0] + ',' + parts.slice(1).join('');
    }
    return cleanedText;
};

export default function ProfileSetupScreen({ navigation }: ProfileSetupScreenProps) {
    const { user, setUser } = useAuth();

    const [name, setName] = useState<string>('');
    const [birthDate, setBirthDate] = useState<Date>(new Date(1990, 0, 1));
    const [birthDateText, setBirthDateText] = useState<string>('');
    const [showDate, setShowDate] = useState<boolean>(false);
    const [condition, setCondition] = useState<string>('');
    const [height, setHeight] = useState<string>('');
    const [weight, setWeight] = useState<string>('');
    const [restrictions, setRestrictions] = useState<string[]>([]);

    const restrictionOptions = [
        'Lactose', 'Glúten', 'Amendoim', 'Ovos',
        'Peixes', 'Crustáceos', 'Frutos Secos',
    ];

    useEffect(() => {
        if (user) {
            setName(user.name ?? '');
            const userBirthDate = user.birthDate ? new Date(user.birthDate) : new Date(1990, 0, 1);
            setBirthDate(userBirthDate);
            setBirthDateText(userBirthDate.toLocaleDateString('pt-BR'));
            setCondition(user.condition ?? '');
            setHeight(user.height ? String(user.height).replace('.', ',') : '');
            setWeight(user.weight ? String(user.weight).replace('.', ',') : '');
            setRestrictions(user.restriction ? user.restriction.split(',').filter(Boolean) : []);
        }
    }, [user]);

    const toggleRestriction = (item: string) => {
        setRestrictions((prev) =>
            prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
        );
    };

    const onDateChange = (_event: DateTimePickerEvent, selected: Date | undefined) => {
        setShowDate(false);
        if (selected) {
            setBirthDate(selected);
            setBirthDateText(selected.toLocaleDateString('pt-BR'));
        }
    };

    const handleSave = async () => {
        if (!user) {
            return Alert.alert('Erro', 'Sessão de usuário inválida. Por favor, reinicie o app.');
        }

        if (!name.trim()) return Alert.alert('Erro', 'Digite seu nome.');
        if (!condition) return Alert.alert('Erro', 'Selecione sua condição.');
        
        const parsedHeight = height ? Number(height.replace(',', '.')) : 0;
        const parsedWeight = weight ? Number(weight.replace(',', '.')) : 0;
        
        if (parsedHeight <= 0 || isNaN(parsedHeight)) return Alert.alert('Erro', 'Altura inválida (use cm).');
        if (parsedWeight <= 0 || isNaN(parsedWeight)) return Alert.alert('Erro', 'Peso inválido.');

        // Construindo o perfil atualizado
        const updatedProfileData: UserProfile = {
            ...user,
            name: name.trim(),
            birthDate: birthDate.toISOString(),
            condition,
            height: parsedHeight,
            weight: parsedWeight,
            restriction: restrictions.join(','),
            onboardingCompleted: false,
            googleId: user.googleId ?? '',
            biometricEnabled: user.biometricEnabled ?? false,
            // ✅ CORREÇÃO: Adiciona o campo 'syncedAt' obrigatório com a data atual.
            syncedAt: new Date().toISOString(),
        };

        try {
            await saveOrUpdateUser(updatedProfileData);
            setUser(updatedProfileData);

            Alert.alert('Sucesso', 'Perfil salvo! Próxima etapa: Biometria.');
            navigation.replace('BiometricSetup');

        } catch (err) {
            console.error('Erro ao salvar o perfil:', err);
            Alert.alert('Erro', 'Não foi possível salvar o perfil.');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.card}>
                    <Text style={styles.title}>Complete seu Perfil</Text>
                    <Text style={styles.subtitle}>Estas informações nos ajudam a personalizar sua experiência.</Text>

                    {/* Nome */}
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="person" size={20} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome Completo"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    {/* Email (não editável) */}
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="email" size={20} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: '#6b7280' }]}
                            value={user?.email || ''}
                            editable={false}
                        />
                    </View>
                    
                    {/* Data de nascimento */}
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="event" size={20} color="#9ca3af" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="DD/MM/AAAA"
                            value={birthDateText}
                            onChangeText={(text) => {
                                setBirthDateText(text);
                                
                                // Parse da data manual quando completa
                                const parts = text.split('/');
                                if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
                                    const day = parseInt(parts[0]);
                                    const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
                                    const year = parseInt(parts[2]);
                                    
                                    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
                                        day >= 1 && day <= 31 && 
                                        month >= 0 && month <= 11 && 
                                        year >= 1900 && year <= new Date().getFullYear()) {
                                        
                                        const newDate = new Date(year, month, day);
                                        if (newDate.getDate() === day && newDate.getMonth() === month && newDate.getFullYear() === year) {
                                            setBirthDate(newDate);
                                        }
                                    }
                                }
                            }}
                        />
                        <TouchableOpacity onPress={() => setShowDate(true)} style={styles.calendarIcon}>
                            <MaterialIcons name="calendar-today" size={20} color="#9ca3af" />
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
                         <MaterialIcons name="list" size={20} color="#9ca3af" style={styles.inputIcon} />
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

                    {/* Altura e Peso na mesma linha */}
                    <View style={styles.rowContainer}>
                        {/* Altura (cm) */}
                        <View style={styles.halfInputWrapper}>
                            <MaterialIcons name="height" size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Altura (cm)"
                                keyboardType="numeric"
                                value={height}
                                onChangeText={(text) => setHeight(formatNumericInput(text))}
                            />
                        </View>

                        {/* Peso (kg) */}
                        <View style={[styles.halfInputWrapper, { marginRight: 0 }]}>
                            <MaterialIcons name="fitness-center" size={20} color="#9ca3af" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Peso (kg)"
                                keyboardType="numeric"
                                value={weight}
                                onChangeText={(text) => setWeight(formatNumericInput(text))}
                            />
                        </View>
                    </View>

                    {/* Restrições Alimentares */}
                    <Text style={[styles.sectionLabel, { marginTop: 8, marginBottom: 8 }]}>Restrições Alimentares</Text>
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
                        <Text style={styles.saveText}>Salvar e Continuar</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// Estilos
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#f0f6ff' },
    container: { flexGrow: 1, justifyContent: 'center', padding: 12 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
        color: '#111827',
    },
    subtitle: { fontSize: 13, textAlign: 'center', color: '#6b7280', marginBottom: 12 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        marginBottom: 12,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    halfInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        paddingHorizontal: 10,
        backgroundColor: '#fff',
        flex: 1,
        marginRight: 6,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 14, paddingVertical: 10, color: '#111827' },
    calendarIcon: { padding: 4 },
    sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, color: '#374151' },
    restrictionButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: 12,
    },
    restrictionButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 16,
        marginRight: 6,
        marginBottom: 6,
        backgroundColor: '#f9fafb',
    },
    restrictionButtonSelected: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    restrictionButtonText: {
        color: '#374151',
        fontSize: 12,
        fontWeight: '500',
    },
    restrictionButtonTextSelected: {
        color: '#fff',
    },
    saveButton: {
        backgroundColor: '#2563eb',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    saveText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    pickerStyle: {
        flex: 1,
        color: '#111827',
        height: 36,
    },
    pickerItemStyle: {
        fontSize: 14,
    },
});
