import { supabase, isSupabaseConfigured } from './supabase'

export type MealData = {
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
}

/**
 * Atualiza as estatísticas diárias quando uma refeição é adicionada
 */
export async function updateDailyStats(userId: string, mealData: MealData, date?: string) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado')
    return null
  }

  try {
    const targetDate = date || new Date().toISOString().split('T')[0]

    // Buscar estatísticas existentes do dia
    const { data: existingStats, error: fetchError } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existingStats) {
      // Atualizar estatísticas existentes
      const { data, error } = await supabase
        .from('daily_stats')
        .update({
          total_calories: existingStats.total_calories + mealData.total_calories,
          total_protein: existingStats.total_protein + mealData.total_protein,
          total_carbs: existingStats.total_carbs + mealData.total_carbs,
          total_fat: existingStats.total_fat + mealData.total_fat,
          meals_count: existingStats.meals_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStats.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Criar novas estatísticas
      const { data, error } = await supabase
        .from('daily_stats')
        .insert({
          user_id: userId,
          date: targetDate,
          total_calories: mealData.total_calories,
          total_protein: mealData.total_protein,
          total_carbs: mealData.total_carbs,
          total_fat: mealData.total_fat,
          meals_count: 1
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('Erro ao atualizar estatísticas diárias:', error)
    return null
  }
}

/**
 * Recalcula as estatísticas diárias baseado em todas as refeições do dia
 */
export async function recalculateDailyStats(userId: string, date?: string) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase não configurado')
    return null
  }

  try {
    const targetDate = date || new Date().toISOString().split('T')[0]
    const nextDay = new Date(targetDate)
    nextDay.setDate(nextDay.getDate() + 1)

    // Buscar todas as refeições do dia
    const { data: meals, error: mealsError } = await supabase
      .from('meals_complete')
      .select('total_calories, total_protein, total_carbs, total_fat')
      .eq('user_id', userId)
      .gte('created_at', targetDate)
      .lt('created_at', nextDay.toISOString().split('T')[0])

    if (mealsError) throw mealsError

    if (!meals || meals.length === 0) {
      // Deletar estatísticas se não houver refeições
      await supabase
        .from('daily_stats')
        .delete()
        .eq('user_id', userId)
        .eq('date', targetDate)
      
      return null
    }

    // Calcular totais
    const totals = meals.reduce(
      (acc, meal) => ({
        total_calories: acc.total_calories + (meal.total_calories || 0),
        total_protein: acc.total_protein + (meal.total_protein || 0),
        total_carbs: acc.total_carbs + (meal.total_carbs || 0),
        total_fat: acc.total_fat + (meal.total_fat || 0)
      }),
      { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 }
    )

    // Verificar se já existe estatística
    const { data: existingStats } = await supabase
      .from('daily_stats')
      .select('id')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .single()

    if (existingStats) {
      // Atualizar
      const { data, error } = await supabase
        .from('daily_stats')
        .update({
          ...totals,
          meals_count: meals.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStats.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Criar
      const { data, error } = await supabase
        .from('daily_stats')
        .insert({
          user_id: userId,
          date: targetDate,
          ...totals,
          meals_count: meals.length
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('Erro ao recalcular estatísticas diárias:', error)
    return null
  }
}
