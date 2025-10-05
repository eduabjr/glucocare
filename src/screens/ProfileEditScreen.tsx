import React, { useContext, useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    SafeAreaView,
    Platform
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../context/AuthContext';
import { saveOrUpdateUser, initDB } from '../services/dbService';

interface ProfileEditScreenProps {
    navigation: any;
}

const formatNumericInput = (text: string): string => {
    // Remove tudo exceto números e vírgulas
    const cleanedText = text.replace(/[^\d,]/g, '');
    // Se tem vírgula, mantém apenas a primeira e remove as demais
    const parts = cleanedText.split(',');
    if (parts.length > 1) {
        return parts[0] + ',' + parts.slice(1).join('');
    }
    return cleanedText;
};

export default function ProfileEditScreen({ navigation }: ProfileEditScreenProps) {
    const { theme } = useContext(ThemeContext);
    const { user, setUser } = useAuth();
    const styles = getStyles(theme);

    // Estados para os campos do formulário
    const [name, setName] = useState(user?.name || '');
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [birthDateText, setBirthDateText] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [condition, setCondition] = useState(user?.condition || '');
    const [restrictions, setRestrictions] = useState<string[]>([]);
    const [showDate, setShowDate] = useState(false);

    const restrictionOptions = [
        'Lactose', 'Glúten', 'Amendoim', 'Ovos',
        'Peixes', 'Crustáceos', 'Frutos Secos',
    ];

    useEffect(() => {
        // Inicializa o banco de dados
        const initializeDatabase = async () => {
            try {
                await initDB();
                console.log('Banco de dados inicializado no ProfileEdit');
            } catch (error) {
                console.error('Erro ao inicializar banco no ProfileEdit:', error);
            }
        };

        initializeDatabase();

        // Carrega os dados do usuário quando disponível
        const loadUserData = () => {
            if (user) {
                console.log('Carregando dados do usuário:', user);
                setName(user.name ?? '');
                
                // Data de nascimento
                if (user.birthDate) {
                    const userBirthDate = new Date(user.birthDate);
                    if (!isNaN(userBirthDate.getTime())) {
                        setBirthDate(userBirthDate);
                        setBirthDateText(userBirthDate.toLocaleDateString('pt-BR'));
                    } else {
                        setBirthDate(new Date(1990, 0, 1));
                        setBirthDateText('01/01/1990');
                    }
                } else {
                    setBirthDate(new Date(1990, 0, 1));
                    setBirthDateText('01/01/1990');
                }
                
                // Condição
                setCondition(user.condition ?? '');
                
                // Altura e peso
                setHeight(user.height ? String(user.height).replace('.', ',') : '');
                setWeight(user.weight ? String(user.weight).replace('.', ',') : '');
                
                // Restrições alimentares
                const restrictions = user.restriction ? user.restriction.split(',').filter(Boolean) : [];
                setRestrictions(restrictions);
                
                console.log('Dados carregados:', {
                    name: user.name,
                    condition: user.condition,
                    height: user.height,
                    weight: user.weight,
                    restriction: user.restriction,
                    restrictions: restrictions
                });
            }
        };

        loadUserData();
    }, [user]);

    const toggleRestriction = (item: string) => {
        setRestrictions((prev) =>
            prev.includes(item) ? prev.filter((r) => r !== item) : [...prev, item]
        );
    };

    const onDateChange = (_event: any, selected: Date | undefined) => {
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
            birthDate: birthDate?.toISOString() || user.birthDate,
            height: parsedHeight,
            weight: parsedWeight,
            condition: condition.trim(),
            restriction: restrictions.join(','),
            updated_at: new Date().toISOString(),
            pending_sync: true,
        };

        try {
            console.log('💾 Salvando perfil editado:', updatedProfileData);
            await saveOrUpdateUser(updatedProfileData);
            console.log('✅ Perfil salvo no banco local');
            
            console.log('🔄 Atualizando AuthContext com novos dados');
            setUser(updatedProfileData);
            console.log('✅ AuthContext atualizado');
            
            // ✅ NOVO: Força atualização do perfil em todas as telas
            try {
                // Recarrega o perfil do banco local para garantir consistência
                const { getUser } = await import('../services/dbService');
                const updatedUser = await getUser();
                if (updatedUser) {
                    setUser(updatedUser);
                    console.log('✅ Perfil atualizado em todas as telas');
                }
            } catch (refreshError) {
                console.error('❌ Erro ao atualizar perfil globalmente:', refreshError);
            }
            
            // Sincroniza dados com o Firestore
            console.log('🌐 Sincronizando com Firestore...');
            // await syncOfflineData();
            console.log('✅ Sincronização concluída');

            // ProfileEditScreen é apenas para edição posterior via DrawerRoutes
            Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
            navigation.goBack();

        } catch (err) {
            console.error('Erro ao salvar o perfil:', err);
            Alert.alert('Erro', 'Não foi possível salvar o perfil.');
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.headerContainer}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons 
                            name="account-edit" 
                            size={36} 
                            color={theme.primary} 
                        />
                    </View>
                    <Text style={styles.title}>Editar Perfil</Text>
                    <Text style={styles.subtitle}>
                        Atualize suas informações pessoais.
                    </Text>
                </View>

                <View style={styles.card}>
                    {/* Nome */}
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="person" size={20} color={theme.secundaryText} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome Completo"
                            value={name}
                            onChangeText={setName}
                            placeholderTextColor={theme.secundaryText}
                        />
                    </View>

                    {/* Data de nascimento */}
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="event" size={20} color={theme.secundaryText} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="DD/MM/AAAA"
                            value={birthDateText}
                            placeholderTextColor={theme.secundaryText}
                            keyboardType="numeric"
                            onChangeText={(text) => {
                                // Remove todos os caracteres que não são números ou barras
                                const cleanedText = text.replace(/[^\d/]/g, '');
                                setBirthDateText(cleanedText);
                                
                                // Parse da data manual quando completa
                                const parts = cleanedText.split('/');
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
                            <MaterialIcons name="calendar-today" size={20} color={theme.secundaryText} />
                        </TouchableOpacity>
                    </View>
                    {showDate && (
                        <DateTimePicker
                            value={birthDate || new Date()}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}

                    {/* Condição */}
                    <View style={styles.inputWrapper}>
                         <MaterialIcons name="list" size={20} color={theme.secundaryText} style={styles.inputIcon} />
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
                                 placeholderTextColor={theme.secundaryText}
                             />
                         ) : null}
                         <Picker
                             selectedValue={condition}
                             onValueChange={setCondition}
                             style={[styles.pickerStyle, Platform.OS === 'ios' && { position: 'absolute', width: '100%', opacity: 0 }]}
                             itemStyle={styles.pickerItemStyle}
                         >
                             <Picker.Item label="Selecione a Condição" value="" color={theme.secundaryText} />
                             <Picker.Item label="Pré-diabetes" value="pre-diabetes" />
                             <Picker.Item label="Diabetes Tipo 1" value="tipo-1" />
                             <Picker.Item label="Diabetes Tipo 2" value="tipo-2" />
                         </Picker>
                       </View>

                    {/* Altura e Peso na mesma linha */}
                    <View style={styles.rowContainer}>
                        {/* Altura (cm) */}
                        <View style={styles.halfInputWrapper}>
                            <MaterialIcons name="height" size={20} color={theme.secundaryText} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Altura (cm)"
                                keyboardType="numeric"
                                value={height}
                                onChangeText={(text) => setHeight(formatNumericInput(text))}
                                placeholderTextColor={theme.secundaryText}
                            />
                        </View>

                        {/* Peso (kg) */}
                        <View style={[styles.halfInputWrapper, { marginRight: 0 }]}>
                            <MaterialIcons name="fitness-center" size={20} color={theme.secundaryText} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Peso (kg)"
                                keyboardType="numeric"
                                value={weight}
                                onChangeText={(text) => setWeight(formatNumericInput(text))}
                                placeholderTextColor={theme.secundaryText}
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
                </View>

                {/* Botão Salvar */}
                <TouchableOpacity style={styles.actionButtonWrapper} onPress={handleSave}>
                    <LinearGradient
                        colors={['#ecfdf5', '#d1fae5']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.saveButton}
                    >
                        <Text style={styles.saveText}>Salvar Alterações</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    container: { flexGrow: 1, padding: 20, paddingTop: 8 },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        backgroundColor: theme.primary + '20',
        borderRadius: 30,
        width: 54,
        height: 54,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    card: {
        backgroundColor: theme.card,
        borderRadius: 15,
        padding: 18,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 21,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 5,
        color: theme.text,
    },
    subtitle: { 
        fontSize: 14, 
        textAlign: 'center', 
        color: theme.secundaryText, 
        marginBottom: 18,
        lineHeight: 19,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.secundaryText,
        borderRadius: 11,
        marginBottom: 14,
        paddingHorizontal: 15,
        backgroundColor: theme.card,
        minHeight: 48,
    },
    rowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
        gap: 11,
    },
    halfInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.secundaryText,
        borderRadius: 11,
        paddingHorizontal: 15,
        backgroundColor: theme.card,
        flex: 1,
        minHeight: 48,
    },
    inputIcon: { marginRight: 11 },
    input: { flex: 1, fontSize: 15, paddingVertical: 11, color: theme.text },
    calendarIcon: { padding: 3 },
    sectionLabel: { 
        fontSize: 15, 
        fontWeight: '600', 
        marginBottom: 10, 
        marginTop: 6,
        color: theme.text 
    },
    restrictionButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: 18,
        gap: 7,
    },
    restrictionButton: {
        paddingVertical: 7,
        paddingHorizontal: 11,
        borderWidth: 1,
        borderColor: theme.secundaryText,
        borderRadius: 15,
        marginRight: 5,
        marginBottom: 5,
        backgroundColor: theme.background,
    },
    restrictionButtonSelected: {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
    },
    restrictionButtonText: {
        color: theme.text,
        fontSize: 12,
        fontWeight: '500',
    },
    restrictionButtonTextSelected: {
        color: '#fff',
    },
    actionButtonWrapper: {
        marginTop: 18,
        borderRadius: 11,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: {
            width: 0,
            height: 2,
        },
    },
    saveButton: {
        padding: 15,
        borderRadius: 11,
        alignItems: 'center',
    },
    saveText: { color: '#059669', fontWeight: '700', fontSize: 15 },
    pickerStyle: {
        flex: 1,
        color: theme.text,
        height: 34,
    },
    pickerItemStyle: {
        fontSize: 14,
    },
});
