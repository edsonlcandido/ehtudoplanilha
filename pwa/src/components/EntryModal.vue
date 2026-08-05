<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { CartaoData, GetEntriesResponse, GetCategoriesResponse } from '../types'
import pb from '../pocketbase'

interface Props {
  show: boolean
  cartao: CartaoData | null
  contas: string[]
  categorias: string[]
}

interface Emits {
  (e: 'close'): void
  (e: 'save', cartao: CartaoData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Estados para dados das APIs
const apiContas = ref<string[]>([])
const apiCategorias = ref<string[]>([])
const isLoadingContas = ref(false)
const isLoadingCategorias = ref(false)

// Buscar contas únicas da API de entries
const fetchContas = async () => {
  const entriesUrl = import.meta.env.VITE_GET_ENTRIES_URL
  if (!entriesUrl) {
    console.warn('VITE_GET_ENTRIES_URL não configurada')
    return
  }

  isLoadingContas.value = true
  try {
    // Obter token de autenticação do PocketBase
    const token = pb.authStore.token
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Adicionar token se estiver disponível
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
        // Extrair contas únicas
        const contasSet = new Set<string>()
        data.entries.forEach(entry => {
          if (entry.conta && entry.conta.trim() !== '') {
            contasSet.add(entry.conta.trim())
          }
        })
        apiContas.value = Array.from(contasSet).sort()
        console.log(`✅ ${apiContas.value.length} contas únicas carregadas`)
      }
    } else {
      console.warn(`⚠️ Erro ao buscar contas: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.warn('⚠️ Erro ao buscar contas:', error)
  } finally {
    isLoadingContas.value = false
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
    // Obter token de autenticação do PocketBase
    const token = pb.authStore.token
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Adicionar token se estiver disponível
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

// Buscar dados quando o modal for aberto pela primeira vez
const dataLoaded = ref(false)
watch(() => props.show, (isShown) => {
  if (isShown && !dataLoaded.value) {
    dataLoaded.value = true
    fetchContas()
    fetchCategorias()
  }
})

// Combinar contas das props com contas da API
const allContas = computed(() => {
  const combined = [...props.contas, ...apiContas.value]
  return Array.from(new Set(combined)).sort()
})

// Combinar categorias das props com categorias da API
const allCategorias = computed(() => {
  const combined = [...props.categorias, ...apiCategorias.value]
  return Array.from(new Set(combined)).sort()
})

// Form data
const formData = ref<CartaoData>({
  data: '',
  conta: '',
  valor: 0,
  descricao: '',
  categoria: '',
  orcamento: '',
  observacao: ''
})

// Valor sign state (for toggle button)
const valorSign = ref<'-' | '+'>('-')

// Computed property for valor input (always absolute value)
const valorAbsoluto = computed({
  get: () => Math.abs(formData.value.valor),
  set: (value: number) => {
    formData.value.valor = Math.abs(value)
  }
})

// Autocomplete states
const showContaAutocomplete = ref(false)
const showCategoriaAutocomplete = ref(false)
const contaInput = ref<HTMLInputElement | null>(null)
const categoriaInput = ref<HTMLInputElement | null>(null)

// Filtered options for autocomplete
const filteredContas = computed(() => {
  if (!formData.value.conta) return allContas.value
  return allContas.value.filter(conta => 
    conta.toLowerCase().includes(formData.value.conta.toLowerCase())
  )
})

const filteredCategorias = computed(() => {
  if (!formData.value.categoria) return allCategorias.value
  return allCategorias.value.filter(categoria => 
    categoria.toLowerCase().includes(formData.value.categoria.toLowerCase())
  )
})

// Toggle valor sign
const toggleValorSign = () => {
  valorSign.value = valorSign.value === '-' ? '+' : '-'
}

// Watch for prop changes to update form data
watch(() => props.cartao, (newCartao) => {
  if (newCartao) {
    formData.value = { ...newCartao, valor: Math.abs(newCartao.valor) }
    // Set the sign based on the original valor
    valorSign.value = newCartao.valor < 0 ? '-' : '+'
  }
}, { immediate: true })

// Handle autocomplete selection
const selectConta = (conta: string) => {
  formData.value.conta = conta
  showContaAutocomplete.value = false
}

const selectCategoria = (categoria: string) => {
  formData.value.categoria = categoria
  showCategoriaAutocomplete.value = false
}

// Convert date string "DD/MM/YYYY" to Excel epoch number
const convertToExcelEpoch = (dateString: string): number => {
  if (!dateString) return 0
  
  const parts = dateString.split('/')
  if (parts.length !== 3) return 0
  
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)
  
  // Use UTC to avoid timezone issues
  // Create date at noon UTC to avoid any edge cases with timezone conversions
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
  
  // Excel epoch starts at December 30, 1899 at noon UTC
  const excelEpoch = new Date(Date.UTC(1899, 11, 30, 12, 0, 0))
  
  // Calculate difference in milliseconds and convert to days
  const diffTime = date.getTime() - excelEpoch.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

// Handle form submission
const handleSubmit = async () => {
  if (!formData.value.descricao || !formData.value.categoria || !formData.value.orcamento) {
    alert('Por favor, preencha os campos obrigatórios: Descrição, Categoria e Orçamento')
    return
  }
  
  // Apply the sign to the valor
  const finalValor = valorSign.value === '-' ? -Math.abs(formData.value.valor) : Math.abs(formData.value.valor)
  const dataToSave = { ...formData.value, valor: finalValor }
  
  // Para desenvolvimento: simular envio bem-sucedido (apenas em DEV, não em produção com testLogin)
  const isDevelopment = import.meta.env.DEV
  
  if (isDevelopment) {
    console.log('✅ Modo desenvolvimento: simulando envio bem-sucedido')
    console.log('📦 Dados a serem salvos:', dataToSave)
    
    // Simula tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Emit save event to notify parent that the entry was saved successfully
    emit('save', dataToSave)
    emit('close')
    return
  }
  
  // Send data to append-entry endpoint
  const appendEntryUrl = import.meta.env.VITE_APPEND_ENTRY_URL
  if (!appendEntryUrl) {
    console.warn('VITE_APPEND_ENTRY_URL não configurada')
    emit('save', dataToSave)
    return
  }
  
  try {
    // Obter token de autenticação do PocketBase
    const token = pb.authStore.token
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    // Adicionar token se estiver disponível
    if (token) {
      headers['Authorization'] = `${token}`
    }
    
    // Preparar body no formato esperado pela API
    const requestBody = {
      data: dataToSave.data,
      conta: dataToSave.conta,
      valor: dataToSave.valor,
      descricao: dataToSave.descricao,
      categoria: dataToSave.categoria,
      orcamento: convertToExcelEpoch(dataToSave.orcamento),
      obs: dataToSave.observacao
    }
    
    console.log('📤 Enviando requisição para:', appendEntryUrl)
    console.log('📦 Body da requisição:', requestBody)
    console.log('🔑 Token presente:', !!token)
    
    const response = await fetch(appendEntryUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      headers,
      body: JSON.stringify(requestBody)
    })
    
    console.log('📥 Status da resposta:', response.status, response.statusText)
    
    if (response.ok) {
      const responseData = await response.json()
      console.log('✅ Resposta da API:', responseData)
      console.log('✅ Lançamento enviado com sucesso')
      // Emit save event to notify parent that the entry was saved successfully
      emit('save', dataToSave)
      emit('close')
    } else {
      console.error(`❌ Erro ao enviar lançamento: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error('❌ Detalhes do erro:', errorText)
      alert(`Erro ao enviar lançamento: ${response.status} ${response.statusText}\n${errorText}`)
    }
  } catch (error) {
    console.error('❌ Erro ao enviar lançamento:', error)
    console.error('❌ Tipo de erro:', error instanceof TypeError ? 'TypeError (Network/CORS)' : 'Outro erro')
    alert(`Erro ao enviar lançamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n\nVerifique sua conexão e tente novamente.`)
  }
}

// Handle modal close
const handleClose = () => {
  emit('close')
}

// Handle clicks outside autocomplete to close it
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (showContaAutocomplete.value && !target.closest('.form-group')) {
    showContaAutocomplete.value = false
  }
  if (showCategoriaAutocomplete.value && !target.closest('.form-group')) {
    showCategoriaAutocomplete.value = false
  }
}

