<script setup lang="ts">
import HelloWorld from './HelloWorld.vue'
import { useRouter } from 'vue-router'
import pb from '../pocketbase' // Import PocketBase instance
import { ref, onMounted, onUnmounted, computed } from 'vue'
import UploadArea from './UploadArea.vue'
import CartaoItem from './CartaoItem.vue'
import EntryModal from './EntryModal.vue'
import ChatFAB from './ChatFAB.vue'
import type { CartaoData, SheetEntry, GetCategoriesResponse } from '../types'

const router = useRouter()

// Navigation URLs
const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL
const lancamentosUrl = import.meta.env.VITE_DASHBOARD_LANCAMENTOS_URL
const categoriasUrl = import.meta.env.VITE_DASHBOARD_CATEGORIAS_URL
const celularUrl = import.meta.env.VITE_DASHBOARD_CELULAR_URL

// PWA Install related states
const deferredPrompt = ref<any>(null)
const showInstallButton = ref(true)
const isStandalone = ref(false)

// Share Target related states
const sharedTitle = ref('')
const sharedText = ref('')
const sharedUrl = ref('')
const sharedFiles = ref<File[]>([])
const uploadResponse = ref<any>(null)
const uploadError = ref<string | null>(null)
const uploading = ref(false)
const isLoading = ref(true)
const sharedCartoes = ref<CartaoData[]>([])
const entries = ref<SheetEntry[]>([])
const apiCategorias = ref<string[]>([])

// Modal state for shared cards
const showModal = ref(false)
const selectedCartao = ref<CartaoData | null>(null)
const selectedCartaoIndex = ref<number>(-1)

// Autocomplete data - extracted from existing cartoes
const contas = computed(() => {
  const uniqueContas = new Set(sharedCartoes.value.map(c => c.conta))
  return Array.from(uniqueContas)
})

const categorias = computed(() => {
  const uniqueCategorias = new Set(sharedCartoes.value.map(c => c.categoria))
  // Add some default categories
  const defaults = ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Moradia', 'Lazer', 'Outros', 'Receita']
  defaults.forEach(cat => uniqueCategorias.add(cat))
  return Array.from(uniqueCategorias)
})

// Upload configuration
const uploadCollection = 'uploads'
const fileFieldName = 'file'
const webhookUrl = import.meta.env.VITE_WEBHOOK_URL

const currentUserId = computed(() => {
  // Para login de teste, usa um ID fictício
  const testLogin = sessionStorage.getItem('testLogin')
  if (testLogin === 'true') {
    return 'test-user-id'
  }
  return pb.authStore.model?.id || ''
})

const logout = () => {
  pb.authStore.clear()
  sessionStorage.removeItem('testLogin')
  router.push('/login')
}

// Verificação da validade do token
//
// Versão conservadora: confia em `pb.authStore.isValid` (checa expiração do JWT
// localmente). NÃO chama `authRefresh()` porque isso estava deletando o
// `pocketbase_auth` do localStorage quando o servidor rejeitava o token por
// qualquer motivo (CORS, network, storage compartilhado entre o PWA e o
// frontend legado em origens diferentes, etc).
//
// Se o token realmente expirar, o backend vai retornar 401 em alguma chamada
// real (ex: `pb.collection('users').getList(...)`) e o handler de erro pode
// decidir o que fazer.
const verificarToken = async () => {
  isLoading.value = true

  // Bypass de teste (não mexe em nada se for test login)
  const testLogin = sessionStorage.getItem('testLogin')
  if (testLogin === 'true') {
    console.log('[Auth] Login de teste válido')
    isLoading.value = false
    return
  }

  // Verifica token localmente (sem chamada de rede)
  if (!pb.authStore.isValid) {
    console.warn('[Auth] Usuário não autenticado localmente, redirecionando para /login')
    router.push('/login')
    isLoading.value = false
    return
  }

  console.log('[Auth] Token válido localmente ✓')
  isLoading.value = false
}

// PWA Install functions
const handleBeforeInstallPrompt = (e: Event) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault()
  // Stash the event so it can be triggered later
  deferredPrompt.value = e
  // Show the install button
  showInstallButton.value = true
}

