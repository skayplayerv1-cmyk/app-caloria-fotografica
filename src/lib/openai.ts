import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
  dangerouslyAllowBrowser: true
})

export async function analyzeMealImage(imageUrl: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Você é um nutricionista especialista em análise de alimentos. Analise a imagem da refeição e retorne um JSON com a seguinte estrutura:
{
  "foods": [
    {
      "name": "nome do alimento",
      "quantity": "quantidade estimada (ex: 150g, 1 unidade, 200ml)",
      "calories": número de calorias,
      "protein": gramas de proteína,
      "carbs": gramas de carboidratos,
      "fat": gramas de gordura
    }
  ]
}

Seja preciso e detalhado. Estime as quantidades baseado no tamanho visual dos alimentos. Retorne APENAS o JSON, sem texto adicional.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          },
          {
            type: 'text',
            text: 'Analise esta refeição e retorne os dados nutricionais detalhados.'
          }
        ]
      }
    ],
    max_tokens: 1000
  })

  const content = response.choices[0].message.content || '{}'
  return JSON.parse(content)
}

export async function chatWithNutritionistAI(messages: Array<{ role: 'user' | 'assistant', content: string }>) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Você é um nutricionista especialista de alto nível acadêmico com conhecimento avançado em:
- Nutrição clínica e esportiva
- Bioquímica e metabolismo
- Fisiologia do exercício
- Hipertrofia muscular e composição corporal
- Ciência da nutrição baseada em evidências
- Educação física e treinamento

Responda de forma clara, precisa e baseada em ciência. Seja detalhado quando necessário, mas mantenha a linguagem acessível. 

RESTRIÇÕES:
- Não responda perguntas com conteúdo explícito, impróprio ou ilegal
- Não forneça orientações que possam causar danos à saúde
- Sempre recomende consulta com profissionais quando apropriado

Seu objetivo é educar e ajudar o usuário a alcançar seus objetivos de forma saudável e sustentável.`
      },
      ...messages
    ],
    max_tokens: 1500
  })

  return response.choices[0].message.content || ''
}
