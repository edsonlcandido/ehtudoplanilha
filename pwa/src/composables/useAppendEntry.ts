import pb from '../pocketbase'

export interface AppendEntryOptions {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export const useAppendEntry = () => {
  // Convert date string "DD/MM/YYYY" to Excel epoch number
  const convertToExcelEpoch = (dateString: string): number => {
    if (!dateString) return 0
    
    const parts = dateString.split('/')
    if (parts.length !== 3) return 0
    
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)
    const year = parseInt(parts[2], 10)
    
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
    const excelEpoch = new Date(Date.UTC(1899, 11, 30, 12, 0, 0))
    
    const diffTime = date.getTime() - excelEpoch.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  // Send entry to API
  const appendEntry = async (
    cartaoData: Record<string, any>,
    options?: AppendEntryOptions
  ): Promise<void> => {
    const isDevelopment = import.meta.env.DEV
    
    if (isDevelopment) {
      console.log('✅ Modo desenvolvimento: simulando envio bem-sucedido')
      console.log('📦 Dados a serem salvos:', cartaoData)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      options?.onSuccess?.()
      return
    }
    
    const appendEntryUrl = import.meta.env.VITE_APPEND_ENTRY_URL
    if (!appendEntryUrl) {
      console.warn('VITE_APPEND_ENTRY_URL não configurada')
      options?.onSuccess?.()
      return
    }
    
    try {
      const token = pb.authStore.token
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `${token}`
      }
      
      const requestBody = {
        data: cartaoData.data,
        conta: cartaoData.conta,
        valor: cartaoData.valor,
        descricao: cartaoData.descricao,
        categoria: cartaoData.categoria,
        orcamento: convertToExcelEpoch(cartaoData.orcamento),
        obs: cartaoData.observacao
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
        options?.onSuccess?.()
      } else {
        const errorText = await response.text()
        const error = new Error(
          `${response.status} ${response.statusText}\n${errorText}`
        )
        console.error('❌ Erro ao enviar lançamento:', error)
        options?.onError?.(error)
        throw error
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('❌ Erro ao enviar lançamento:', err)
      console.error('❌ Tipo de erro:', error instanceof TypeError ? 'TypeError (Network/CORS)' : 'Outro erro')
      options?.onError?.(err)
      throw err
    }
  }

  return {
    appendEntry,
    convertToExcelEpoch
  }
}
