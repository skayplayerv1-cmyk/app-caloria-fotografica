'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { type Meal } from '@/lib/supabase'
import { useState } from 'react'
import { toast } from 'sonner'
import { mealOperations } from '@/lib/supabase'

interface HistoryTabProps {
  meals: Meal[]
  onRefresh: () => void
}

export default function HistoryTab({ meals, onRefresh }: HistoryTabProps) {
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (mealId: string) => {
    setDeletingId(mealId)
    try {
      await mealOperations.delete(mealId)
      toast.success('Refeição removida')
      onRefresh()
    } catch (error) {
      console.error('Erro ao deletar:', error)
      toast.error('Erro ao remover refeição')
    } finally {
      setDeletingId(null)
    }
  }

  const sortedMeals = [...meals].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const groupedMeals = sortedMeals.reduce((acc, meal) => {
    const date = new Date(meal.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(meal)
    return acc
  }, {} as Record<string, Meal[]>)

  if (meals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white">Histórico</h2>
          <p className="text-gray-400">Suas refeições registradas</p>
        </div>

        <Card className="p-12 border-white/10 bg-black/20 backdrop-blur-sm text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma refeição ainda</h3>
              <p className="text-gray-400">Comece fotografando sua primeira refeição</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white">Histórico</h2>
        <p className="text-gray-400">{meals.length} refeições registradas</p>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedMeals).map(([date, dayMeals]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              {date}
            </h3>
            
            <div className="space-y-3">
              {dayMeals.map((meal) => {
                const isExpanded = expandedMeal === meal.id
                const time = new Date(meal.created_at).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })

                return (
                  <Card key={meal.id} className="overflow-hidden border-white/10 bg-black/20 backdrop-blur-sm">
                    <div className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-start gap-4">
                        {meal.image_url && (
                          <img
                            src={meal.image_url}
                            alt="Refeição"
                            className="w-20 h-20 rounded-xl object-cover"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-semibold text-white">{meal.meal_type}</h4>
                              <p className="text-sm text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {time}
                              </p>
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

                          {/* Totais */}
                          <div className="grid grid-cols-4 gap-2 mt-3">
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Calorias</p>
                              <p className="text-sm font-semibold text-orange-400">
                                {Number(meal.total_calories).toFixed(0)}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Proteínas</p>
                              <p className="text-sm font-semibold text-blue-400">
                                {Number(meal.total_protein).toFixed(1)}g
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Carbs</p>
                              <p className="text-sm font-semibold text-yellow-400">
                                {Number(meal.total_carbs).toFixed(1)}g
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-400">Gorduras</p>
                              <p className="text-sm font-semibold text-purple-400">
                                {Number(meal.total_fat).toFixed(1)}g
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandir Detalhes */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedMeal(isExpanded ? null : meal.id)}
                        className="w-full text-gray-400 hover:text-white"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Ocultar detalhes
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Ver detalhes
                          </>
                        )}
                      </Button>

                      {/* Detalhes Expandidos */}
                      {isExpanded && meal.analysis && (
                        <div className="pt-4 border-t border-white/10 space-y-3">
                          <h5 className="text-sm font-semibold text-white">Alimentos Detectados:</h5>
                          <div className="space-y-2">
                            {meal.analysis.foods.map((food: any, i: number) => (
                              <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="font-medium text-white">{food.name}</p>
                                    <p className="text-xs text-gray-400">{food.portion}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-orange-400">
                                      {food.calories} kcal
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                  <div>
                                    <span className="text-gray-400">P: </span>
                                    <span className="text-blue-400 font-medium">{food.protein}g</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">C: </span>
                                    <span className="text-yellow-400 font-medium">{food.carbs}g</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">G: </span>
                                    <span className="text-purple-400 font-medium">{food.fat}g</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {meal.analysis.notes && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <p className="text-sm text-emerald-400">
                                <span className="font-semibold">Observações: </span>
                                {meal.analysis.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
