import PocketBase from 'pocketbase'
import { POCKETBASE_URL } from './config'

// IMPORTANTE: POCKETBASE_URL precisa ser ABSOLUTO (vide config.ts).
// URL vazia faz o SDK montar paths errados tipo
// http://host/pwa/login/api/... por causa do buildURL() do pocketbase@0.26.x.
// Em dev: POCKETBASE_URL = http://localhost:5174/ → Vite proxy → PB :8090
// Em prod: POCKETBASE_URL = https://planilha.ehtudo.app/ → PB mesmo domínio
const pb = new PocketBase(POCKETBASE_URL)

export default pb
