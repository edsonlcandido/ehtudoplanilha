<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import pb from '../pocketbase';
import CartaoItem from './CartaoItem.vue';
import EntryModal from './EntryModal.vue';
import type { CartaoData, ProcessImageResponse, GetEntriesResponse, GetCategoriesResponse, SheetEntry } from '../types';

const files = ref<File[]>([]);
const uploadStatus = ref<'idle' | 'uploading' | 'analyzing' | 'success' | 'error'>('idle');
const uploadMessage = ref('');
const cartoes = ref<CartaoData[]>([]);
const recordId = ref<string | null>(null); // Para armazenar o ID do registro do PocketBase

// Modal state
const showModal = ref(false);
const selectedCartao = ref<CartaoData | null>(null);
const selectedCartaoIndex = ref<number>(-1);

// Estados para dados das APIs
const apiEntries = ref<SheetEntry[]>([]);
const apiCategorias = ref<string[]>([]);
const isLoadingEntries = ref(false);
const isLoadingCategorias = ref(false);

// Buscar entries da API
const fetchEntries = async () => {
  const entriesUrl = import.meta.env.VITE_GET_ENTRIES_URL
  if (!entriesUrl) {
    console.warn('VITE_GET_ENTRIES_URL não configurada')
    return
  }

  isLoadingEntries.value = true
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
      const data: GetEntriesResponse = await response.json()
      if (data.success && data.entries) {
        apiEntries.value = data.entries
        console.log(`✅ ${apiEntries.value.length} entries carregados`)
      }
    } else {
      console.warn(`⚠️ Erro ao buscar entries: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar entries:', error)
  } finally {
    isLoadingEntries.value = false
  }
}

// Buscar categorias da API
const fetchCategorias = async () => {
  const categoriesUrl = import.meta.env.VITE_GET_CATEGORIES_URL
  if (!categoriesUrl) {
    console.warn('VITE_GET_CATEGORIES_URL não configurada')
    return
  }

  isLoadingCategorias.value = true
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
        apiCategorias.value = data.categories
        console.log(`✅ ${apiCategorias.value.length} categorias carregadas`)
      }
    } else {
      console.warn(`⚠️ Erro ao buscar categorias: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar categorias:', error)
  } finally {
    isLoadingCategorias.value = false
  }
}

// Carregar dados ao montar o componente
onMounted(() => {
  fetchEntries()
  fetchCategorias()
})

// Autocomplete data - extracted from existing cartoes
const contas = computed(() => {
  const uniqueContas = new Set(cartoes.value.map(c => c.conta));
  return Array.from(uniqueContas);
});

const categorias = computed(() => {
  const uniqueCategorias = new Set(cartoes.value.map(c => c.categoria));
  // Add some default categories
  const defaults = ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Moradia', 'Lazer', 'Outros', 'Receita'];
  defaults.forEach(cat => uniqueCategorias.add(cat));
  return Array.from(uniqueCategorias);
});

const uploadCollection = 'uploads';
const fileFieldName = 'file';
const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;

const currentUserId = computed(() => {
  // Para login de teste, usa um ID fictício
  const testLogin = sessionStorage.getItem('testLogin')
  if (testLogin === 'true') {
    return 'test-user-id'
  }
  return pb.authStore.model?.id || ''
});



const acceptedFileTypes = '.jpg,.jpeg,.png';

// Limpa todos os arquivos e estado
const clearFiles = () => {
  clearObjectURLs();
  files.value = [];
  uploadStatus.value = 'idle';
  uploadMessage.value = '';
  cartoes.value = [];
  recordId.value = null;
};

// Limpa as URLs de objeto criadas para evitar vazamento de memória
const clearObjectURLs = () => {
  files.value.forEach(file => {
    if (isImage(file)) {
      URL.revokeObjectURL(getFilePreviewUrl(file) || '');
    }
  });
};

// Verifica se o arquivo é uma imagem
const isImage = (file: File): boolean => {
  return file.type.startsWith('image/');
};

// Gera uma URL para preview do arquivo
const getFilePreviewUrl = (file: File): string | null => {
  if (isImage(file)) {
    return URL.createObjectURL(file);
  }
  return null;
};

// Formata a data para exibição
const formatarData = (timestamp: number | undefined): string => {
  if (!timestamp) return 'Data inválida';
  
  const data = new Date(timestamp);
  return data.toLocaleDateString('pt-BR');
};

