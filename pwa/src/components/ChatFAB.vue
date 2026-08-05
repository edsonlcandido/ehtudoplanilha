<script setup lang="ts">
import { ref } from 'vue'
import type { CartaoData, SheetEntry } from '../types'

// Props
const props = defineProps<{
  entries: SheetEntry[]
  loading: boolean
}>()

// Emits
const emit = defineEmits<{
  'chat-response': [cartoes: CartaoData[]]
  'error': [message: string]
}>()

// State
const isOpen = ref(false)
const userMessage = ref('')
const sending = ref(false)

const webhookChatUrl = import.meta.env.VITE_WEBHOOK_CHAT

console.log('ChatFAB - Webhook URL configurada:', webhookChatUrl)

// Toggle FAB expanded state
const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (!isOpen.value) {
    userMessage.value = ''
  }
}

// Process webhook response
const processWebhookResponse = (responseData: any): CartaoData[] => {
  if (Array.isArray(responseData)) {
    return responseData as CartaoData[]
  } else if (responseData && responseData.cartoes && Array.isArray(responseData.cartoes)) {
    return responseData.cartoes as CartaoData[]
  } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
    return responseData.data as CartaoData[]
  } else {
    throw new Error('Formato de resposta inválido do backend')
  }
}

// Mock backend response for development
const mockBackendResponse = (): CartaoData[] => {
  return [
    {
      data: new Date().toLocaleDateString('pt-BR') + ' 15:00',
      conta: "NUBANK",
      valor: -35,
      descricao: "Mercado xyz",
      categoria: "Alimentação",
      orcamento: new Date().toLocaleDateString('pt-BR'),
      observacao: "Compra no cartão NUBANK às 15h no valor de 35 no Mercado xyz"
    }
  ]
}

// Send message to webhook
const sendMessage = async () => {
  if (!userMessage.value.trim()) {
    return
  }

  sending.value = true

  try {
    console.log('Enviando mensagem para webhook:', webhookChatUrl)
    console.log('Payload:', {
      userMessage: userMessage.value,
      entries: props.entries
    })

    // Sempre envia para o webhook real
    const response = await fetch(webhookChatUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userMessage: userMessage.value,
        entries: props.entries
      })
    })

    console.log('Resposta do webhook:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Erro na resposta:', errorText)
      throw new Error(`Falha ao processar a mensagem no servidor: ${response.status}`)
    }

    const webhookData = await response.json()
    console.log('Dados recebidos do webhook:', webhookData)
    
    const cartaosList = processWebhookResponse(webhookData)
    console.log('Cartões processados:', cartaosList)

    // Emit success with cartoes
    emit('chat-response', cartaosList)

    // Reset state
    userMessage.value = ''
    isOpen.value = false

  } catch (error: any) {
    console.error('Erro no envio da mensagem:', error)
    emit('error', `Erro ao processar mensagem: ${error.message}`)
  } finally {
    sending.value = false
  }
}

// Handle Enter key
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}
</script>

<template>
  <div class="chat-fab-container">
    <!-- Expanded chat input -->
    <div v-if="isOpen" class="chat-input-wrapper">
      <div class="chat-input-container">
        <textarea
          v-model="userMessage"
          placeholder="Ex: compra no cartão NUBANK às 15h no valor de 35 no Mercado xyz"
          class="chat-input"
          rows="3"
          :disabled="sending || loading"
          @keydown="handleKeyDown"
          autofocus
        ></textarea>
        <div class="chat-actions">
          <button
            @click="sendMessage"
            :disabled="!userMessage.trim() || sending || loading"
            class="send-button"
            :class="{ 'sending': sending }"
          >
            <span v-if="sending">Enviando...</span>
            <span v-else>Enviar</span>
          </button>
          <button @click="toggleChat" class="cancel-button" :disabled="sending">
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- FAB button -->
    <button
      @click="toggleChat"
      class="fab-button"
      :class="{ 'open': isOpen, 'disabled': loading }"
      :disabled="loading"
      :title="isOpen ? 'Fechar' : 'Lançamento Manual'"
    >
      <span class="fab-icon">{{ isOpen ? '×' : '+' }}</span>
    </button>
  </div>
</template>

<style scoped>
.chat-fab-container {
  position: fixed;
  bottom: 90px;
  right: 24px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.chat-input-wrapper {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-input-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
  width: 320px;
  max-width: calc(100vw - 80px);
}

.chat-input {
  width: 100%;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.chat-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.chat-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.chat-input::placeholder {
  color: #999;
}

.chat-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.send-button,
.cancel-button {
  flex: 1;
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button {
  background-color: var(--color-primary);
  color: white;
}

.send-button:hover:not(:disabled) {
  background-color: var(--color-hover-blue);
  transform: translateY(-1px);
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

.send-button.sending {
  background-color: #999;
}

.cancel-button {
  background-color: #f5f5f5;
  color: #666;
}

.cancel-button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.cancel-button:disabled {
  cursor: not-allowed;
}

.fab-button {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #22C55E;
  color: white;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-button:hover:not(:disabled) {
  background-color: #16A34A;
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
}

.fab-button.open {
  background-color: #EF4444;
}

.fab-button.open:hover {
  background-color: #DC2626;
}

.fab-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

.fab-icon {
  font-size: 32px;
  line-height: 1;
  font-weight: 300;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .chat-fab-container {
    bottom: 90px;
    right: 16px;
  }

  .chat-input-container {
    width: calc(100vw - 48px);
    max-width: none;
  }

  .fab-button {
    width: 48px;
    height: 48px;
  }

  .fab-icon {
    font-size: 28px;
  }
}
</style>
