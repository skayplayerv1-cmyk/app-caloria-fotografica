'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Target, Calendar, Flame, Activity, Loader2 } from 'lucide-react'
import { type Meal } from '@/lib/supabase'
import { profileOperations, dailyStatsOperations, type UserProfile, type DailyStats } from '@/lib/profile'

interface DashboardTabProps {
  meals: Meal[]
  userId: string
}

export default function DashboardTab({ meals, userId }: DashboardTabProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      const [profileData, statsData] = await Promise.all([
        profileOperations.get(userId),
        dailyStatsOperations.getLastDays(userId, 7)
      ])
      setProfile(profileData)
      setDailyStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const todayMeals = meals.filter(m => new Date(m.created_at).toDateString() === today)
    
    const totalCalories = todayMeals.reduce((sum, m) => sum + Number(m.total_calories), 0)
    const totalProtein = todayMeals.reduce((sum, m) => sum + Number(m.total_protein), 0)
    const totalCarbs = todayMeals.reduce((sum, m) => sum + Number(m.total_carbs), 0)
    const totalFat = todayMeals.reduce((sum, m) => sum + Number(m.total_fat), 0)

    // Últimos 7 dias - usar dailyStats se disponível, senão calcular dos meals
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const weeklyData = last7Days.map(date => {
      // Tentar usar dailyStats primeiro
      const stat = dailyStats.find(s => s.date === date)
      if (stat) {
        return {
          date,
          calories: stat.total_calories,
          protein: stat.total_protein,
          carbs: stat.total_carbs,
          fat: stat.total_fat
        }
      }

      // Fallback: calcular dos meals
      const dayMeals = meals.filter(m => m.created_at.split('T')[0] === date)
      return {
        date,
        calories: dayMeals.reduce((sum, m) => sum + Number(m.total_calories), 0),
        protein: dayMeals.reduce((sum, m) => sum + Number(m.total_protein), 0),
        carbs: dayMeals.reduce((sum, m) => sum + Number(m.total_carbs), 0),
        fat: dayMeals.reduce((sum, m) => sum + Number(m.total_fat), 0)
      }
    })

    const avgCalories = weeklyData.reduce((sum, d) => sum + d.calories, 0) / 7

    return {
      today: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat },
      weekly: weeklyData,
      avgCalories,
      totalMeals: todayMeals.length
    }
  }, [meals, dailyStats])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  // Usar metas do perfil ou valores padrão
  const calorieGoal = profile?.daily_calorie_goal || 2000
  const proteinGoal = profile?.daily_protein_goal || 150
  const carbsGoal = profile?.daily_carbs_goal || 250
  const fatGoal = profile?.daily_fat_goal || 65

  const progress = (stats.today.calories / calorieGoal) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400">Acompanhe seu progresso nutricional</p>
      </div>

      {/* Meta Diária */}
      <Card className="p-6 border-white/10 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Meta Diária</h3>
                <p className="text-sm text-gray-400">Calorias consumidas hoje</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {stats.today.calories.toFixed(0)}
              </p>
              <p className="text-sm text-gray-400">de {calorieGoal} kcal</p>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">{progress.toFixed(0)}% da meta</span>
              {progress > 100 && (
                <span className="text-orange-400 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Meta excedida
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Macronutrientes Hoje */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5 border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Proteínas</span>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.today.protein.toFixed(1)}
                <span className="text-sm text-gray-400 ml-1">g</span>
              </p>
              <p className="text-xs text-gray-500">Meta: {proteinGoal}g</p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                style={{ width: `${Math.min((stats.today.protein / proteinGoal) * 100, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Carboidratos</span>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.today.carbs.toFixed(1)}
                <span className="text-sm text-gray-400 ml-1">g</span>
              </p>
              <p className="text-xs text-gray-500">Meta: {carbsGoal}g</p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                style={{ width: `${Math.min((stats.today.carbs / carbsGoal) * 100, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Gorduras</span>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.today.fat.toFixed(1)}
                <span className="text-sm text-gray-400 ml-1">g</span>
              </p>
              <p className="text-xs text-gray-500">Meta: {fatGoal}g</p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: `${Math.min((stats.today.fat / fatGoal) * 100, 100)}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Gráfico Semanal */}
      <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Últimos 7 Dias</h3>
              <p className="text-sm text-gray-400">Média: {stats.avgCalories.toFixed(0)} kcal/dia</p>
            </div>
          </div>

          <div className="space-y-3">
            {stats.weekly.map((day, i) => {
              const dayName = new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })
              const percentage = (day.calories / calorieGoal) * 100

              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 capitalize">{dayName}</span>
                    <span className="text-white font-medium">{day.calories.toFixed(0)} kcal</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Refeições Hoje</p>
            <p className="text-3xl font-bold text-white">{stats.totalMeals}</p>
          </div>
        </Card>

        <Card className="p-5 border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Total Registrado</p>
            <p className="text-3xl font-bold text-white">{meals.length}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