const installPWA = async () => {
  // Se o prompt nativo estiver disponível, usa ele
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    deferredPrompt.value = null
    return
  }

  // Detecta o navegador e sistema operacional
  const userAgent = navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent)
  const isChrome = /chrome/.test(userAgent) && !/edge/.test(userAgent)
  const isEdge = /edg/.test(userAgent)
  const isFirefox = /firefox/.test(userAgent)
  const isSamsung = /samsungbrowser/.test(userAgent)
  const isAndroid = /android/.test(userAgent)

  let instructions = 'Para instalar o aplicativo:\n\n'

  if (isIOS && isSafari) {
    instructions += '1. Toque no ícone de Compartilhar (quadrado com seta para cima) na barra de navegação\n'
    instructions += '2. Role para baixo e toque em "Adicionar à Tela de Início"\n'
    instructions += '3. Toque em "Adicionar" no canto superior direito'
  } else if (isIOS && isChrome) {
    instructions += 'No Chrome para iOS, a instalação de PWA é limitada.\n'
    instructions += 'Por favor, abra este site no Safari e siga as instruções:\n\n'
    instructions += '1. Toque em Compartilhar\n'
    instructions += '2. Toque em "Adicionar à Tela de Início"'
  } else if (isAndroid && isSamsung) {
    instructions += '1. Toque no menu (três linhas ou três pontos)\n'
    instructions += '2. Toque em "Adicionar página a" ou "Instalar"\n'
    instructions += '3. Selecione "Tela inicial"'
  } else if (isAndroid && isChrome) {
    instructions += '1. Toque no menu (⋮) no canto superior direito\n'
    instructions += '2. Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"\n'
    instructions += '3. Confirme a instalação'
  } else if (isEdge) {
    instructions += '1. Clique no menu (⋯) no canto superior direito\n'
    instructions += '2. Clique em "Aplicativos" > "Instalar este site como aplicativo"\n'
    instructions += '3. Confirme a instalação'
  } else if (isChrome) {
    instructions += '1. Clique no menu (⋮) no canto superior direito\n'
    instructions += '2. Clique em "Instalar Planilha Eh Tudo..."\n'
    instructions += '3. Confirme a instalação'
  } else if (isFirefox) {
    instructions += 'O Firefox não suporta instalação nativa de PWA.\n'
    instructions += 'Por favor, use Chrome, Edge ou Safari para instalar.'
  } else {
    instructions += '• No Chrome/Edge: Clique no menu (⋮) e selecione "Instalar aplicativo"\n'
    instructions += '• No Safari (iOS): Toque em "Compartilhar" e depois "Adicionar à Tela de Início"'
  }

  alert(instructions)
}

// --- Share Target Handling Logic ---

