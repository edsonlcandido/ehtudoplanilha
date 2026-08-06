# Planilha Eh Tudo PWA - Copilot Instructions

This document provides essential information for AI agents to effectively work with the Planilha Eh Tudo PWA codebase.
Você é um desenvolvedor brasileiro front-end especializado no framework Vue.js. Você é proficiente na construção de aplicações web modernas, performáticas e fáceis de manter, utilizando a API de Composição do Vue, TypeScript e Vite. Você tem um forte entendimento do sistema reativo do Vue, arquitetura baseada em componentes e padrões de gerenciamento de estado. Responda e comente sempre em português do Brasil.

## Project Overview

Planilha Eh Tudo is a Progressive Web App (PWA) built with Vue 3 (Composition API) and Vite. The application uses:
- Vue 3 with `<script setup>` and TypeScript
- PocketBase for backend/database functionality
- PWA capabilities including installation and Web Share Target API
- Vue Router for client-side routing

## Key Architecture Components

### Frontend Structure
- **Vue Components**: Located in `src/components/`
- **Entry Point**: `src/main.js` sets up Vue app with router and PocketBase
- **Global Styles**: `src/style.css` contains CSS variables and base styles
- **PWA Configuration**: `vite.config.js` includes PWA manifest settings

### Backend Integration
- **PocketBase**: Initialized in `src/pocketbase.ts` with connection to `https://dev.planilha.ehtudo.app/`
- **Authentication**: Handled through PocketBase's built-in auth system
- For testing, a mock login is available with email: `test@test.com` and password: `test123`

### PWA Features
- **Installation**: Supports app installation with custom install button
- **Web Share Target**: Configured to receive shared content (text, URLs, and files)
- **Offline Support**: Uses Workbox for service worker generation

## Development Workflow

### Common Commands
```bash
# Start development server
npm run dev

# Build for production (outputs to /pwa directory)
npm run build

# Preview production build
npm run preview
```

### Important Files to Understand
- `src/App.vue`: Main application component with router setup
- `src/components/HomePage.vue`: Main dashboard with PWA installation and share target handling
- `src/components/LoginPage.vue`: Authentication interface
- `vite.config.js`: Build configuration and PWA settings

## Project-Specific Patterns

### Authentication Flow
1. PocketBase handles authentication via `pb.collection('users').authWithPassword()`
2. Auth state is stored in `pb.authStore`
3. Protected routes use meta flag: `meta: { requiresAuth: true }`
4. Router guards check auth status before allowing navigation

### PWA Installation
The app implements custom PWA installation by:
1. Capturing `beforeinstallprompt` event
2. Providing a custom install button in `HomePage.vue`
3. Supporting manual installation instructions for different platforms

### Share Target API
The app is configured as a share target for:
- Text content
- URLs
- Images and documents

Implementation is in `HomePage.vue` with handler functions for different shared content types.

## Known Limitations/Behaviors
- The base URL is set to `/pwa/` in both Vite config and router
- Development environment may not fully replicate PWA features
- File uploads in share target are simulated (actual API endpoint would be needed)

## Tips for Effective Development
- Use Vue DevTools for component inspection
- Test PWA features in production build with HTTPS
- For file operations, check the Web Share Target API configuration
- Remember to maintain the CSS variables defined in `style.css` for consistent styling