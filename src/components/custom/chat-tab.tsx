'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Bot, User, Loader2 } from 'lucide-react'
import { supabase, type ChatMessage } from '@/lib/supabase'
import { chatWithNutritionistAI } from '@/lib/openai'
import { toast } from 'sonner'

interface ChatTabProps {
  userId: string
}

export default function ChatTab({ userId }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    try {
      // Salvar mensagem do usuário
      const { error: userError } = await supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'user',
        content: userMessage
      })

      if (userError) throw userError

      // Atualizar UI imediatamente
      const tempUserMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        user_id: userId,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, tempUserMsg])

      // Preparar histórico para IA
      const chatHistory = [...messages, tempUserMsg].map(m => ({
        role: m.role,
        content: m.content
      }))

      // Obter resposta da IA
      const aiResponse = await chatWithNutritionistAI(chatHistory)

      // Salvar resposta da IA
      const { error: aiError } = await supabase.from('chat_messages').insert({
        user_id: userId,
        role: 'assistant',
        content: aiResponse
      })

      if (aiError) throw aiError

      // Recarregar mensagens
      await loadMessages()
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Nutricionista IA</h2>
        <p className="text-gray-400">Converse com nosso especialista em nutrição e treinamento</p>
      </div>

      {/* Chat Container */}
      <Card className="border-white/10 bg-black/20 backdrop-blur-sm overflow-hidden">
        <div className="flex flex-col h-[calc(100vh-320px)] min-h-[500px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Olá! Sou seu Nutricionista IA
                  </h3>
                  <p className="text-gray-400 max-w-md">
                    Estou aqui para ajudar com dúvidas sobre nutrição, dieta, hipertrofia, 
                    suplementação e muito mais. Como posso te ajudar hoje?
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 mt-6">
                  {[
                    'Como calcular minha necessidade calórica?',
                    'Qual a melhor dieta para hipertrofia?',
                    'Como distribuir macronutrientes?',
                    'Suplementos realmente funcionam?'
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(suggestion)}
                      className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 hover:text-white transition-all duration-300 text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                          : 'bg-white/5 border border-white/10 text-gray-200'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                        <span className="text-sm text-gray-400">Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4 bg-black/20">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua pergunta sobre nutrição..."
                className="flex-1 min-h-[60px] max-h-[120px] resize-none bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-6 rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Pressione Enter para enviar, Shift+Enter para nova linha
            </p>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-4 border-white/10 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-white mb-1">Sobre o Nutricionista IA</h4>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nosso assistente possui conhecimento avançado em nutrição clínica e esportiva, 
              bioquímica, fisiologia do exercício, hipertrofia e composição corporal. 
              Todas as respostas são baseadas em evidências científicas.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