// Busca entries da API
const fetchEntries = async (): Promise<SheetEntry[]> => {
  const entriesUrl = import.meta.env.VITE_GET_ENTRIES_URL
  if (!entriesUrl) {
    console.warn('VITE_GET_ENTRIES_URL não configurada')
    return []
  }

  try {
    const token = pb.authStore.token
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (token) {
      headers['Authorization'] = `${token}`
    }

    const response = await fetch(entriesUrl, {
      method: 'GET',
      headers
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.entries) {
        return data.entries as SheetEntry[]
      }
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar entries:', error)
  }

  return []
}

// Busca categorias da API
const fetchCategorias = async (): Promise<string[]> => {
  const categoriesUrl = import.meta.env.VITE_GET_CATEGORIES_URL
  if (!categoriesUrl) {
    console.warn('VITE_GET_CATEGORIES_URL não configurada')
    return []
  }

  try {
    const token = pb.authStore.token
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (token) {
      headers['Authorization'] = `${token}`
    }

    const response = await fetch(categoriesUrl, {
      method: 'GET',
      headers
    })

    if (response.ok) {
      const data: GetCategoriesResponse = await response.json()
      if (data.success && data.categories) {
        return data.categories
      }
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar categorias:', error)
  }

  return []
}

// Processa a resposta do webhook e extrai os cartões
const processWebhookResponse = (responseData: any): CartaoData[] => {
  // A resposta pode ser diretamente um array ou um objeto com a propriedade cartoes
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

// Função para simular resposta do backend durante desenvolvimento/teste
const mockBackendResponse = (): CartaoData[] => {
  return [
    {
      data: "23/09/2025 15:02",
      conta: "NU PAGAMENTOS - IP",
      valor: 250,
      descricao: "CLINICA FRANCO PEGHINI LTDA",
      categoria: "Outros",
      orcamento: "23/09/2025",
      observacao: "Transferência via Pix para Clinica Franco Peghini Ltda"
    },
    {
      data: "22/09/2025 10:30",
      conta: "BANCO DO BRASIL",
      valor: -45.50,
      descricao: "SUPERMERCADO EXEMPLO",
      categoria: "Alimentação",
      orcamento: "22/09/2025",
      observacao: "Compra no supermercado - débito automático"
    }
  ]
}

// Apaga a imagem do PocketBase após o processamento
const deleteUploadedImage = async (recordId: string): Promise<void> => {
  try {
    await pb.collection(uploadCollection).delete(recordId)
    console.log('Imagem apagada com sucesso do PocketBase')
  } catch (error: any) {
    console.error('Erro ao apagar imagem:', error)
    // Não propaga o erro pois os cartões já foram criados
  }
}

const uploadSharedFile = async (file: File) => {
  uploading.value = true
  uploadResponse.value = null
  uploadError.value = null
  sharedCartoes.value = []

  if (!currentUserId.value) {
    uploadError.value = 'Faça login para enviar arquivos.'
    uploading.value = false
    return
  }

  try {
    // Para desenvolvimento: usar dados mockados (apenas em DEV, não em produção com testLogin)
    const isDevelopment = import.meta.env.DEV

    if (isDevelopment) {
      // Simula o processo de upload e análise
      uploadResponse.value = 'Analisando documento...'

      // Simula tempo de processamento
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Obtém dados mockados
      const cartaosList = mockBackendResponse()

      // Armazena os cartões no estado
      sharedCartoes.value = cartaosList
      uploadResponse.value = `${cartaosList.length} cartão(ões) criado(s) com sucesso!`
      uploading.value = false
      return
    }

    // Fluxo real para produção
    const formData = new FormData()
    formData.append('user_id', currentUserId.value)
    formData.append('status', 'uploaded')
    formData.append(fileFieldName, file)

    uploadResponse.value = 'Enviando arquivo para processamento...'

    // 1. Upload do arquivo para o PocketBase
    const record = await pb.collection(uploadCollection).create(formData)
    const fileName = (record as Record<string, any>)[fileFieldName] as string | undefined

    if (!fileName) {
      throw new Error('PocketBase não retornou o arquivo.')
    }

    // 2. Busca entries e categorias existentes
    const fetchedEntries = await fetchEntries()
    const fetchedCategories = await fetchCategorias()

    // 3. Envia para o webhook e processa a resposta diretamente
    const uploadUri = pb.files.getUrl(record, fileName)
    uploadResponse.value = 'Analisando documento...'

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'upload-uri': uploadUri,
        'record-id': record.id,
        'entries': fetchedEntries,
        'categories': fetchedCategories
      }),
    })

    if (!webhookResponse.ok) {
      throw new Error('Falha ao processar a imagem no servidor.')
    }

    // 4. Processa a resposta do webhook diretamente
    const webhookData = await webhookResponse.json()
    const cartaosList = processWebhookResponse(webhookData)

    // 5. Armazena os cartões no estado
    sharedCartoes.value = cartaosList

    // 6. Apaga a imagem do PocketBase
    await deleteUploadedImage(record.id)

    uploadResponse.value = `${cartaosList.length} cartão(ões) criado(s) com sucesso!`

  } catch (error: any) {
    uploadError.value = `Falha ao processar ${file.name}: ${error.message}`
    console.error('Erro no upload:', error)
  } finally {
    uploading.value = false
  }
}

// Handle cartao click to open modal for shared cards
const handleSharedCartaoClick = (cartao: CartaoData) => {
  const index = sharedCartoes.value.findIndex(c =>
    c.data === cartao.data &&
    c.descricao === cartao.descricao &&
    c.valor === cartao.valor
  )
  selectedCartaoIndex.value = index
  selectedCartao.value = { ...cartao }
  showModal.value = true
}

