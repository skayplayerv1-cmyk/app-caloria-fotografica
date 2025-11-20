import { createClient } from '@supabase/supabase-js'
import { updateDailyStats } from './daily-stats-updater'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('placeholder') &&
    supabaseUrl.includes('supabase.co')
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'fatsecret-auth-token',
    flowType: 'pkce'
  }
})

// Types
export type Meal = {
  id: string
  user_id: string
  image_url: string
  analysis: {
    foods: Array<{
      name: string
      quantity: string
      calories: number
      protein: number
      carbs: number
      fat: number
    }>
  }
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  meal_type?: string
  created_at: string
}

export type Profile = {
  id: string
  email: string
  full_name?: string
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

// Meal operations
export const mealOperations = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('meals_complete')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Meal[]
  },

  async create(meal: Omit<Meal, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('meals_complete')
      .insert(meal)
      .select()
      .single()
    
    if (error) throw error

    // Atualizar estatísticas diárias automaticamente
    if (data) {
      await updateDailyStats(meal.user_id, {
        total_calories: meal.total_calories,
        total_protein: meal.total_protein,
        total_carbs: meal.total_carbs,
        total_fat: meal.total_fat
      })
    }

    return data as Meal
  },

  async getToday(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('meals_complete')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Meal[]
  },

  async delete(mealId: string, userId: string) {
    const { error } = await supabase
      .from('meals_complete')
      .delete()
      .eq('id', mealId)
      .eq('user_id', userId)
    
    if (error) throw error

    // Recalcular estatísticas após deletar
    const { recalculateDailyStats } = await import('./daily-stats-updater')
    await recalculateDailyStats(userId)
  }
}
