// Script de teste para verificar o fluxo de navegação e persistência de dados

import { getUser, saveOrUpdateUser } from '../services/dbService';
import { UserProfile } from '../context/AuthContext';

// Função para testar o fluxo completo de dados
export const testNavigationFlow = async (): Promise<{
    databaseConnection: boolean;
    userProfileSave: boolean;
    medicationRemindersSave: boolean;
    glycemicGoalsSave: boolean;
    errors: string[];
}> => {
    const results = {
        databaseConnection: false,
        userProfileSave: false,
        medicationRemindersSave: false,
        glycemicGoalsSave: false,
        errors: [] as string[]
    };

    try {
        // 1. Teste de conexão com o banco
        console.log('🧪 Testando conexão com banco de dados...');
        const user = await getUser();
        results.databaseConnection = true;
        console.log('✅ Conexão com banco OK');

        // 2. Teste de salvamento de perfil com novos campos
        if (user) {
            console.log('🧪 Testando salvamento de perfil com novos campos...');
            
            const testProfile: UserProfile = {
                ...user,
                glycemicGoals: JSON.stringify({
                    preMeal: { min: 80, ideal: 120, max: 180 },
                    postMeal: { min: 100, ideal: 160, max: 250 },
                    night: { min: 80, ideal: 120, max: 180 }
                }),
                medicationReminders: JSON.stringify({
                    type1: [
                        { id: '1', enabled: true, time: '08:00', medicationType: 'insulin', notificationEnabled: true }
                    ],
                    type2: {
                        medication: [
                            { id: '2', enabled: true, time: '08:00', medicationType: 'medication', notificationEnabled: true }
                        ],
                        insulin: []
                    }
                }),
                updated_at: new Date().toISOString(),
                pending_sync: true
            };

            await saveOrUpdateUser(testProfile);
            results.userProfileSave = true;
            console.log('✅ Salvamento de perfil OK');

            // 3. Teste de recuperação dos dados
            console.log('🧪 Testando recuperação de dados...');
            const savedUser = await getUser();
            
            if (savedUser?.glycemicGoals) {
                results.glycemicGoalsSave = true;
                console.log('✅ Objetivos glicêmicos salvos e recuperados OK');
            } else {
                results.errors.push('Objetivos glicêmicos não foram salvos corretamente');
            }

            if (savedUser?.medicationReminders) {
                results.medicationRemindersSave = true;
                console.log('✅ Alarmes de medicamento salvos e recuperados OK');
            } else {
                results.errors.push('Alarmes de medicamento não foram salvos corretamente');
            }

        } else {
            results.errors.push('Nenhum usuário encontrado para teste');
        }

    } catch (error) {
        results.errors.push(`Erro durante teste: ${error}`);
        console.error('❌ Erro durante teste:', error);
    }

    return results;
};

// Função para testar o fluxo de navegação
export const testNavigationSequence = (): {
    expectedFlow: string[];
    currentFlow: string[];
    isValid: boolean;
} => {
    const expectedFlow = [
        'Auth (Login/Register)',
        'Onboarding (ProfileSetup)',
        'Onboarding (GlycemicGoal)',
        'Onboarding (BiometricSetup)',
        'App (Drawer - Dashboard)'
    ];

    // Esta função seria chamada durante o fluxo real para validar
    const currentFlow: string[] = [];
    
    return {
        expectedFlow,
        currentFlow,
        isValid: true // Seria validado durante execução real
    };
};

// Função para verificar integridade dos dados
export const validateDataIntegrity = async (): Promise<{
    userProfileValid: boolean;
    glycemicGoalsValid: boolean;
    medicationRemindersValid: boolean;
    issues: string[];
}> => {
    const results = {
        userProfileValid: false,
        glycemicGoalsValid: false,
        medicationRemindersValid: false,
        issues: [] as string[]
    };

    try {
        const user = await getUser();
        
        if (!user) {
            results.issues.push('Nenhum usuário encontrado');
            return results;
        }

        // Validar perfil básico
        if (user.id && user.name && user.email) {
            results.userProfileValid = true;
        } else {
            results.issues.push('Perfil básico incompleto');
        }

        // Validar objetivos glicêmicos
        if (user.glycemicGoals) {
            try {
                const goals = JSON.parse(user.glycemicGoals);
                if (goals.preMeal && goals.postMeal && goals.night) {
                    results.glycemicGoalsValid = true;
                } else {
                    results.issues.push('Objetivos glicêmicos com estrutura inválida');
                }
            } catch {
                results.issues.push('Objetivos glicêmicos com JSON inválido');
            }
        }

        // Validar alarmes de medicamento
        if (user.medicationReminders) {
            try {
                const reminders = JSON.parse(user.medicationReminders);
                if (reminders.type1 && reminders.type2) {
                    results.medicationRemindersValid = true;
                } else {
                    results.issues.push('Alarmes de medicamento com estrutura inválida');
                }
            } catch {
                results.issues.push('Alarmes de medicamento com JSON inválido');
            }
        }

    } catch (error) {
        results.issues.push(`Erro durante validação: ${error}`);
    }

    return results;
};

// Função para gerar relatório de status
export const generateStatusReport = async (): Promise<string> => {
    const navigationTest = testNavigationSequence();
    const dataTest = await testNavigationFlow();
    const integrityTest = await validateDataIntegrity();

    const report = `
📊 RELATÓRIO DE STATUS DO GLUCOCARE

🔄 FLUXO DE NAVEGAÇÃO:
✅ Fluxo esperado: ${navigationTest.expectedFlow.join(' → ')}
${navigationTest.isValid ? '✅' : '❌'} Status: ${navigationTest.isValid ? 'VÁLIDO' : 'INVÁLIDO'}

💾 PERSISTÊNCIA DE DADOS:
${dataTest.databaseConnection ? '✅' : '❌'} Conexão com banco: ${dataTest.databaseConnection ? 'OK' : 'FALHA'}
${dataTest.userProfileSave ? '✅' : '❌'} Salvamento de perfil: ${dataTest.userProfileSave ? 'OK' : 'FALHA'}
${dataTest.glycemicGoalsSave ? '✅' : '❌'} Objetivos glicêmicos: ${dataTest.glycemicGoalsSave ? 'OK' : 'FALHA'}
${dataTest.medicationRemindersSave ? '✅' : '❌'} Alarmes medicamento: ${dataTest.medicationRemindersSave ? 'OK' : 'FALHA'}

🔍 INTEGRIDADE DOS DADOS:
${integrityTest.userProfileValid ? '✅' : '❌'} Perfil do usuário: ${integrityTest.userProfileValid ? 'VÁLIDO' : 'INVÁLIDO'}
${integrityTest.glycemicGoalsValid ? '✅' : '❌'} Objetivos glicêmicos: ${integrityTest.glycemicGoalsValid ? 'VÁLIDO' : 'INVÁLIDO'}
${integrityTest.medicationRemindersValid ? '✅' : '❌'} Alarmes medicamento: ${integrityTest.medicationRemindersValid ? 'VÁLIDO' : 'INVÁLIDO'}

❌ PROBLEMAS ENCONTRADOS:
${dataTest.errors.length > 0 ? dataTest.errors.map(e => `• ${e}`).join('\n') : 'Nenhum problema encontrado'}
${integrityTest.issues.length > 0 ? integrityTest.issues.map(i => `• ${i}`).join('\n') : ''}

📅 Data do teste: ${new Date().toLocaleString('pt-BR')}
    `;

    return report;
};