// Format date input to match expected format
const formatDateForInput = (dateString: string): string => {
  // Espera "23/09/2025 15:02" e converte para "2025-09-23T15:02"
  if (!dateString) return ''
  
  const parts = dateString.split(' ')
  if (parts.length !== 2) return ''
  
  const dateParts = parts[0].split('/')
  if (dateParts.length !== 3) return ''
  
  return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${parts[1]}`
}

const formatDateForOutput = (dateString: string): string => {
  // Converte "2025-09-23T15:02" para "23/09/2025 15:02"
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

const formatOrcamentoForInput = (dateString: string): string => {
  // Espera "23/09/2025" e converte para "2025-09-23"
  if (!dateString) return ''
  
  const parts = dateString.split('/')
  if (parts.length !== 3) return ''
  
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

const formatOrcamentoForOutput = (dateString: string): string => {
  // Converte "2025-09-23" para "23/09/2025"
  if (!dateString) return ''
  
  const parts = dateString.split('-')
  if (parts.length !== 3) return ''
  
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

// Computed properties for date inputs
const dataInput = computed({
  get: () => formatDateForInput(formData.value.data),
  set: (value: string) => {
    formData.value.data = formatDateForOutput(value)
  }
})

const orcamentoInput = computed({
  get: () => formatOrcamentoForInput(formData.value.orcamento),
  set: (value: string) => {
    formData.value.orcamento = formatOrcamentoForOutput(value)
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="entry-modal" @click="handleClose" @mousedown="handleClickOutside">
      <div class="entry-modal__content" @click.stop>
        <button class="entry-modal__close" @click="handleClose" aria-label="Fechar">
          ×
        </button>
        
        <h3 class="entry-modal__title">Lançamento de Despesa/Receita</h3>
        
        <form @submit.prevent="handleSubmit" class="entry-modal__form">
          <fieldset>
            <!-- Data -->
            <div class="form-group">
              <label for="expenseDate">Data:</label>
              <input
                type="datetime-local"
                id="expenseDate"
                v-model="dataInput"
                class="form-control"
              />
            </div>

            <!-- Conta com Autocomplete -->
            <div class="form-group">
              <label for="expenseAccount">Conta:</label>
              <input
                type="text"
                id="expenseAccount"
                ref="contaInput"
                v-model="formData.conta"
                @focus="showContaAutocomplete = true"
                @input="showContaAutocomplete = true"
                class="form-control"
                placeholder="Ex: Conta Corrente"
                autocomplete="off"
              />
              <div v-if="showContaAutocomplete && filteredContas.length > 0" class="autocomplete-dropdown">
                <div
                  v-for="conta in filteredContas"
                  :key="conta"
                  class="autocomplete-item"
                  @click="selectConta(conta)"
                >
                  {{ conta }}
                </div>
              </div>
            </div>

            <!-- Valor com toggle -->
            <div class="form-group valor-toggle-group">
              <label for="expenseValue">Valor:</label>
              <div class="valor-toggle-container">
                <button
                  type="button"
                  @click="toggleValorSign"
                  class="button outline entry-toggle"
                  :class="valorSign === '-' ? 'entry-toggle--expense' : 'entry-toggle--income'"
                  aria-label="Alternar sinal"
                >
                  {{ valorSign }}
                </button>
                <input
                  type="number"
                  id="expenseValue"
                  v-model.number="valorAbsoluto"
                  class="form-control"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <!-- Descrição -->
            <div class="form-group">
              <label for="expenseDescription">Descrição:</label>
              <input
                type="text"
                id="expenseDescription"
                v-model="formData.descricao"
                class="form-control"
                placeholder="Descrição da despesa"
                required
              />
            </div>

            <!-- Categoria com Autocomplete -->
            <div class="form-group">
              <label for="expenseCategory">Categoria:</label>
              <input
                type="text"
                id="expenseCategory"
                ref="categoriaInput"
                v-model="formData.categoria"
                @focus="showCategoriaAutocomplete = true"
                @input="showCategoriaAutocomplete = true"
                class="form-control"
                placeholder="Digite uma categoria"
                required
                autocomplete="off"
              />
              <div v-if="showCategoriaAutocomplete && filteredCategorias.length > 0" class="autocomplete-dropdown">
                <div
                  v-for="categoria in filteredCategorias"
                  :key="categoria"
                  class="autocomplete-item"
                  @click="selectCategoria(categoria)"
                >
                  {{ categoria }}
                </div>
              </div>
            </div>

            <!-- Orçamento -->
            <div class="form-group">
              <label for="expenseBudget">Orçamento (data-chave):</label>
              <input
                type="date"
                id="expenseBudget"
                v-model="orcamentoInput"
                class="form-control"
                required
              />
            </div>

            <!-- Observação -->
            <div class="form-group">
              <label for="expenseObservation">Observação:</label>
              <textarea
                id="expenseObservation"
                v-model="formData.observacao"
                rows="3"
                class="form-control"
                placeholder="Observações adicionais (opcional)"
              ></textarea>
            </div>

            <!-- Botões -->
            <div class="form-actions">
              <button type="button" class="button outline" @click="handleClose">
                Cancelar
              </button>
              <button type="submit" class="button primary">
                Salvar
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Modal overlay */
.entry-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem 1rem 90px 1rem;
  overflow-y: auto;
}

/* Modal content */
.entry-modal__content {
  background: white;
  padding: 1.5rem;
  border-radius: 4px;
  max-width: 480px;
  width: 90%;
  position: relative;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Close button */
.entry-modal__close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.entry-modal__close:hover {
  color: #333;
}

/* Title */
.entry-modal__title {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

/* Form */
.entry-modal__form {
  width: 100%;
}

fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

/* Form groups */
.form-group {
  margin-bottom: 1.25rem;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

/* Form controls */
.form-control {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  color: #333;
  background-color: white;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
}

.form-control::placeholder {
  color: #999;
}

textarea.form-control {
  resize: vertical;
  min-height: 70px;
  font-family: inherit;
}

/* Valor toggle group */
.valor-toggle-group {
  margin-bottom: 1.25rem;
}

.valor-toggle-container {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.entry-toggle {
  flex-shrink: 0;
  width: 3rem;
  padding: 0.625rem;
  font-size: 1.25rem;
  font-weight: bold;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.entry-toggle:hover {
  opacity: 0.9;
}

.entry-toggle--expense {
  background-color: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.entry-toggle--expense:hover {
  background-color: #c0392b;
  border-color: #c0392b;
}

.entry-toggle--income {
  background-color: #27ae60;
  color: white;
  border-color: #27ae60;
}

.entry-toggle--income:hover {
  background-color: #229954;
  border-color: #229954;
}

.valor-toggle-container .form-control {
  flex: 1;
}

/* Autocomplete dropdown */
.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  margin-top: -1px;
}

.autocomplete-item {
  padding: 0.625rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.95rem;
  color: #333;
}

.autocomplete-item:hover {
  background-color: #f8f9fa;
}

.autocomplete-item:not(:last-child) {
  border-bottom: 1px solid #f0f0f0;
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #ecf0f1;
}

/* Buttons */
.button {
  padding: 0.625rem 1.5rem;
  border-radius: 4px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.button.outline {
  background-color: white;
  color: #333;
  border-color: #ddd;
}

.button.outline:hover {
  background-color: #f8f9fa;
  border-color: #ccc;
}

.button.primary {
  background-color: #3498db;
  color: white;
  border-color: #3498db;
}

.button.primary:hover {
  background-color: #2980b9;
  border-color: #2980b9;
}

/* Responsive */
@media (max-width: 640px) {
  .entry-modal {
    padding: 0;
  }

  .entry-modal__content {
    max-height: 90vh;
    border-radius: 0;
    margin: 1rem;
  }

  .entry-modal__title {
    font-size: 1.1rem;
    padding-right: 2rem;
  }

  .form-actions {
    flex-direction: row;
  }

  .button {
    width: 100%;
  }
  .entry-toggle {
    width: 2.5rem;
    font-size: 1rem;
  }
}
</style>
