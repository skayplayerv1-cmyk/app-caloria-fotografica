/**
 * Dados mockados para testes e desenvolvimento
 * Use quando o Supabase não estiver configurado
 */

export const mockUserProfile = {
  id: 'mock-user-id',
  email: 'usuario@exemplo.com',
  full_name: 'Usuário Teste',
  weight: 75,
  height: 175,
  age: 30,
  gender: 'male' as const,
  activity_level: 'moderate' as const,
  goal: 'maintain' as const,
  daily_calorie_goal: 2200,
  daily_protein_goal: 150,
  daily_carbs_goal: 275,
  daily_fat_goal: 61,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const mockDailyStats = {
  id: 'mock-stats-id',
  user_id: 'mock-user-id',
  date: new Date().toISOString().split('T')[0],
  total_calories: 1450,
  total_protein: 95,
  total_carbs: 180,
  total_fat: 42,
  meals_count: 3,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const mockMeals = [
  {
    id: 'mock-meal-1',
    user_id: 'mock-user-id',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    analysis: {
      foods: [
        {
          name: 'Arroz integral',
          quantity: '150g',
          calories: 180,
          protein: 4,
          carbs: 38,
          fat: 2
        },
        {
          name: 'Frango grelhado',
          quantity: '120g',
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 4
        },
        {
          name: 'Brócolis',
          quantity: '100g',
          calories: 35,
          protein: 3,
          carbs: 7,
          fat: 0
        }
      ]
    },
    total_calories: 380,
    total_protein: 38,
    total_carbs: 45,
    total_fat: 6,
    meal_type: 'Almoço',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-meal-2',
    user_id: 'mock-user-id',
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
    analysis: {
      foods: [
        {
          name: 'Pão integral',
          quantity: '2 fatias',
          calories: 160,
          protein: 8,
          carbs: 28,
          fat: 2
        },
        {
          name: 'Ovo mexido',
          quantity: '2 ovos',
          calories: 180,
          protein: 13,
          carbs: 2,
          fat: 14
        },
        {
          name: 'Abacate',
          quantity: '50g',
          calories: 80,
          protein: 1,
          carbs: 4,
          fat: 7
        }
      ]
    },
    total_calories: 420,
    total_protein: 22,
    total_carbs: 34,
    total_fat: 23,
    meal_type: 'Café da manhã',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-meal-3',
    user_id: 'mock-user-id',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    analysis: {
      foods: [
        {
          name: 'Salada verde',
          quantity: '200g',
          calories: 50,
          protein: 3,
          carbs: 10,
          fat: 0
        },
        {
          name: 'Salmão grelhado',
          quantity: '150g',
          calories: 280,
          protein: 32,
          carbs: 0,
          fat: 17
        },
        {
          name: 'Batata doce',
          quantity: '100g',
          calories: 90,
          protein: 2,
          carbs: 21,
          fat: 0
        }
      ]
    },
    total_calories: 420,
    total_protein: 37,
    total_carbs: 31,
    total_fat: 17,
    meal_type: 'Jantar',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
]

export const mockWeeklyStats = [
  {
    id: 'mock-week-1',
    user_id: 'mock-user-id',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_calories: 2100,
    total_protein: 140,
    total_carbs: 260,
    total_fat: 58,
    meals_count: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-week-2',
    user_id: 'mock-user-id',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_calories: 1950,
    total_protein: 135,
    total_carbs: 240,
    total_fat: 55,
    meals_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-week-3',
    user_id: 'mock-user-id',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_calories: 2250,
    total_protein: 155,
    total_carbs: 280,
    total_fat: 62,
    meals_count: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-week-4',
    user_id: 'mock-user-id',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_calories: 2050,
    total_protein: 145,
    total_carbs: 255,
    total_fat: 57,
    meals_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-week-5',
    user_id: 'mock-user-id',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_calories: 2180,
    total_protein: 150,
    total_carbs: 270,
    total_fat: 60,
    meals_count: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mock-week-6',
    user_id: 'mock-user-id',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    total_calories: 1980,
    total_protein: 138,
    total_carbs: 245,
    total_fat: 54,
    meals_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  mockDailyStats
]