// Computa o tamanho do arquivo em formato legível
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Remove o arquivo da lista
const removeFile = () => {
  clearObjectURLs();
  files.value = [];
  cartoes.value = [];
  recordId.value = null;
};

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
    },
    {
      data: "21/09/2025 14:15",
      conta: "CAIXA ECONOMICA",
      valor: 1200,
      descricao: "SALARIO SETEMBRO",
      categoria: "Receita",
      orcamento: "21/09/2025",
      observacao: "Crédito de salário mensal"
    }
  ];
};

// Processa a resposta do webhook e extrai os cartões
const processWebhookResponse = (responseData: any): CartaoData[] => {
  // A resposta pode ser diretamente um array ou um objeto com a propriedade cartoes
  if (Array.isArray(responseData)) {
    return responseData as CartaoData[];
  } else if (responseData && responseData.cartoes && Array.isArray(responseData.cartoes)) {
    return responseData.cartoes as CartaoData[];
  } else if (responseData && responseData.data && Array.isArray(responseData.data)) {
    return responseData.data as CartaoData[];
  } else {
    throw new Error('Formato de resposta inválido do backend');
  }
};

// Apaga a imagem do PocketBase após o processamento
const deleteUploadedImage = async (recordId: string): Promise<void> => {
  try {
    await pb.collection(uploadCollection).delete(recordId);
    console.log('Imagem apagada com sucesso do PocketBase');
  } catch (error: any) {
    console.error('Erro ao apagar imagem:', error);
    // Não propaga o erro pois os cartões já foram criados
  }
};

const uploadFile = async () => {
  if (!files.value.length) {
    uploadStatus.value = 'error';
    uploadMessage.value = 'Selecione um arquivo antes de enviar.';
    return;
  }

  if (!currentUserId.value) {
    uploadStatus.value = 'error';
    uploadMessage.value = 'Faça login para enviar arquivos.';
    return;
  }

  // Limpa cartões anteriores
  cartoes.value = [];
  recordId.value = null;

  uploadStatus.value = 'uploading';
  uploadMessage.value = 'Enviando arquivo para processamento...';

  // Para desenvolvimento/teste: usar dados mockados
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    // Simula o processo de upload e análise
    uploadStatus.value = 'analyzing';
    uploadMessage.value = 'Analisando documento...';
    
    // Simula tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Obtém dados mockados
    const cartaosList = mockBackendResponse();
    
    // Armazena os cartões no estado
    cartoes.value = cartaosList;
    
    // Remove o arquivo local da interface
    clearObjectURLs();
    files.value = [];
    
    uploadStatus.value = 'success';
    uploadMessage.value = `${cartaosList.length} cartão(ões) criado(s) com sucesso!`;
    return;
  }

  // Fluxo real para produção
  const formData = new FormData();
  formData.append('user_id', currentUserId.value);
  formData.append('status', 'uploaded'); // Status inicial
  formData.append(fileFieldName, files.value[0]);

  try {
    // 1. Upload do arquivo para o PocketBase
    const record = await pb.collection(uploadCollection).create(formData);
    recordId.value = record.id;
    const fileName = (record as Record<string, any>)[fileFieldName] as string | undefined;

    if (!fileName) {
      throw new Error('PocketBase não retornou o arquivo.');
    }

    // 2. Busca entries existentes
    const entries = await fetchEntries()
    
    // 3. Envia para o webhook e processa a resposta diretamente
    const uploadUri = pb.files.getUrl(record, fileName);
    uploadStatus.value = 'analyzing';
    uploadMessage.value = 'Analisando documento...';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        'upload-uri': uploadUri,
        'record-id': record.id,
        'entries': apiEntries.value,
        'categories': apiCategorias.value
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error('Falha ao processar a imagem no servidor.');
    }

    // 4. Processa a resposta do webhook diretamente
    const webhookData = await webhookResponse.json();
    const cartaosList = processWebhookResponse(webhookData);
    
    // 5. Armazena os cartões no estado
    cartoes.value = cartaosList;
    
    // 6. Apaga a imagem do PocketBase
    await deleteUploadedImage(record.id);
    
    // 7. Remove o arquivo local da interface
    clearObjectURLs();
    files.value = [];
    
    uploadStatus.value = 'success';
    uploadMessage.value = `${cartaosList.length} cartão(ões) criado(s) com sucesso!`;
    
  } catch (error: any) {
    uploadStatus.value = 'error';
    uploadMessage.value = error?.message || 'Falha ao processar o arquivo.';
    console.error('Erro no upload:', error);
  }
};

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    clearFiles();
    files.value.push(input.files[0]);
    uploadMessage.value = '';
    uploadStatus.value = 'idle';
  }
};

