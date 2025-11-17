'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Trash2, RefreshCw } from 'lucide-react'
import { type Meal } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useState } from 'react'

interface HistoryTabProps {
  meals: Meal[]
  onRefresh: () => void
}

export default function HistoryTab({ meals, onRefresh }: HistoryTabProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Refeição removida com sucesso!')
      onRefresh()
    } catch (error) {
      console.error('Erro ao deletar refeição:', error)
      toast.error('Erro ao remover refeição.')
    } finally {
      setDeletingId(null)
    }
  }

  // Agrupar refeições por data
  const groupedMeals = meals.reduce((acc, meal) => {
    const date = format(new Date(meal.created_at), 'dd/MM/yyyy', { locale: ptBR })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(meal)
    return acc
  }, {} as Record<string, Meal[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Histórico</h2>
          <p className="text-gray-400">Todas as suas refeições registradas</p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Meals List */}
      {Object.keys(groupedMeals).length === 0 ? (
        <Card className="p-12 border-white/10 bg-black/20 backdrop-blur-sm text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center mx-auto shadow-lg">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhuma refeição registrada
              </h3>
              <p className="text-gray-400">
                Comece fotografando suas refeições para acompanhar sua nutrição
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMeals).map(([date, dateMeals]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">{date}</h3>
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-sm text-gray-400">
                  {dateMeals.reduce((sum, m) => sum + Number(m.total_calories), 0).toFixed(0)} kcal
                </span>
              </div>

              <div className="grid gap-4">
                {dateMeals.map((meal) => (
                  <Card key={meal.id} className="overflow-hidden border-white/10 bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row gap-4 p-4">
                      {/* Image */}
                      <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                        <img
                          src={meal.image_url}
                          alt="Refeição"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                                {meal.meal_type || 'Refeição'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(meal.created_at), 'HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                            <h4 className="font-semibold text-white text-lg">
                              {meal.total_calories.toFixed(0)} kcal
                            </h4>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(meal.id)}
                            disabled={deletingId === meal.id}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Macros */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-xs text-gray-400 mb-1">Proteínas</p>
                            <p className="text-sm font-semibold text-blue-400">
                              {Number(meal.total_protein).toFixed(1)}g
                            </p>
                          </div>
                          <div className="px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <p className="text-xs text-gray-400 mb-1">Carboidratos</p>
                            <p className="text-sm font-semibold text-orange-400">
                              {Number(meal.total_carbs).toFixed(1)}g
                            </p>
                          </div>
                          <div className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <p className="text-xs text-gray-400 mb-1">Gorduras</p>
                            <p className="text-sm font-semibold text-purple-400">
                              {Number(meal.total_fat).toFixed(1)}g
                            </p>
                          </div>
                        </div>

                        {/* Foods */}
                        <div className="space-y-1">
                          {meal.analysis.foods.map((food, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-gray-300">
                                {food.name} ({food.quantity})
                              </span>
                              <span className="text-gray-500">
                                {food.calories} kcal
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
