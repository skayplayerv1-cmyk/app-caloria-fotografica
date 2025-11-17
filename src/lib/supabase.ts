import { createClient } from '@supabase/supabase-js'

// Valores padrão seguros para evitar erros
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Verificar se as credenciais estão configuradas
const isConfigured = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

if (!isConfigured) {
  console.warn('⚠️ Supabase não configurado. Configure nas variáveis de ambiente.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // DESABILITAR confirmação de email para desenvolvimento
    flowType: 'pkce'
  }
})

// Helper para verificar se está configurado
export const isSupabaseConfigured = () => isConfigured

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

export type Profile = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// Helper functions para facilitar operações comuns
export const mealOperations = {
  // Buscar todas as refeições do usuário
  async getAll(userId: string) {
    if (!isConfigured) throw new Error('Supabase não configurado')
    
    const { data, error } = await supabase
      .from('meals_complete')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Meal[]
  },

  // Adicionar nova refeição
  async create(meal: Omit<Meal, 'id' | 'created_at'>) {
    if (!isConfigured) throw new Error('Supabase não configurado')
    
    const { data, error } = await supabase
      .from('meals_complete')
      .insert(meal)
      .select()
      .single()
    
    if (error) throw error
    return data as Meal
  },

  // Buscar refeições de hoje
  async getToday(userId: string) {
    if (!isConfigured) throw new Error('Supabase não configurado')
    
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
  }
}

export const chatOperations = {
  // Buscar mensagens do chat
  async getMessages(userId: string, limit = 50) {
    if (!isConfigured) throw new Error('Supabase não configurado')
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit)
    
    if (error) throw error
    return data as ChatMessage[]
  },

  // Adicionar nova mensagem
  async addMessage(message: Omit<ChatMessage, 'id' | 'created_at'>) {
    if (!isConfigured) throw new Error('Supabase não configurado')
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert(message)
      .select()
      .single()
    
    if (error) throw error
    return data as ChatMessage
  }
}
