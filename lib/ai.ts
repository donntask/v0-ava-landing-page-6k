import type { Product, Message, ConversationState } from '@/lib/types'

export interface AIInput {
  message: string
  products: Product[]
  conversationHistory: Message[]
  conversationState: ConversationState
  businessConfig: {
    name: string
    aiPersonality: string
  }
  model?: string // Optional model override for testground
}

export interface AIOutput {
  reply: string
  newState: ConversationState
  orderIntent?: {
    productId: string
    productName: string
    amount: number
  }
}

function buildSystemPrompt(
  products: Product[],
  businessConfig: { name: string; aiPersonality: string },
  state: ConversationState,
): string {
  const productList =
    products.length === 0
      ? 'No products are currently available.'
      : products
          .map(
            (p) =>
              `- ID: ${p.id} | Name: ${p.name} | Price: $${p.price}${p.negotiationEnabled ? ` (min: $${p.minPrice}, negotiable)` : ''} | Description: ${p.description}`,
          )
          .join('\n')

  return `You are ${businessConfig.name}'s AI sales agent.

${businessConfig.aiPersonality}

CURRENT CONVERSATION STATE: ${state}

AVAILABLE PRODUCTS (ONLY recommend these, NEVER invent products):
${productList}

RULES:
1. Only recommend products from the list above.
2. Be conversational, warm, and helpful — like a human salesperson.
3. If the customer expresses purchase intent (e.g. "I want it", "I'll take it", "add to cart", "buy", "order"), respond with a JSON block ONLY in this exact format on its own line:
   ORDER_INTENT:{"productId":"<id>","productName":"<name>","amount":<price>}
4. After the ORDER_INTENT line, add a natural confirmation message.
5. Keep responses concise — under 120 words unless explaining a product.
6. If asked about payment, say: "Payment details will be shared once your order is confirmed."
7. If no products match what the customer wants, apologize and suggest the closest alternative.`
}

export async function runAI(input: AIInput): Promise<AIOutput> {
  const { message, products, conversationHistory, conversationState, businessConfig, model } = input

  const systemPrompt = buildSystemPrompt(products, businessConfig, conversationState)

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ]

  // Use provided model or default to free tier
  const modelToUse = model || 'openrouter/free'

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL ?? 'https://avapage6k.vercel.app',
      'X-Title': 'AroMsg Sales Agent',
    },
    body: JSON.stringify({
      model: modelToUse,
      messages,
      temperature: 0.7,
      max_tokens: 300,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter error: ${err}`)
  }

  const data = await response.json()
  const rawReply: string = data.choices?.[0]?.message?.content ?? "I'm having trouble responding right now. Please try again shortly."

  // Parse ORDER_INTENT if present
  const orderMatch = rawReply.match(/ORDER_INTENT:(\{.*?\})/)
  let orderIntent: AIOutput['orderIntent']
  let cleanReply = rawReply

  if (orderMatch) {
    try {
      orderIntent = JSON.parse(orderMatch[1])
      cleanReply = rawReply.replace(/ORDER_INTENT:\{.*?\}/, '').trim()
    } catch {
      // ignore parse error — treat as normal reply
    }
  }

  // Determine new state
  let newState: ConversationState = conversationState
  if (orderIntent) {
    newState = 'ordering'
  } else if (
    conversationState === 'browsing' &&
    /interest|tell me more|how much|price|cost|what about/i.test(message)
  ) {
    newState = 'interested'
  }

  return { reply: cleanReply, newState, orderIntent }
}
