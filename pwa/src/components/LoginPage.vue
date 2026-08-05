<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import pb from '../pocketbase' // Import your PocketBase instance
import AuthOAuthService from '../services/auth-oauth'

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const isLoading = ref(false)
const router = useRouter()

const login = async () => {
  error.value = null
  isLoading.value = true
  
  // For PWA testing purposes, allow a test login
  if (email.value === 'test@test.com' && password.value === 'test123') {
    // Simulate successful login for testing
    sessionStorage.setItem('testLogin', 'true')
    router.push('/') // Redirect to home page
    return
  }
  
  try {
    await pb.collection('users').authWithPassword(email.value, password.value)
    router.push('/') // Redirect to home page on successful login
  } catch (err: any) {
    error.value = err.message || 'An unknown error occurred during login.'
    console.error('Login error:', err)
  } finally {
    isLoading.value = false
  }
}

const loginWithGoogle = async () => {
  error.value = null
  isLoading.value = true
  
  try {
    // Usa fluxo manual de OAuth (sem EventSource/SSE)
    // Redireciona para Google OAuth - a página será recarregada após callback
    await AuthOAuthService.loginWithGoogle()
    // Nota: o código abaixo não será executado pois haverá um redirect
  } catch (err: any) {
    error.value = err.message || 'Erro ao autenticar com o Google.'
    console.error('Google login error:', err)
    isLoading.value = false
  }
}

// Verificar se estamos retornando de um callback OAuth
onMounted(async () => {
  // Verificar se há erro nos parâmetros da URL
  const params = new URLSearchParams(window.location.search)
  const urlError = params.get('error')
  const urlErrorDescription = params.get('error_description')
  
  if (urlError) {
    error.value = urlErrorDescription || `Erro OAuth: ${urlError}`
    console.error('[Login] Erro OAuth na URL:', urlError, urlErrorDescription)
    
    // Limpar parâmetros da URL
    const cleanUrl = `${window.location.origin}${window.location.pathname}`
    window.history.replaceState({}, document.title, cleanUrl)
    return
  }
  
  if (AuthOAuthService.isOAuthCallback()) {
    isLoading.value = true
    error.value = null
    
    try {
      // Processar callback OAuth
      const success = await AuthOAuthService.handleOAuthCallback()
      
      if (success) {
        // Redirecionar para home após sucesso
        router.push('/')
      }
    } catch (err: any) {
      error.value = err.message || 'Erro ao processar autenticação com Google.'
      console.error('OAuth callback error:', err)
    } finally {
      isLoading.value = false
    }
  }
})
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="login-title">Login</h2>
      
      <form @submit.prevent="login" class="login-form">
        <div class="form-group">
          <label for="email" class="form-label">Email:</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label for="password" class="form-label">Password:</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            class="form-input"
          />
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary login-button"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Entrando...' : 'Login' }}
        </button>
        
        <div class="divider">
          <span>ou</span>
        </div>
        
        <button 
          type="button"
          @click="loginWithGoogle"
          class="btn btn-google"
          :disabled="isLoading"
        >
          <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar com Google
        </button>
        
        <p v-if="error" class="error-message">{{ error }}</p>
        
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-light);
  padding: 1rem;
}

.login-card {
  background-color: var(--color-card-background);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 360px; /* Constrain width for better mobile readability */
  text-align: center;
}

.login-title {
  margin-bottom: 1.5rem;
  color: var(--color-text-dark);
  font-size: 1.5rem;
  font-weight: bold;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--color-text-light);
  font-size: 0.875rem;
  text-align: left;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
  background-color: var(--color-card-background);
  color: var(--color-text-dark);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); /* Focus ring */
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.login-button:hover {
  background-color: var(--color-hover-blue);
}

.login-button:active {
  transform: scale(0.98);
}

.error-message {
  color: var(--color-accent);
  margin-top: 1rem;
  font-size: 0.875rem;
}

.divider {
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
  color: var(--color-text-light);
  font-size: 0.875rem;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--color-border);
}

.divider span {
  padding: 0 1rem;
}

.btn-google {
  width: 100%;
  padding: 0.75rem;
  background-color: white;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.btn-google:hover:not(:disabled) {
  background-color: #f9fafb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-google:active:not(:disabled) {
  transform: scale(0.98);
}

.btn-google:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-icon {
  width: 20px;
  height: 20px;
}

.login-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-info {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 6px;
  font-size: 0.875rem;
  text-align: center;
}

.test-info p {
  margin: 0.25rem 0;
  color: #0369a1;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .login-card {
    padding: 3rem;
    max-width: 450px;
  }
  .login-title {
    font-size: 2rem;
  }
}
</style>