// Handle cartao click to open modal
const handleCartaoClick = (cartao: CartaoData) => {
  const index = cartoes.value.findIndex(c => 
    c.data === cartao.data && 
    c.descricao === cartao.descricao && 
    c.valor === cartao.valor
  );
  selectedCartaoIndex.value = index;
  selectedCartao.value = { ...cartao };
  showModal.value = true;
};

// Handle modal close
const handleModalClose = () => {
  showModal.value = false;
  selectedCartao.value = null;
  selectedCartaoIndex.value = -1;
};

// Handle save from modal
const handleSave = async (updatedCartao: CartaoData) => {
  try {
    // Remove the cartao from the array
    if (selectedCartaoIndex.value >= 0) {
      cartoes.value.splice(selectedCartaoIndex.value, 1);
    }

    // Close modal
    handleModalClose();
    
    // Show success message
    uploadStatus.value = 'success';
    uploadMessage.value = 'Lançamento enviado com sucesso!';
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      if (uploadStatus.value === 'success') {
        uploadMessage.value = '';
        uploadStatus.value = 'idle';
      }
    }, 3000);

    // If no more cards, reset to initial state
    if (cartoes.value.length === 0) {
      clearFiles();
    }

  } catch (error: any) {
    console.error('Erro ao salvar:', error);
    alert('Erro ao salvar o lançamento: ' + (error?.message || 'Erro desconhecido'));
  }
};

// Handle submit directly from CartaoItem without opening modal
const handleSubmitCartao = async (cartao: CartaoData) => {
  try {
    // Find and remove the cartao from the array
    const index = cartoes.value.findIndex(c =>
      c.data === cartao.data &&
      c.descricao === cartao.descricao &&
      c.valor === cartao.valor
    )
    
    if (index >= 0) {
      cartoes.value.splice(index, 1)
    }

    // Show success message
    uploadStatus.value = 'success'
    uploadMessage.value = 'Lançamento enviado com sucesso!'

    // Clear success message after 3 seconds
    setTimeout(() => {
      if (uploadStatus.value === 'success') {
        uploadMessage.value = ''
        uploadStatus.value = 'idle'
      }
    }, 3000)

    // If no more cards, reset to initial state
    if (cartoes.value.length === 0) {
      clearFiles()
    }

  } catch (error: any) {
    console.error('Erro ao salvar:', error)
    alert('Erro ao salvar o lançamento: ' + (error?.message || 'Erro desconhecido'))
  }
}

</script>
<template>




    <div class="upload-area">
        <h2 class="upload-title">Análise de Documento</h2>
        <p class="upload-description">Envie extratos e comprovantes para análise automática</p>
    </div>

 <!-- Cartões processados -->
    <div v-if="cartoes.length > 0" class="cartoes-section">
      <div class="cartoes-header">
        <h3>Cartões Processados</h3>
        <button class="new-analysis-button" @click="clearFiles">Nova Análise</button>
      </div>
      <div class="cartoes-list">
        <CartaoItem 
          v-for="(cartao, index) in cartoes" 
          :key="index" 
          :cartao="cartao"
          @click="handleCartaoClick"
          @submit="handleSubmitCartao"
        />
      </div>
    </div>

        <!-- Área de seleção de arquivos simplificada -->
    <div class="file-selection-container">
      <div v-if="files.length === 0 && cartoes.length === 0" class="file-selection">
        <div class="upload-icon">📄</div>
        <p>Selecione um documento para análise</p>
        <label class="file-select-button">
          Escolher arquivo
          <input class="file-input" type="file" accept=".jpg,.jpeg,.png" @change="handleFileSelect">
        </label>
        <p class="file-types-hint">Formatos aceitos: JPG, PNG</p>
      </div>

      <!-- Arquivo selecionado -->
      <div v-else-if="files.length > 0" class="file-list">
        <div class="file-item">
          <div class="file-preview">
            <img v-if="getFilePreviewUrl(files[0])" :src="getFilePreviewUrl(files[0])" class="file-thumbnail" alt="preview" />
            <span v-else class="file-icon">📄</span>
          </div>
          <div class="file-info">
            <p class="file-name">{{ files[0].name }}</p>
            <div class="file-meta">
              <span>{{ files[0].type || 'Formato desconhecido' }}</span>
              <span>{{ formatFileSize(files[0].size) }}</span>
            </div>
          </div>
          <button class="remove-file-button" type="button" @click="removeFile">✕</button>
        </div>

        <button 
          class="submit-button" 
          type="button" 
          :disabled="uploadStatus === 'uploading' || uploadStatus === 'analyzing'" 
          @click="uploadFile"
        >
          <span v-if="uploadStatus === 'uploading'">Enviando...</span>
          <span v-else-if="uploadStatus === 'analyzing'">Analisando...</span>
          <span v-else>Analisar Documento</span>
        </button>
      </div>
    </div>

    <!-- Status message -->
    <div v-if="uploadMessage" class="status-message"
         :class="{
           'upload-progress': uploadStatus === 'uploading' || uploadStatus === 'analyzing',
           'upload-success': uploadStatus === 'success',
           'upload-error': uploadStatus === 'error'
         }">
      {{ uploadMessage }}
    </div>

   
    <!-- Modal de edição -->
    <EntryModal
      :show="showModal"
      :cartao="selectedCartao"
      :contas="contas"
      :categorias="categorias"
      @close="handleModalClose"
      @save="handleSave"
    />
