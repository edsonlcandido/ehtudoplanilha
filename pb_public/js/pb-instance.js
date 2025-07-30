/**
 * Singleton para instância do PocketBase
 * Garante uma única instância do PocketBase em toda a aplicação
 */
import apiConfig from "./api-config";

// Cria e exporta a instância única do PocketBase
const pb = new PocketBase(apiConfig.getBaseURL());

export default pb;