// Handle modal close
const handleModalClose = () => {
  showModal.value = false
  selectedCartao.value = null
  selectedCartaoIndex.value = -1
}

// Handle save from modal
const handleSave = async (updatedCartao: CartaoData) => {
  try {
    // Remove the cartao from the array
    if (selectedCartaoIndex.value >= 0) {
      sharedCartoes.value.splice(selectedCartaoIndex.value, 1)
    }

    // Close modal
    handleModalClose()

    // Show success message
    uploadResponse.value = 'Lançamento enviado com sucesso!'

    // Clear success message after 3 seconds
    setTimeout(() => {
      if (uploadResponse.value === 'Lançamento enviado com sucesso!') {
        uploadResponse.value = null
      }
    }, 3000)

    // If no more cards, reset to initial state
    if (sharedCartoes.value.length === 0) {
      resetToInitialState()
    }

  } catch (error: any) {
    console.error('Erro ao salvar:', error)
    alert('Erro ao salvar o lançamento: ' + (error?.message || 'Erro desconhecido'))
  }
}

// Handle submit directly from CartaoItem without opening modal
const handleSubmitCartao = async (cartao: CartaoData) => {
  try {
    // Find and remove the cartao from the array
    const index = sharedCartoes.value.findIndex(c =>
      c.data === cartao.data &&
      c.descricao === cartao.descricao &&
      c.valor === cartao.valor
    )
    
    if (index >= 0) {
      sharedCartoes.value.splice(index, 1)
    }

    // Show success message
    uploadResponse.value = 'Lançamento enviado com sucesso!'

    // Clear success message after 3 seconds
    setTimeout(() => {
      if (uploadResponse.value === 'Lançamento enviado com sucesso!') {
        uploadResponse.value = null
      }
    }, 3000)

    // If no more cards, reset to initial state
    if (sharedCartoes.value.length === 0) {
      resetToInitialState()
    }

  } catch (error: any) {
    console.error('Erro ao salvar:', error)
    alert('Erro ao salvar o lançamento: ' + (error?.message || 'Erro desconhecido'))
  }
}

// Reset page to initial state
const resetToInitialState = () => {
  sharedTitle.value = ''
  sharedText.value = ''
  sharedUrl.value = ''
  sharedFiles.value = []
  uploadResponse.value = null
  uploadError.value = null
  uploading.value = false
}

const handleLaunchParams = async (launchParams: { files?: FileSystemFileHandle[], text?: string, url?: string, title?: string }) => {
  if (launchParams.files && launchParams.files.length > 0) {
    for (const fileHandle of launchParams.files) {
      const file = await fileHandle.getFile()
      sharedFiles.value.push(file)
    }
    // Auto-upload the first shared file for demonstration
    if (sharedFiles.value.length > 0) {
      await uploadSharedFile(sharedFiles.value[0])
    }
  }
  sharedText.value = launchParams.text || '';
  sharedUrl.value = launchParams.url || '';
  sharedTitle.value = launchParams.title || '';
};

