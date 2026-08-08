import PocketBase from 'pocketbase'
import { POCKETBASE_URL } from './config'

// Em dev: vazio → SDK usa window.location.origin (= http://localhost:5174)
//        → chamadas /api/* vão pro Vite proxy → PB em :8090
// Em prod: vazio → SDK usa window.location.origin (= https://planilha.ehtudo.app)
//         → PB serve direto no mesmo domínio
// Vide pwa/src/config.ts pra detalhes da estratégia
const pb = new PocketBase(POCKETBASE_URL)

export default pb
