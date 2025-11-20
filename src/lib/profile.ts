import { supabase, isSupabaseConfigured } from './supabase'

export type UserProfile = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  weight?: number
  height?: number
  age?: number
  gender?: 'male' | 'female' | 'other'
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal?: 'lose_weight' | 'maintain' | 'gain_weight' | 'gain_muscle'
  daily_calorie_goal: number
  daily_protein_goal: number
  daily_carbs_goal: number
  daily_fat_goal: number
  created_at: string
  updated_at: string
}

export type DailyStats = {
  id: string
  user_id: string
  date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  meals_count: number
  created_at: string
  updated_at: string
}

// Calcular BMR (Basal Metabolic Rate)
function calculateBMR(weight: number, height: number, age: number, gender: 'male' | 'female' | 'other'): number {
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
  } else {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
  }
}

// Calcular TDEE (Total Daily Energy Expenditure)
function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }
  return bmr * (multipliers[activityLevel] || 1.55)
}

// Calcular metas diárias
export function calculateDailyGoals(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other',
  activityLevel: string,
  goal: string
): {
  calories: number
  protein: number
  carbs: number
  fat: number
} {
  const bmr = calculateBMR(weight, height, age, gender)
  const tdee = calculateTDEE(bmr, activityLevel)

  const goalAdjustments: Record<string, number> = {
    lose_weight: -500,
    maintain: 0,
    gain_weight: 300,
    gain_muscle: 400
  }

  const calories = Math.round(tdee + (goalAdjustments[goal] || 0))
  const protein = Math.round(weight * 2)
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4)

  return { calories, protein, carbs, fat }
}

// Profile operations
export const profileOperations = {
  async get(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data as UserProfile
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      return null
    }
  },

  async create(userId: string, email: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null

    try {
      const goals = calculateDailyGoals(75, 175, 30, 'male', 'moderate', 'maintain')
      
      const profile = {
        id: userId,
        email,
        full_name: email.split('@')[0],
        weight: 75,
        height: 175,
        age: 30,
        gender: 'male' as const,
        activity_level: 'moderate' as const,
        goal: 'maintain' as const,
        daily_calorie_goal: goals.calories,
        daily_protein_goal: goals.protein,
        daily_carbs_goal: goals.carbs,
        daily_fat_goal: goals.fat
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(profile)
        .select()
        .single()

      if (error) throw error
      return data as UserProfile
    } catch (error) {
      console.error('Erro ao criar perfil:', error)
      return null
    }
  },

  async update(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null

    try {
      // Recalcular metas se necessário
      if (updates.weight || updates.height || updates.age || updates.activity_level || updates.goal) {
        const profile = await profileOperations.get(userId)
        if (profile) {
          const weight = updates.weight || profile.weight || 75
          const height = updates.height || profile.height || 175
          const age = updates.age || profile.age || 30
          const gender = updates.gender || profile.gender || 'male'
          const activityLevel = updates.activity_level || profile.activity_level || 'moderate'
          const goal = updates.goal || profile.goal || 'maintain'

          const goals = calculateDailyGoals(weight, height, age, gender, activityLevel, goal)
          
          updates.daily_calorie_goal = goals.calories
          updates.daily_protein_goal = goals.protein
          updates.daily_carbs_goal = goals.carbs
          updates.daily_fat_goal = goals.fat
        }
      }

      updates.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data as UserProfile
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      return null
    }
  }
}

// Daily stats operations
export const dailyStatsOperations = {
  async getByDate(userId: string, date: string): Promise<DailyStats | null> {
    if (!isSupabaseConfigured()) return null

    try {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as DailyStats | null
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return null
    }
  },

  async getLastDays(userId: string, days: number = 7): Promise<DailyStats[]> {
    if (!isSupabaseConfigured()) return []

    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false })

      if (error) throw error
      return data as DailyStats[]
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return []
    }
  }
}
