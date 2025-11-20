import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Mensagens inválidas' },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um nutricionista virtual especializado e amigável. Suas responsabilidades:

1. Responder perguntas sobre nutrição, dietas, macronutrientes, calorias e alimentação saudável
2. Fornecer orientações baseadas em evidências científicas
3. Ser empático e motivador
4. Usar linguagem simples e acessível
5. Quando apropriado, sugerir consulta com nutricionista real para casos específicos

Diretrizes:
- Seja conciso mas informativo
- Use exemplos práticos
- Evite jargões técnicos excessivos
- Seja positivo e encorajador
- Nunca diagnostique doenças ou prescreva tratamentos médicos
- Sempre recomende acompanhamento profissional para casos específicos`
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const assistantMessage = completion.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.'

    return NextResponse.json({ message: assistantMessage })
  } catch (error) {
    console.error('Erro na API de chat:', error)
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    )
  }
}
