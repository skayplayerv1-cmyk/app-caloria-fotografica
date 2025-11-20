'use client'

import { useState, useEffect } from 'react'
import { Camera, TrendingUp, MessageCircle, Home, BarChart3, Upload, Loader2, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase, mealOperations, type Meal } from '@/lib/supabase'
import { analyzeMealImage } from '@/lib/openai'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import DashboardTab from '@/components/custom/dashboard-tab'
import ChatTab from '@/components/custom/chat-tab'
import HistoryTab from '@/components/custom/history-tab'
import ProfileTab from '@/components/custom/profile-tab'

export default function FatSecretApp() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [meals, setMeals] = useState<Meal[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)

  useEffect(() => {
    // Verificar sessão inicial
    const initAuth = async () => {
      try {
        console.log('🔍 Verificando sessão inicial...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Erro ao verificar sessão:', error)
          setNeedsLogin(true)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('✅ Sessão encontrada:', session.user.id)
          setUserId(session.user.id)
          setUserEmail(session.user.email || null)
          setNeedsLogin(false)
        } else {
          console.log('⚠️ Sem sessão ativa')
          setNeedsLogin(true)
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error)
        setNeedsLogin(true)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
    
    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Login detectado, carregando app...')
        setUserId(session.user.id)
        setUserEmail(session.user.email || null)
        setNeedsLogin(false)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 Logout detectado')
        setUserId(null)
        setUserEmail(null)
        setNeedsLogin(true)
        setLoading(false)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token atualizado')
        setUserId(session.user.id)
        setUserEmail(session.user.email || null)
        setNeedsLogin(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (userId) {
      loadMeals()
    }
  }, [userId])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      toast.success('Logout realizado com sucesso!')
      setNeedsLogin(true)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast.error('Erro ao sair')
    }
  }

  const loadMeals = async () => {
    if (!userId) return

    try {
      const data = await mealOperations.getAll(userId)
      setMeals(data)
    } catch (error) {
      console.error('Erro ao carregar refeições:', error)
      toast.error('Erro ao carregar refeições')
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !userId) return

    setIsAnalyzing(true)
    const loadingToast = toast.loading('Analisando sua refeição...')

    try {
      // Converter imagem para base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = async () => {
        try {
          const base64Image = reader.result as string

          // Analisar com OpenAI
          const analysis = await analyzeMealImage(base64Image)

          // Calcular totais
          const totals = analysis.foods.reduce(
            (acc: any, food: any) => ({
              calories: acc.calories + food.calories,
              protein: acc.protein + food.protein,
              carbs: acc.carbs + food.carbs,
              fat: acc.fat + food.fat
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          )

          // Salvar no Supabase
          await mealOperations.create({
            user_id: userId,
            image_url: base64Image,
            analysis,
            total_calories: totals.calories,
            total_protein: totals.protein,
            total_carbs: totals.carbs,
            total_fat: totals.fat,
            meal_type: getMealType()
          })

          toast.success('Refeição analisada com sucesso!', { id: loadingToast })
          await loadMeals()
          setActiveTab('history')
        } catch (error) {
          console.error('Erro ao processar análise:', error)
          toast.error('Erro ao analisar refeição. Tente novamente.', { id: loadingToast })
        }
      }

      reader.onerror = () => {
        toast.error('Erro ao ler arquivo. Tente novamente.', { id: loadingToast })
        setIsAnalyzing(false)
      }
    } catch (error) {
      console.error('Erro ao analisar refeição:', error)
      toast.error('Erro ao analisar refeição. Tente novamente.', { id: loadingToast })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getMealType = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Café da Manhã'
    if (hour < 16) return 'Almoço'
    if (hour < 20) return 'Lanche'
    return 'Jantar'
  }

  // Tela de loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  // Tela de login necessário
  if (needsLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 border-white/10 bg-black/40 backdrop-blur-xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-2xl shadow-emerald-500/30 mx-auto">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              FatSecret
            </h1>
            <p className="text-gray-400">Faça login para acessar o app</p>
          </div>
          <Button
            onClick={() => router.push('/login')}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold py-6 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
          >
            Ir para Login
          </Button>
        </Card>
      </div>
    )
  }

  const todayCalories = meals
    .filter(m => new Date(m.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, m) => sum + Number(m.total_calories), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header Premium */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  FatSecret
                </h1>
                <p className="text-xs text-gray-400">Nutrição Inteligente</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium text-emerald-400">
                  {todayCalories.toFixed(0)} kcal hoje
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-400 hover:text-white hover:bg-white/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="home" className="mt-0 space-y-6">
            {/* Hero Section */}
            <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5" />
              <div className="relative p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 shadow-2xl shadow-emerald-500/30 mb-4">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">
                  Fotografe sua Refeição
                </h2>
                <p className="text-gray-400 max-w-md mx-auto">
                  Nossa IA analisa instantaneamente os alimentos, calcula calorias e macronutrientes com precisão profissional
                </p>
                
                <div className="pt-4">
                  <label htmlFor="meal-upload">
                    <Button
                      size="lg"
                      disabled={isAnalyzing}
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold px-8 py-6 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/40"
                      asChild
                    >
                      <span className="cursor-pointer flex items-center gap-2">
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Analisando...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Adicionar Refeição
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  <input
                    id="meal-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isAnalyzing}
                  />
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Calorias', value: todayCalories.toFixed(0), unit: 'kcal', color: 'from-orange-500 to-red-500' },
                { label: 'Proteínas', value: meals.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString()).reduce((sum, m) => sum + Number(m.total_protein), 0).toFixed(1), unit: 'g', color: 'from-blue-500 to-cyan-500' },
                { label: 'Carboidratos', value: meals.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString()).reduce((sum, m) => sum + Number(m.total_carbs), 0).toFixed(1), unit: 'g', color: 'from-yellow-500 to-orange-500' },
                { label: 'Gorduras', value: meals.filter(m => new Date(m.created_at).toDateString() === new Date().toDateString()).reduce((sum, m) => sum + Number(m.total_fat), 0).toFixed(1), unit: 'g', color: 'from-purple-500 to-pink-500' }
              ].map((stat, i) => (
                <Card key={i} className="p-4 border-white/10 bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all duration-300">
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                    <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                      <span className="text-sm ml-1">{stat.unit}</span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all duration-300 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Dashboard</h3>
                    <p className="text-sm text-gray-400">Acompanhe seu progresso e estatísticas detalhadas</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-all duration-300 cursor-pointer group" onClick={() => setActiveTab('chat')}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">Nutricionista IA</h3>
                    <p className="text-sm text-gray-400">Tire dúvidas com nosso especialista virtual</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0">
            <DashboardTab meals={meals} userId={userId || ''} />
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <HistoryTab meals={meals} onRefresh={loadMeals} />
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <ChatTab userId={userId || ''} />
          </TabsContent>

          <TabsContent value="profile" className="mt-0">
            <ProfileTab userId={userId || ''} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/10 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            {[
              { id: 'home', icon: Home, label: 'Início' },
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { id: 'history', icon: Camera, label: 'Histórico' },
              { id: 'chat', icon: MessageCircle, label: 'Chat IA' },
              { id: 'profile', icon: User, label: 'Perfil' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}
