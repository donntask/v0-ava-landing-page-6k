export interface Business {
  id: string
  name: string
  email: string
  whatsappPhone?: string
  whatsappConnected?: boolean
  whatsappConnectedAt?: number
  universalAIResponse?: boolean
  openrouterModel?: string
  avatarUrl?: string
  aiPersonality: string
  customPrompt?: string
  notificationNumber?: string
  notificationVerifiedAt?: number
  // Preferences
  currency?: string
  language?: string
  timezone?: string
  notifNewOrder?: boolean
  notifNewMessage?: boolean
  notifDailyReport?: boolean
  notifWeeklyReport?: boolean
  createdAt: number
  updatedAt?: number
}

export interface Product {
  id: string
  businessId: string
  name: string
  description: string
  price: number
  minPrice: number
  negotiationEnabled: boolean
  imageUrl?: string
  createdAt: number
}

export interface Order {
  id: string
  businessId: string
  userId: string        // customer WhatsApp number
  productId: string
  productName: string
  amount: number
  status: 'pending' | 'confirmed' | 'cancelled'
  reference?: string
  phoneNumber?: string
  generatedAccount?: string
  generatedBank?: string
  generatedAccountName?: string
  deliveryAddress?: string
  invoiceImage?: string
  invoiceImageData?: string   // base64 PNG
  paidAt?: number
  createdAt: number
}

export type ConversationState = 'browsing' | 'interested' | 'ordering'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
  userId: string        // customer phone
  businessId: string
  messages: Message[]
  state: ConversationState
  lastActiveAt: number
}

export interface Contact {
  id: string            // Firestore doc ID
  businessId: string
  jid: string           // WhatsApp JID e.g. 2348012345678@s.whatsapp.net
  phone: string         // raw digits
  name: string
  lastMessage?: string
  lastTs?: number
  unread?: number
  aiEnabled: boolean
  aiPersonality?: string
  aiModel?: string
  createdAt: number
}

export interface TestgroundConversationLog {
  id: string
  phoneNumber: string
  userMessage: string
  aiResponse: string
  aiState: ConversationState
  orderIntent?: {
    productId: string
    productName: string
    amount: number
  }
  createdAt: number
}