</template>
<style scoped>
.upload-area {
  background-color: var(--color-card-background);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.upload-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-dark);
  margin-bottom: 0.5rem;
}

.upload-description {
  color: var(--color-text-light);
  margin-bottom: 1.5rem;
}

.file-selection-container {
  margin-bottom: 1.5rem;
  background-color: var(--color-background-light);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.file-selection {
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.upload-icon {
  font-size: 3rem;
  color: var(--color-text-light);
  margin-bottom: 0.5rem;
}

.file-select-button {
  background-color: var(--color-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.file-select-button:hover {
  background-color: var(--color-hover-blue);
}

.file-types-hint {
  font-size: 0.875rem;
  color: var(--color-text-light);
  margin-top: 0.5rem;
}

.file-input {
  display: none;
}

.file-list {
  width: 100%;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 1rem;
}

.file-preview {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  background-color: white;
  border-radius: 4px;
  overflow: hidden;
}

.file-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  font-size: 1.5rem;
}

.file-info {
  flex-grow: 1;
  overflow: hidden;
  text-align: left;
}

.file-name {
  font-weight: 500;
  color: var(--color-text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.file-meta {
  display: flex;
  font-size: 0.875rem;
  color: var(--color-text-light);
  gap: 0.5rem;
}

.remove-file-button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--color-background-light);
  color: var(--color-text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.remove-file-button:hover {
  background-color: var(--color-accent);
  color: white;
}

.analyze-button, 
.submit-button {
  width: 100%;
  padding: 1rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
  margin-bottom: 1rem;
}

.analyze-button {
  background-color: var(--color-secondary);
  color: white;
}

.analyze-button:hover:not(:disabled) {
  background-color: var(--color-hover-blue);
}

.submit-button {
  background-color: var(--color-primary);
  color: white;
}

.submit-button:hover:not(:disabled) {
  background-color: var(--color-hover-blue);
}

.analyze-button:disabled,
.submit-button:disabled {
  background-color: var(--color-border);
  cursor: not-allowed;
}

.status-message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
  font-weight: 500;
}

.upload-analyzing {
  background-color: #e0f2fe;
  color: #1e40af;
}

.upload-progress {
  background-color: #e0f2fe;
  color: #1e40af;
}

.upload-success {
  background-color: #d1fae5;
  color: #065f46;
}

.upload-error {
  background-color: #fee2e2;
  color: #991b1b;
}

.analysis-result {
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.analysis-result h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--color-text-dark);
}

.result-fields {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.result-field {
  display: flex;
  flex-direction: column;
}

.result-field.full-width {
  grid-column: span 2;
}

.result-field label {
  font-size: 0.875rem;
  color: var(--color-text-light);
  margin-bottom: 0.25rem;
}

.result-field p {
  font-size: 1rem;
  color: var(--color-text-dark);
  font-weight: 500;
  padding: 0.5rem;
  background-color: white;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.result-field p.value {
  color: var(--color-primary);
  font-weight: 600;
}

@media (max-width: 640px) {
  .result-fields {
    grid-template-columns: 1fr;
  }
  
  .result-field.full-width {
    grid-column: span 1;
  }
}

.cartoes-section {
  margin-top: 2rem;
}

.cartoes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--color-border);
}

.cartoes-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-dark);
  margin: 0;
}

.new-analysis-button {
  background-color: var(--color-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  border: none;
}

.new-analysis-button:hover {
  background-color: var(--color-hover-blue);
}

.cartoes-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
</style>