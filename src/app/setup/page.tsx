'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Copy, Database, Shield, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SetupPage() {
  const router = useRouter()
  const [copiedStep, setCopiedStep] = useState<number | null>(null)

  const copyToClipboard = (text: string, step: number) => {
    navigator.clipboard.writeText(text)
    setCopiedStep(step)
    toast.success('SQL copiado!')
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const sqlSteps = [
    {
      title: 'Habilitar RLS na tabela profiles',
      description: 'Ativa a segurança em nível de linha para proteger os dados dos usuários',
      sql: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`
    },
    {
      title: 'Permitir usuários verem seu próprio perfil',
      description: 'Cada usuário pode visualizar apenas seus próprios dados',
      sql: `CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);`
    },
    {
      title: 'Permitir usuários atualizarem seu perfil',
      description: 'Cada usuário pode editar apenas seus próprios dados',
      sql: `CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);`
    },
    {
      title: 'Permitir usuários criarem seu perfil',
      description: 'Permite que novos usuários criem seu perfil ao se cadastrar',
      sql: `CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);`
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/login')}
            className="mb-4 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Configuração de Segurança
              </h1>
              <p className="text-gray-400">
                Configure as políticas RLS do Supabase para proteger seus dados
              </p>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <Card className="p-6 mb-6 border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-2">
                Como configurar
              </h2>
              <ol className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span>Acesse o <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Dashboard do Supabase</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">2.</span>
                  <span>Vá em <strong>SQL Editor</strong> no menu lateral</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">3.</span>
                  <span>Clique em <strong>New Query</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">4.</span>
                  <span>Copie e cole cada SQL abaixo (um por vez) e clique em <strong>Run</strong></span>
                </li>
              </ol>
            </div>
          </div>
        </Card>

        {/* SQL Steps */}
        <div className="space-y-4">
          {sqlSteps.map((step, index) => (
            <Card key={index} className="p-6 border-white/10 bg-black/40 backdrop-blur-xl">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-400 font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {step.description}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(step.sql, index)}
                  className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400"
                >
                  {copiedStep === index ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-slate-950 rounded-lg p-4 border border-white/10">
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{step.sql}</code>
                </pre>
              </div>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <Card className="mt-6 p-6 border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Pronto para começar!
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Após executar todos os comandos SQL acima, seu sistema estará protegido e pronto para uso.
                Cada usuário terá acesso apenas aos seus próprios dados.
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
              >
                Ir para Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
