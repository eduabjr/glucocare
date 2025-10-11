import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';

// Importações do projeto
import { useAuth } from '../context/AuthContext';
import { OnboardingStackParamList } from '../navigation/RootNavigator';
import { saveOrUpdateUser, UserProfile } from '../services/dbService';
import { ThemeContext } from '../context/ThemeContext';
import { GlycemicGoals, getDefaultGoals } from '../utils/glycemicGoals';
import { notificationService } from '../services/notificationService';

// Tipagem da tela
type GlycemicGoalScreenProps = NativeStackScreenProps<OnboardingStackParamList, 'GlycemicGoal'>;

// Interfaces para alarmes de medicamento
interface MedicationReminder {
    id: string;
    enabled: boolean;
    time: string; // HH:mm format
    medicationType: 'insulin' | 'medication' | 'both';
    notificationEnabled: boolean;
}

interface MedicationReminders {
    type1: MedicationReminder[]; // Para diabetes tipo 1
    type2: {
        medication: MedicationReminder[];
        insulin: MedicationReminder[];
    };
}


export default function GlycemicGoalScreen({ navigation }: GlycemicGoalScreenProps) {
    const { theme } = useContext(ThemeContext);
    const styles = getStyles(theme);
    const { user, setUser } = useAuth();

    const [goals, setGoals] = useState<GlycemicGoals>(() => getDefaultGoals(user?.condition));
    const [isLoading, setIsLoading] = useState(false);
    
    // Estados para alarmes de medicamento
    const [medicationReminders, setMedicationReminders] = useState<MedicationReminders>({
        type1: [
            { id: '1', enabled: true, time: '08:00', medicationType: 'insulin', notificationEnabled: true },
            { id: '2', enabled: true, time: '12:00', medicationType: 'insulin', notificationEnabled: true },
            { id: '3', enabled: true, time: '18:00', medicationType: 'insulin', notificationEnabled: true },
        ],
        type2: {
            medication: [
                { id: '4', enabled: true, time: '08:00', medicationType: 'medication', notificationEnabled: true },
                { id: '5', enabled: true, time: '20:00', medicationType: 'medication', notificationEnabled: true },
            ],
            insulin: [
                { id: '6', enabled: false, time: '12:00', medicationType: 'insulin', notificationEnabled: true },
            ]
        }
    });
    
    const [showTimePicker, setShowTimePicker] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<Date>(new Date());

    // Atualiza os valores quando a condição do usuário muda
    useEffect(() => {
        if (user?.condition) {
            setGoals(getDefaultGoals(user.condition));
            
            // Carrega alarmes de medicamento salvos se existirem
            if (user.medicationReminders) {
                try {
                    const savedReminders = JSON.parse(user.medicationReminders);
                    setMedicationReminders(savedReminders);
                } catch (error) {
                    console.error('Erro ao carregar alarmes de medicamento salvos:', error);
                }
            }
        }
    }, [user?.condition, user?.medicationReminders]);

    // Mostra popup informativo sobre valores padrão
    useEffect(() => {
        const showDefaultValuesInfo = () => {
            Alert.alert(
                'ℹ️ Valores Padrão',
                'Os valores exibidos são configurações padrão baseadas na sua condição. Recomendamos fortemente que consulte um médico para ter uma experiência personalizada e um melhor acompanhamento de sua condição.\n\nCada pessoa é única e pode necessitar de ajustes específicos nos objetivos glicêmicos.',
                [
                    {
                        text: 'Entendi',
                        style: 'default'
                    }
                ]
            );
        };

        // Mostra o popup apenas uma vez quando a tela carrega
        showDefaultValuesInfo();
    }, []);

    const handleInputChange = (period: keyof GlycemicGoals, field: 'min' | 'ideal' | 'max', value: string) => {
        const numericValue = parseInt(value) || 0;
        
        setGoals(prev => ({
            ...prev,
            [period]: {
                ...prev[period],
                [field]: numericValue
            }
        }));
    };

    const validateGoals = (): boolean => {
        const periods = ['preMeal', 'postMeal', 'night'] as const;
        
        for (const period of periods) {
            const { min, ideal, max } = goals[period];
            
            if (min <= 0 || ideal <= 0 || max <= 0) {
                Alert.alert('Erro', 'Todos os valores devem ser maiores que zero.');
                return false;
            }
            
            if (min >= ideal || ideal >= max) {
                Alert.alert('Erro', `Para ${getPeriodName(period)}, o valor mínimo deve ser menor que o ideal, e o ideal menor que o máximo.`);
                return false;
            }
            
            if (min < 30 || max > 600) {
                Alert.alert('Erro', 'Os valores devem estar entre 30 e 600 mg/dL.');
                return false;
            }
        }
        
        return true;
    };

    const getPeriodName = (period: keyof GlycemicGoals): string => {
        switch (period) {
            case 'preMeal': return 'Pré-refeição';
            case 'postMeal': return 'Pós-refeição';
            case 'night': return 'Noite/Madrugada';
            default: return '';
        }
    };

    // Funções para gerenciar alarmes de medicamento
    const handleTimeChange = (reminderId: string, newTime: Date) => {
        const timeString = newTime.toTimeString().slice(0, 5); // HH:mm format
        
        setMedicationReminders(prev => {
            const newState = { ...prev };
            
            // Atualizar para tipo 1
            newState.type1 = newState.type1.map(reminder => 
                reminder.id === reminderId ? { ...reminder, time: timeString } : reminder
            );
            
            // Atualizar para tipo 2 - medicamento
            newState.type2.medication = newState.type2.medication.map(reminder => 
                reminder.id === reminderId ? { ...reminder, time: timeString } : reminder
            );
            
            // Atualizar para tipo 2 - insulina
            newState.type2.insulin = newState.type2.insulin.map(reminder => 
                reminder.id === reminderId ? { ...reminder, time: timeString } : reminder
            );
            
            return newState;
        });
    };

    const toggleReminder = (reminderId: string) => {
        setMedicationReminders(prev => {
            const newState = { ...prev };
            
            // Atualizar para tipo 1
            newState.type1 = newState.type1.map(reminder => 
                reminder.id === reminderId ? { ...reminder, enabled: !reminder.enabled } : reminder
            );
            
            // Atualizar para tipo 2 - medicamento
            newState.type2.medication = newState.type2.medication.map(reminder => 
                reminder.id === reminderId ? { ...reminder, enabled: !reminder.enabled } : reminder
            );
            
            // Atualizar para tipo 2 - insulina
            newState.type2.insulin = newState.type2.insulin.map(reminder => 
                reminder.id === reminderId ? { ...reminder, enabled: !reminder.enabled } : reminder
            );
            
            return newState;
        });
    };

    const toggleNotification = (reminderId: string) => {
        setMedicationReminders(prev => {
            const newState = { ...prev };
            
            // Atualizar para tipo 1
            newState.type1 = newState.type1.map(reminder => 
                reminder.id === reminderId ? { ...reminder, notificationEnabled: !reminder.notificationEnabled } : reminder
            );
            
            // Atualizar para tipo 2 - medicamento
            newState.type2.medication = newState.type2.medication.map(reminder => 
                reminder.id === reminderId ? { ...reminder, notificationEnabled: !reminder.notificationEnabled } : reminder
            );
            
            // Atualizar para tipo 2 - insulina
            newState.type2.insulin = newState.type2.insulin.map(reminder => 
                reminder.id === reminderId ? { ...reminder, notificationEnabled: !reminder.notificationEnabled } : reminder
            );
            
            return newState;
        });
    };

    const showTimePickerForReminder = (reminderId: string, currentTime: string) => {
        const [hours, minutes] = currentTime.split(':');
        const time = new Date();
        time.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        setSelectedTime(time);
        setShowTimePicker(reminderId);
    };

    // Função para agendar notificações dos alarmes de medicamento
    const scheduleMedicationNotifications = async () => {
        try {
            // Solicitar permissões para notificações
            const hasPermission = await notificationService.requestPermissions();
            if (!hasPermission) {
                console.log('Permissões de notificação negadas');
                return;
            }

            // Agendar notificações para todos os alarmes habilitados
            const allReminders = [
                ...medicationReminders.type1,
                ...medicationReminders.type2.medication,
                ...medicationReminders.type2.insulin
            ];

            for (const reminder of allReminders) {
                if (reminder.enabled && reminder.notificationEnabled) {
                    const [hours, minutes] = reminder.time.split(':');
                    const notificationTime = new Date();
                    notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    
                    // Se o horário já passou hoje, agenda para amanhã
                    if (notificationTime <= new Date()) {
                        notificationTime.setDate(notificationTime.getDate() + 1);
                    }

                    const medicationType = reminder.medicationType === 'insulin' ? 'Insulina' : 'Medicamento';
                    const title = `💊 Hora do ${medicationType}`;
                    const body = `É hora de tomar seu ${medicationType.toLowerCase()}!`;

                    await notificationService.scheduleLocalNotification({
                        title,
                        body,
                        trigger: {
                            date: notificationTime
                        },
                        data: {
                            type: 'medication_reminder',
                            reminderId: reminder.id,
                            medicationType: reminder.medicationType,
                            time: reminder.time
                        }
                    });

                    console.log(`Notificação agendada para ${reminder.time} - ${medicationType}`);
                }
            }
        } catch (error) {
            console.error('Erro ao agendar notificações de medicamento:', error);
        }
    };

    const handleSave = async () => {
        if (!validateGoals()) return;

        setIsLoading(true);
        try {
            const updatedUser: UserProfile = {
                ...user!,
                glycemicGoals: JSON.stringify(goals),
                medicationReminders: JSON.stringify(medicationReminders), // Adicionar alarmes de medicamento
                updated_at: new Date().toISOString(),
                pending_sync: true
            };

            await saveOrUpdateUser(updatedUser);
            setUser(updatedUser);

            // Agendar notificações para os alarmes de medicamento
            await scheduleMedicationNotifications();

            Alert.alert(
                'Sucesso',
                'Objetivos glicêmicos e lembretes de medicamento salvos com sucesso!',
                [
                    {
                        text: 'Continuar',
                        onPress: () => navigation.navigate('BiometricSetup')
                    }
                ]
            );
        } catch (error) {
            console.error('Erro ao salvar objetivos glicêmicos:', error);
            Alert.alert('Erro', 'Não foi possível salvar os dados. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Cancelar',
            'Tem certeza que deseja cancelar? Os objetivos glicêmicos não serão salvos.',
            [
                { text: 'Continuar editando', style: 'cancel' },
                { text: 'Cancelar', style: 'destructive', onPress: () => navigation.goBack() }
            ]
        );
    };

    const renderPeriodSection = (period: keyof GlycemicGoals) => {
        const periodGoals = goals[period];
        const periodName = getPeriodName(period);

        return (
            <View key={period} style={styles.periodSection}>
                <Text style={styles.periodTitle}>{periodName}:</Text>
                <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Min</Text>
                        <TextInput
                            style={styles.input}
                            value={periodGoals.min.toString()}
                            onChangeText={(value) => handleInputChange(period, 'min', value)}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Ideal</Text>
                        <TextInput
                            style={styles.input}
                            value={periodGoals.ideal.toString()}
                            onChangeText={(value) => handleInputChange(period, 'ideal', value)}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Max</Text>
                        <TextInput
                            style={styles.input}
                            value={periodGoals.max.toString()}
                            onChangeText={(value) => handleInputChange(period, 'max', value)}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                    </View>
                </View>
            </View>
        );
    };

    // Componente para renderizar um alarme individual
    const renderMedicationReminder = (reminder: MedicationReminder) => (
        <View key={reminder.id} style={styles.reminderItem}>
            <View style={styles.reminderHeader}>
                <View style={styles.reminderInfo}>
                    <MaterialIcons 
                        name={reminder.medicationType === 'insulin' ? 'local-pharmacy' : 'medication'} 
                        size={20} 
                        color={theme.primary} 
                    />
                    <Text style={styles.reminderType}>
                        {reminder.medicationType === 'insulin' ? 'Insulina' : 'Medicamento'}
                    </Text>
                </View>
                <Switch
                    value={reminder.enabled}
                    onValueChange={() => toggleReminder(reminder.id)}
                    trackColor={{ false: theme.secundaryText, true: theme.primary }}
                    thumbColor={reminder.enabled ? '#fff' : theme.secundaryText}
                />
            </View>
            
            {reminder.enabled && (
                <View style={styles.reminderControls}>
                    <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => showTimePickerForReminder(reminder.id, reminder.time)}
                    >
                        <MaterialIcons name="access-time" size={18} color={theme.primary} />
                        <Text style={styles.timeText}>{reminder.time}</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.notificationToggle}>
                        <Text style={styles.notificationLabel}>Notificação</Text>
                        <Switch
                            value={reminder.notificationEnabled}
                            onValueChange={() => toggleNotification(reminder.id)}
                            trackColor={{ false: theme.secundaryText, true: theme.primary }}
                            thumbColor={reminder.notificationEnabled ? '#fff' : theme.secundaryText}
                        />
                    </View>
                </View>
            )}
        </View>
    );

    // Componente para renderizar seção de alarmes de medicamento
    const renderMedicationRemindersSection = () => {
        if (!user?.condition || (user.condition !== 'tipo-1' && user.condition !== 'tipo-2')) {
            return null;
        }

        return (
            <View style={styles.medicationSection}>
                <View style={styles.medicationHeader}>
                    <MaterialIcons name="notifications" size={24} color={theme.primary} />
                    <Text style={styles.medicationTitle}>Lembretes de Medicamento</Text>
                </View>
                
                {user.condition === 'tipo-1' && (
                    <View style={styles.reminderGroup}>
                        <Text style={styles.reminderGroupTitle}>Insulina</Text>
                        {medicationReminders.type1.map(renderMedicationReminder)}
                    </View>
                )}
                
                {user.condition === 'tipo-2' && (
                    <View>
                        <View style={styles.reminderGroup}>
                            <Text style={styles.reminderGroupTitle}>Medicamento</Text>
                            {medicationReminders.type2.medication.map(renderMedicationReminder)}
                        </View>
                        
                        <View style={styles.reminderGroup}>
                            <Text style={styles.reminderGroupTitle}>Insulina (se necessário)</Text>
                            {medicationReminders.type2.insulin.map(renderMedicationReminder)}
                        </View>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={[theme.primary, theme.secundary]}
                style={styles.header}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Objetivo Glicêmico</Text>
                <View style={styles.placeholder} />
            </LinearGradient>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.descriptionContainer}>
                        <MaterialIcons name="favorite" size={48} color={theme.primary} style={styles.icon} />
                        <Text style={styles.title}>Objetivo Glicêmico</Text>
                        <Text style={styles.description}>
                            Objetivo glicêmico (ou meta glicêmica) são os valores de glicemia para os períodos diferentes do dia.
                        </Text>
                    </View>

                    <View style={styles.goalsContainer}>
                        <View style={styles.columnHeaders}>
                            <Text style={styles.columnHeader}>Min</Text>
                            <Text style={styles.columnHeader}>Ideal</Text>
                            <Text style={styles.columnHeader}>Max</Text>
                        </View>

                        {renderPeriodSection('preMeal')}
                        {renderPeriodSection('postMeal')}
                        {renderPeriodSection('night')}
                    </View>

                    {/* Seção de alarmes de medicamento */}
                    {renderMedicationRemindersSection()}

                    <View style={styles.infoContainer}>
                        <MaterialIcons name="info" size={20} color={theme.primary} />
                        <Text style={styles.infoText}>
                            Os valores foram sugeridos baseados na sua condição. Você pode personalizá-los conforme orientação médica.
                        </Text>
                    </View>

                    {/* Botão para mostrar informações sobre valores padrão */}
                    <TouchableOpacity 
                        style={styles.medicalAdviceButton}
                        onPress={() => {
                            Alert.alert(
                                '🏥 Acompanhamento Médico Recomendado',
                                'Os valores padrão são apenas uma base inicial. Para um melhor controle da sua glicemia:\n\n• Consulte seu médico regularmente\n• Personalize os objetivos conforme sua condição\n• Monitore como seu corpo responde\n• Ajuste conforme necessário\n\nLembre-se: cada pessoa é única e pode necessitar de valores diferentes.',
                                [
                                    {
                                        text: 'Entendi',
                                        style: 'default'
                                    }
                                ]
                            );
                        }}
                    >
                        <MaterialIcons name="medical-services" size={18} color={theme.primary} />
                        <Text style={[styles.medicalAdviceText, { color: theme.primary }]}>
                            Importante: Consulte um médico
                        </Text>
                    </TouchableOpacity>
                </ScrollView>

                {/* DateTimePicker para seleção de horário */}
                {showTimePicker && (
                    <DateTimePicker
                        value={selectedTime}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event, selectedTime) => {
                            setShowTimePicker(null);
                            if (selectedTime && showTimePicker) {
                                handleTimeChange(showTimePicker, selectedTime);
                            }
                        }}
                    />
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={handleCancel}
                        disabled={isLoading}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.saveButton, isLoading && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={isLoading}
                    >
                        <Text style={styles.saveButtonText}>
                            {isLoading ? 'Salvando...' : 'Salvar alterações'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    descriptionContainer: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    icon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: theme.secundaryText,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    goalsContainer: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    columnHeaders: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    columnHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text,
        flex: 1,
        textAlign: 'center',
    },
    periodSection: {
        marginBottom: 24,
    },
    periodTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    inputGroup: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    inputLabel: {
        fontSize: 14,
        color: theme.secundaryText,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: theme.secundaryText,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.text,
        backgroundColor: theme.background,
        textAlign: 'center',
        minWidth: 60,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.cardBackground,
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
    },
    infoText: {
        fontSize: 14,
        color: theme.secundaryText,
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: theme.background,
        borderTopWidth: 1,
        borderTopColor: theme.secundaryText,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.secundaryText,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.secundaryText,
    },
    saveButton: {
        backgroundColor: theme.primary,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    disabledButton: {
        opacity: 0.6,
    },
    // Estilos para alarmes de medicamento
    medicationSection: {
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    medicationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    medicationTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginLeft: 12,
    },
    reminderGroup: {
        marginBottom: 20,
    },
    reminderGroupTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 12,
        paddingLeft: 4,
    },
    reminderItem: {
        backgroundColor: theme.background,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: theme.secundaryText,
    },
    reminderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    reminderInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    reminderType: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.text,
        marginLeft: 8,
    },
    reminderControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.cardBackground,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.primary,
    },
    timeText: {
        fontSize: 16,
        color: theme.primary,
        marginLeft: 6,
        fontWeight: '500',
    },
    notificationToggle: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationLabel: {
        fontSize: 14,
        color: theme.secundaryText,
        marginRight: 8,
    },
    // Estilos para botão de orientação médica
    medicalAdviceButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.cardBackground,
        borderWidth: 2,
        borderColor: theme.primary,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    medicalAdviceText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
        textAlign: 'center',
    },
});
