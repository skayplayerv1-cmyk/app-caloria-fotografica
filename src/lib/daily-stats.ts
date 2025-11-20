import { supabase, isSupabaseConfigured } from './supabase'

export type DailyStatsUpdate = {
  calories: number
  protein: number
  carbs: number
  fat: number
}

/**
 * Atualiza as estatísticas diárias do usuário
 * Chamado automaticamente após adicionar uma refeição
 */
export async function updateDailyStats(userId: string, mealData: DailyStatsUpdate): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  try {
    const today = new Date().toISOString().split('T')[0]

    // Buscar estatísticas do dia
    const { data: existingStats, error: fetchError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existingStats) {
      // Atualizar estatísticas existentes
      const { error: updateError } = await supabase
        .from('daily_stats')
        .update({
          total_calories: existingStats.total_calories + mealData.calories,
          total_protein: existingStats.total_protein + mealData.protein,
          total_carbs: existingStats.total_carbs + mealData.carbs,
          total_fat: existingStats.total_fat + mealData.fat,
          meals_count: existingStats.meals_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStats.id)

      if (updateError) throw updateError
    } else {
      // Criar novas estatísticas
      const { error: insertError } = await supabase
        .from('daily_stats')
        .insert({
          user_id: userId,
          date: today,
          total_calories: mealData.calories,
          total_protein: mealData.protein,
          total_carbs: mealData.carbs,
          total_fat: mealData.fat,
          meals_count: 1
        })

      if (insertError) throw insertError
    }

    return true
  } catch (error) {
    console.error('Erro ao atualizar estatísticas diárias:', error)
    return false
  }
}

/**
 * Busca as estatísticas do dia atual
 */
export async function getTodayStats(userId: string) {
  if (!isSupabaseConfigured()) return null

  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    return data || {
      total_calories: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fat: 0,
      meals_count: 0
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dia:', error)
    return null
  }
}

/**
 * Busca estatísticas dos últimos N dias
 */
export async function getLastDaysStats(userId: string, days: number = 7) {
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
    return data || []
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return []
  }
}