onMounted(async () => {
  // Verificar se já está instalado (modo standalone)
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true

  // Verificar token antes de continuar
  await verificarToken()

  // Load entries for ChatFAB
  await loadEntries()

  // Handle PWA install prompt
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  
  // Ouvir evento de instalação concluída
  window.addEventListener('appinstalled', () => {
    console.log('PWA instalado com sucesso!')
    isStandalone.value = true
    deferredPrompt.value = null
  })

  // Check if this is a share target redirect
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('share') === 'true') {
    // Retrieve shared data from cache
    try {
      const cache = await caches.open('share-target-cache')
      const response = await cache.match('/pwa/shared-data')
      if (response) {
        const shareData = await response.json()

        // Set the shared data
        sharedTitle.value = shareData.title || ''
        sharedText.value = shareData.text || ''
        sharedUrl.value = shareData.url || ''

        // If there's a file, retrieve it and process
        if (shareData.file) {
          const fileResponse = await cache.match(`/pwa/shared-file-${shareData.timestamp}`)
          if (fileResponse) {
            const blob = await fileResponse.blob()
            const fileName = fileResponse.headers.get('X-File-Name') || 'shared-file'
            const file = new File([blob], fileName, { type: blob.type })
            sharedFiles.value = [file]

            // Auto-upload the shared file
            await uploadSharedFile(file)
          }
        }

        // Clean up the cache
        await cache.delete('/pwa/shared-data')
        if (shareData.timestamp) {
          await cache.delete(`/pwa/shared-file-${shareData.timestamp}`)
        }
      }
    } catch (error) {
      console.error('Error retrieving shared data:', error)
    }

    // Clean up the URL
    window.history.replaceState({}, '', '/pwa/')
  }

  // Handle Web Share Target API data on component mount (for browsers supporting Launch Queue)
  if ('launchQueue' in window && 'setConsumer' in (window as any).launchQueue) {
    (window as any).launchQueue.setConsumer(handleLaunchParams);
  } else {
    // Fallback for browsers not supporting Launch Queue API (e.g., direct URL share without files)
    const launchParams: { [key: string]: any } = {};
    urlParams.forEach((value, key) => {
      if (key !== 'share') {
        launchParams[key] = value;
      }
    });
    if (Object.keys(launchParams).length > 0) {
      handleLaunchParams(launchParams as { text?: string, url?: string, title?: string });
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
})

const isSharedContentPresent = () => {
  // DEBUG: Force show shared content card
  // return true;
  return sharedTitle.value || sharedText.value || sharedUrl.value || sharedFiles.value.length > 0;
}

const getFilePreviewUrl = (file: File) => {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return null;
};

// Handle chat response from ChatFAB
const handleChatResponse = (cartoes: CartaoData[]) => {
  console.log('HomePage - Recebeu resposta do ChatFAB:', cartoes)
  // Add the new cartoes to the shared cartoes list
  sharedCartoes.value = [...sharedCartoes.value, ...cartoes]
  console.log('HomePage - sharedCartoes atualizado:', sharedCartoes.value)
  uploadResponse.value = `${cartoes.length} cartão(ões) criado(s) com sucesso!`
  
  // Clear success message after 3 seconds
  setTimeout(() => {
    if (uploadResponse.value === `${cartoes.length} cartão(ões) criado(s) com sucesso!`) {
      uploadResponse.value = null
    }
  }, 3000)
}

// Handle chat error from ChatFAB
const handleChatError = (message: string) => {
  console.error('HomePage - Erro recebido do ChatFAB:', message)
  uploadError.value = message
}

// Load entries on mount for ChatFAB
const loadEntries = async () => {
  try {
    console.log('HomePage - Carregando entries...')
    const fetchedEntries = await fetchEntries()
    entries.value = fetchedEntries
    console.log('HomePage - Entries carregadas:', entries.value.length, 'entries')
  } catch (error) {
    console.error('HomePage - Erro ao carregar entries:', error)
  }
}

// App version injected at build time via Vite config
const appVersion = import.meta.env.APP_VERSION || ''
</script>

<template>
  <div class="home-page">
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Verificando autenticação...</p>
    </div>

    <template v-else>
      <h1 class="page-title">Bem vindo ao nosso app!</h1>
      <p class="page-description">Essa é nossa extensão para celular onde é possível enviar comprovantes, incluir lançamentos em linguagem natural usando
        agentes de IA.</p>



      <div v-if="isSharedContentPresent()" class="shared-content-card">
        <h3 class="shared-content-title">Conteúdo Compartilhado Recebido!</h3>

        <p v-if="sharedTitle"><strong>Título:</strong> {{ sharedTitle }}</p>
        <p v-if="sharedText"><strong>Texto:</strong> {{ sharedText }}</p>
        <p v-if="sharedUrl"><strong>URL:</strong> <a :href="sharedUrl" target="_blank" class="shared-link">{{ sharedUrl
        }}</a></p>

        <div v-if="sharedFiles.length > 0" class="shared-files-section">
          <h4 class="shared-files-heading">Arquivos Compartilhados:</h4>
          <ul class="file-list">
            <li v-for="file in sharedFiles" :key="file.name" class="file-item">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-type">({{ file.type }})</span>
              <img v-if="getFilePreviewUrl(file)" :src="getFilePreviewUrl(file)!" alt="File preview"
                class="file-preview-image" />
              <span v-else class="file-icon">📁 File</span>
            </li>
          </ul>

          <div v-if="uploading" class="upload-status-message upload-progress">
            Enviando arquivo...
          </div>
          <div v-else-if="uploadResponse" class="upload-status-message upload-success">
            {{ uploadResponse }}
          </div>
          <div v-else-if="uploadError" class="upload-status-message upload-error">
            Erro no upload: <br /> {{ uploadError }}
          </div>

          <!-- Exibe os cartões processados -->
          <div v-if="sharedCartoes.length > 0" class="shared-cartoes-section">
            <h4 class="shared-cartoes-heading">Cartões Processados:</h4>
            <div class="cartoes-list">
              <CartaoItem v-for="(cartao, index) in sharedCartoes" :key="index" :cartao="cartao"
                @click="handleSharedCartaoClick" @submit="handleSubmitCartao" />
            </div>
          </div>
        </div>

        <p class="shared-feedback">Este conteúdo foi compartilhado com Planilha Eh Tudo!</p>
      </div>


      <!-- Seção de Cartões Processados (Upload ou Chat) -->
      <div v-if="(sharedCartoes.length > 0 || uploading || uploadResponse || uploadError) && !isSharedContentPresent()" class="cartoes-processados-section">
        <h3 class="section-title">📋 Lançamentos Processados</h3>
        
        <div v-if="uploading" class="upload-status-message upload-progress">
          Processando...
        </div>
        <div v-if="uploadResponse" class="upload-status-message upload-success">
          {{ uploadResponse }}
        </div>
        <div v-if="uploadError" class="upload-status-message upload-error">
          Erro: <br /> {{ uploadError }}
        </div>

        <div v-if="sharedCartoes.length > 0" class="cartoes-list">
          <CartaoItem v-for="(cartao, index) in sharedCartoes" :key="index" :cartao="cartao"
            @click="handleSharedCartaoClick" @submit="handleSubmitCartao" />
        </div>
      </div>

      <UploadArea />


            <!-- PWA Install Button -->
      <div class="install-section">
        <button v-if="!isStandalone" @click="installPWA" class="install-button">
          📱 Instalar App
        </button>
        <div v-else class="installed-badge">
          ✅ App instalado!
        </div>
        <p v-if="!isStandalone" class="install-description">Instale para compartilhar imagens diretamente!</p>
        <p v-else class="install-description">Agora você pode compartilhar imagens diretamente para o app!</p>
      </div>
      <!-- Modal de edição para cartões compartilhados -->
      <EntryModal :show="showModal" :cartao="selectedCartao" :contas="contas" :categorias="categorias"
        @close="handleModalClose" @save="handleSave" />

      <!-- ChatFAB para lançamento manual -->
      <ChatFAB
        :entries="entries"
        :loading="isLoading || uploading"
        @chat-response="handleChatResponse"
        @error="handleChatError"
      />

      <hr class="separator" />
      <div class="app-version" aria-hidden="true">
        <small>Versão: {{ appVersion || 'dev' }}</small>
      </div>
    </template>
  </div>

  <!-- Bottom Navigation Menu -->
  <nav class="bottom-nav">
    <a :href="dashboardUrl" class="nav-link" title="Dashboard">
      <span class="nav-icon">🏠</span>
      <span class="nav-text">Dashboard</span>
    </a>
    <a :href="lancamentosUrl" class="nav-link" title="Lançamentos">
      <span class="nav-icon">📋</span>
      <span class="nav-text">Lançamentos</span>
    </a>
    <a :href="categoriasUrl" class="nav-link" title="Categorias">
      <span class="nav-icon">🏷️</span>
      <span class="nav-text">Categorias</span>
    </a>
    <a :href="celularUrl" class="nav-link active" title="Celular">
      <span class="nav-icon">📱</span>
      <span class="nav-text">Celular</span>
    </a>
  </nav>
</template>

<style scoped>
.home-page {
  padding: 1.5rem 1rem 80px 1rem;
  max-width: 800px;
  /* Constrain content width */
  margin: 0 auto;
  position: relative;
  min-height: 200px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin-bottom: 16px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.page-title {
  font-size: 1.75rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--color-text-dark);
}

.page-description {
  margin-bottom: 1.5rem;
  color: var(--color-text-light);
}

.install-section {
  background-color: var(--color-card-background);
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.install-button {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.install-button:hover {
  background-color: var(--color-hover-blue);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}

.install-button:active {
  transform: translateY(0);
}

.installed-badge {
  background-color: #10b981;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  display: inline-block;
}

.install-description {
  margin-top: 0.75rem;
  color: var(--color-text-light);
  font-size: 0.95rem;
}

.pwa-info-section {
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.pwa-info-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-dark);
  margin-bottom: 1rem;
}

.pwa-info-content>p {
  color: var(--color-text-light);
  margin-bottom: 1rem;
}

.install-instructions {
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  background-color: var(--color-card-background);
}

.install-instructions summary {
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0.5rem;
  user-select: none;
}

.install-instructions summary:hover {
  color: var(--color-hover-blue);
}

.instructions-content {
  margin-top: 1rem;
  padding: 0 0.5rem;
}

.instructions-content h4 {
  color: var(--color-text-dark);
  font-size: 1rem;
  margin: 1rem 0 0.5rem 0;
}

.instructions-content h4:first-child {
  margin-top: 0;
}

.instructions-content p {
  color: var(--color-text-light);
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.shared-content-card {
  background-color: var(--color-card-background);
  border: 1px solid var(--color-border);
  border-left: 5px solid var(--color-primary);
  /* Highlight with primary color */
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.shared-content-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 1rem;
}

.shared-link {
  color: var(--color-primary);
  text-decoration: underline;
}

.shared-files-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--color-border);
}

.shared-files-heading {
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-text-dark);
  margin-bottom: 0.75rem;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--color-background-light);
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  border: 1px solid var(--color-border);
  max-width: 100%;
  overflow: hidden;
}

