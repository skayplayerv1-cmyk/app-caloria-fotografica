'use client'

import { Card } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react'
import { type Meal } from '@/lib/supabase'
import { format, subDays, startOfDay } from 'date-fns'

interface DashboardTabProps {
  meals: Meal[]
  userId: string
}

export default function DashboardTab({ meals }: DashboardTabProps) {
  // Dados dos últimos 7 dias
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dayMeals = meals.filter(m => 
      startOfDay(new Date(m.created_at)).getTime() === startOfDay(date).getTime()
    )
    
    return {
      date: format(date, 'dd/MM'),
      calories: dayMeals.reduce((sum, m) => sum + Number(m.total_calories), 0),
      protein: dayMeals.reduce((sum, m) => sum + Number(m.total_protein), 0),
      carbs: dayMeals.reduce((sum, m) => sum + Number(m.total_carbs), 0),
      fat: dayMeals.reduce((sum, m) => sum + Number(m.total_fat), 0)
    }
  })

  // Totais de hoje
  const today = meals.filter(m => 
    new Date(m.created_at).toDateString() === new Date().toDateString()
  )
  
  const todayTotals = {
    calories: today.reduce((sum, m) => sum + Number(m.total_calories), 0),
    protein: today.reduce((sum, m) => sum + Number(m.total_protein), 0),
    carbs: today.reduce((sum, m) => sum + Number(m.total_carbs), 0),
    fat: today.reduce((sum, m) => sum + Number(m.total_fat), 0)
  }

  // Dados para gráfico de pizza (macros de hoje)
  const macrosData = [
    { name: 'Proteínas', value: todayTotals.protein * 4, color: '#3b82f6' },
    { name: 'Carboidratos', value: todayTotals.carbs * 4, color: '#f59e0b' },
    { name: 'Gorduras', value: todayTotals.fat * 9, color: '#a855f7' }
  ]

  // Média semanal
  const weeklyAverage = {
    calories: last7Days.reduce((sum, d) => sum + d.calories, 0) / 7,
    protein: last7Days.reduce((sum, d) => sum + d.protein, 0) / 7,
    carbs: last7Days.reduce((sum, d) => sum + d.carbs, 0) / 7,
    fat: last7Days.reduce((sum, d) => sum + d.fat, 0) / 7
  }

  // Comparação com ontem
  const yesterday = meals.filter(m => {
    const date = new Date(m.created_at)
    const yesterdayDate = subDays(new Date(), 1)
    return date.toDateString() === yesterdayDate.toDateString()
  })
  
  const yesterdayCalories = yesterday.reduce((sum, m) => sum + Number(m.total_calories), 0)
  const caloriesDiff = todayTotals.calories - yesterdayCalories
  const caloriesTrend = caloriesDiff > 0 ? 'up' : 'down'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Acompanhe seu progresso nutricional</p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-white/10 bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Target className="w-6 h-6 text-white" />
            </div>
            {caloriesDiff !== 0 && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                caloriesTrend === 'up' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {caloriesTrend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span className="text-xs font-medium">{Math.abs(caloriesDiff).toFixed(0)}</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Calorias Hoje</p>
            <p className="text-3xl font-bold text-white">{todayTotals.calories.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-1">Meta: 2000 kcal</p>
          </div>
        </Card>

        <Card className="p-6 border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Proteínas</p>
            <p className="text-3xl font-bold text-white">{todayTotals.protein.toFixed(1)}g</p>
            <p className="text-xs text-gray-500 mt-1">Média: {weeklyAverage.protein.toFixed(1)}g/dia</p>
          </div>
        </Card>

        <Card className="p-6 border-white/10 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/20 mb-4">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Carboidratos</p>
            <p className="text-3xl font-bold text-white">{todayTotals.carbs.toFixed(1)}g</p>
            <p className="text-xs text-gray-500 mt-1">Média: {weeklyAverage.carbs.toFixed(1)}g/dia</p>
          </div>
        </Card>

        <Card className="p-6 border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Gorduras</p>
            <p className="text-3xl font-bold text-white">{todayTotals.fat.toFixed(1)}g</p>
            <p className="text-xs text-gray-500 mt-1">Média: {weeklyAverage.fat.toFixed(1)}g/dia</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Gráfico de Calorias (7 dias) */}
        <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Calorias - Últimos 7 Dias</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="calories" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Macros (Hoje) */}
        <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Distribuição de Macros - Hoje</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={macrosData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {macrosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number) => `${value.toFixed(0)} kcal`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {macrosData.map((macro) => (
              <div key={macro.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: macro.color }} />
                <span className="text-sm text-gray-400">{macro.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Gráfico de Barras - Macros Semanais */}
      <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Macronutrientes - Últimos 7 Dias</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={last7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="protein" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            <Bar dataKey="carbs" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            <Bar dataKey="fat" fill="#a855f7" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-gray-400">Proteínas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-sm text-gray-400">Carboidratos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm text-gray-400">Gorduras</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
