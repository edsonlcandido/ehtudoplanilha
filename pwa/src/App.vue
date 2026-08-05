<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import pb from './pocketbase' // Import PocketBase instance
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

const logout = () => {
  pb.authStore.clear()
  router.push('/login')
}

// Check auth status on app load or route change
router.isReady().then(() => {
  if (router.currentRoute.value.meta.requiresAuth && !pb.authStore.isValid) {
    // Allow for testing
    const isTestLogin = sessionStorage.getItem('testLogin') === 'true'
    if (!isTestLogin) {
      router.push('/login')
    }
  }
})

// Dashboard URL from environment variable
const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'https://dev.planilha.ehtudo.app/dashboard/'

// Check if user is logged in to show menu
// Using route.path to make it reactive to navigation changes
const isLoggedIn = computed(() => {
  // Force reactivity by referencing route.path
  const currentPath = route.path
  return (pb.authStore.isValid || sessionStorage.getItem('testLogin') === 'true') && currentPath !== '/login'
})
</script>

<template>
  <div id="app-container">
    <nav class="app-header">
      
      <h1 class="app-title">Planilha Eh Tudo</h1>

    </nav>
    <main class="app-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background-light);
}

.app-header {
  background-color: var(--color-card-background);
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.app-title {
  font-size: 1.25rem; /* Mobile first */
  font-weight: bold;
  color: var(--color-text-dark);
}

.app-menu {
  background-color: var(--color-card-background);
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-button {
  align-items: center;
  border-radius: 8px;
  color: rgb(255, 255, 255);
  display: flex;
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 14.4px;
  height: 40px;
  justify-content: flex-start;
  margin: 0 8px 0 8px;
  padding: 0 12px;
  width: 143px;
  transition: background-color 0.3s ease;
  cursor: pointer;
  text-decoration: none;
  gap: 8px;
}

.dashboard-button {
  background-color: rgb(52, 152, 219);
}

.dashboard-button:hover {
  background-color: rgb(41, 128, 185);
}

.button-icon {
  font-size: 16px;
  line-height: 1;
}

.button-text {
  font-weight: 500;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  color: var(--color-primary);
  text-decoration: none;
  padding: 0.5rem 0.25rem; /* Adjust padding for mobile */
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--color-hover-blue);
  text-decoration: underline;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem; /* Smaller for mobile */
  font-weight: 500;
  transition: background-color 0.2s ease, transform 0.1s ease;
  white-space: nowrap;
}

.btn:active {
  transform: scale(0.98);
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-hover-blue);
}

.btn-danger {
  background-color: var(--color-accent);
  color: white;
}

.btn-danger:hover {
  background-color: var(--color-hover-red);
}

.app-content {
  flex-grow: 1;
  padding: 1rem;
  /* Adjust max-width for larger screens if needed, but start full-width for mobile */
}

@media (min-width: 768px) {
  .app-title {
    font-size: 1.75rem;
  }
  .btn {
    font-size: 1rem;
    padding: 0.75rem 1.25rem;
  }
  .app-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
  }
}
</style>