.file-name {
  font-weight: 500;
  color: var(--color-text-dark);
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.file-type {
  font-size: 0.875rem;
  color: var(--color-text-light);
  flex-shrink: 0;
}

.file-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.file-preview-image {
  max-width: 80px;
  max-height: 80px;
  min-width: 80px;
  min-height: 80px;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
  margin-left: auto;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
}

.upload-status-message {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  font-weight: 500;
}

.upload-progress {
  background-color: #e0f2fe;
  /* Light blue */
  color: #1e40af;
  /* Dark blue */
}

.upload-success {
  background-color: #d1fae5;
  /* Light green */
  color: #065f46;
  /* Dark green */
}

.upload-error {
  background-color: #fee2e2;
  /* Light red */
  color: #991b1b;
  /* Dark red */
}

.shared-feedback {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: var(--color-text-light);
}

.shared-cartoes-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--color-border);
}

.shared-cartoes-heading {
  font-size: 1rem;
  font-weight: bold;
  color: var(--color-text-dark);
  margin-bottom: 1rem;
}

.cartoes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cartoes-processados-section {
  background-color: var(--color-card-background);
  border: 2px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cartoes-processados-section .section-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--color-text-dark);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.separator {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 2rem 0;
}

.app-version {
  text-align: center;
  color: var(--color-text-light);
  margin-top: 0.5rem;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .home-page {
    padding: 2rem;
  }

  .page-title {
    font-size: 2.25rem;
  }
}
</style>

<style>
/* Global styles for bottom nav (not scoped) */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 70px;
  background-color: var(--color-card-background);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 0.5rem;
  z-index: 9999;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  box-sizing: border-box;
}

.bottom-nav .nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.4rem 0.25rem;
  text-decoration: none;
  color: var(--color-text-light);
  transition: color 0.2s ease, background-color 0.2s ease;
  border-radius: 8px;
  width: 70px;
  height: 56px;
  flex-shrink: 0;
}

.bottom-nav .nav-icon {
  font-size: 1.5rem;
  display: block;
}

.bottom-nav .nav-text {
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
  line-height: 1;
}

.bottom-nav .nav-link:hover {
  color: var(--color-primary);
  background-color: rgba(59, 130, 246, 0.1);
}

.bottom-nav .nav-link.active {
  color: var(--color-primary);
  background-color: rgba(59, 130, 246, 0.15);
}
</style>
