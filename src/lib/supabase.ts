import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

export type ChatMessage = {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}
