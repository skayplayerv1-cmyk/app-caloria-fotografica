'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Save, Loader2, TrendingUp, Target, Activity } from 'lucide-react'
import { profileOperations, calculateDailyGoals, type UserProfile } from '@/lib/profile'
import { toast } from 'sonner'

type ProfileTabProps = {
  userId: string
}

export default function ProfileTab({ userId }: ProfileTabProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    weight: '',
    height: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    activity_level: 'moderate' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
    goal: 'maintain' as 'lose_weight' | 'maintain' | 'gain_weight' | 'gain_muscle'
  })

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      const data = await profileOperations.get(userId)
      setProfile(data)
      setFormData({
        full_name: data.full_name || '',
        weight: data.weight?.toString() || '',
        height: data.height?.toString() || '',
        age: data.age?.toString() || '',
        gender: data.gender || 'male',
        activity_level: data.activity_level || 'moderate',
        goal: data.goal || 'maintain'
      })
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast.error('Erro ao carregar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: Partial<UserProfile> = {
        full_name: formData.full_name,
        weight: parseFloat(formData.weight) || undefined,
        height: parseFloat(formData.height) || undefined,
        age: parseInt(formData.age) || undefined,
        gender: formData.gender,
        activity_level: formData.activity_level,
        goal: formData.goal
      }

      const updatedProfile = await profileOperations.update(userId, updates)
      setProfile(updatedProfile)
      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      toast.error('Erro ao salvar perfil')
    } finally {
      setSaving(false)
    }
  }

  // Calcular preview das metas
  const previewGoals = formData.weight && formData.height && formData.age
    ? calculateDailyGoals(
        parseFloat(formData.weight),
        parseFloat(formData.height),
        parseInt(formData.age),
        formData.gender,
        formData.activity_level,
        formData.goal
      )
    : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Meu Perfil</h2>
          <p className="text-sm text-gray-400">Configure suas informações e metas</p>
        </div>
      </div>

      {/* Informações Pessoais */}
      <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-sm space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">Informações Pessoais</h3>
        
        <div className="space-y-2">
          <Label className="text-gray-300">Nome Completo</Label>
          <Input
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Seu nome"
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Peso (kg)</Label>
            <Input
              type="number"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="75"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Altura (cm)</Label>
            <Input
              type="number"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              placeholder="175"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Idade</Label>
            <Input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="30"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Sexo</Label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
              className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white"
            >
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Nível de Atividade */}
      <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Nível de Atividade</h3>
        </div>
        
        <div className="space-y-2">
          <select
            value={formData.activity_level}
            onChange={(e) => setFormData({ ...formData, activity_level: e.target.value as any })}
            className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white"
          >
            <option value="sedentary">Sedentário (pouco ou nenhum exercício)</option>
            <option value="light">Leve (exercício 1-3x/semana)</option>
            <option value="moderate">Moderado (exercício 3-5x/semana)</option>
            <option value="active">Ativo (exercício 6-7x/semana)</option>
            <option value="very_active">Muito Ativo (exercício intenso diário)</option>
          </select>
        </div>
      </Card>

      {/* Objetivo */}
      <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold text-white">Objetivo</h3>
        </div>
        
        <div className="space-y-2">
          <select
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
            className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white"
          >
            <option value="lose_weight">Perder Peso (-500 kcal/dia)</option>
            <option value="maintain">Manter Peso</option>
            <option value="gain_weight">Ganhar Peso (+300 kcal/dia)</option>
            <option value="gain_muscle">Ganhar Massa Muscular (+400 kcal/dia)</option>
          </select>
        </div>
      </Card>

      {/* Preview das Metas */}
      {previewGoals && (
        <Card className="p-6 border-white/10 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Suas Metas Diárias</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{previewGoals.calories}</p>
              <p className="text-xs text-gray-400">Calorias</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{previewGoals.protein}g</p>
              <p className="text-xs text-gray-400">Proteínas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">{previewGoals.carbs}g</p>
              <p className="text-xs text-gray-400">Carboidratos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">{previewGoals.fat}g</p>
              <p className="text-xs text-gray-400">Gorduras</p>
            </div>
          </div>
        </Card>
      )}

      {/* Botão Salvar */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-emerald-500/30"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Salvar Alterações
          </>
        )}
      </Button>
    </div>
  )
}
