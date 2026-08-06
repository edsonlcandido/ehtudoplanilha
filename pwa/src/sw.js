import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { clientsClaim } from 'workbox-core'

// Precache all assets
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Allow the service worker to take control immediately
self.skipWaiting()
clientsClaim()

// Handle navigation requests
const handler = createHandlerBoundToURL('/pwa/index.html')
const navigationRoute = new NavigationRoute(handler, {
  // Don't handle POST requests with the navigation route
  allowlist: [],
  // IMPORTANTE: denylist do /pwa/login. É o redirect_uri do Google OAuth
  // e precisa chegar ao PB como request real, com os query params (code+state)
  // intactos. Se o SW interceptar e servir /pwa/index.html, o handler
  // pode descartar os query params e o callback OAuth nunca é processado.
  denylist: [/\/pwa\/login/],
})
registerRoute(navigationRoute)

// Handle Share Target POST requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Check if this is a POST request to the share target action
  if (event.request.method === 'POST' && url.pathname === '/pwa/') {
    event.respondWith(
      (async () => {
        // Get the form data from the POST request
        const formData = await event.request.formData()
        const file = formData.get('file')
        const title = formData.get('title')
        const text = formData.get('text')
        const url = formData.get('url')

        // Store the shared data in Cache API for the app to retrieve
        const cache = await caches.open('share-target-cache')
        // Use a single timestamp for both shareData and cache key to ensure
        // the file can be retrieved correctly by HomePage.vue
        const timestamp = Date.now()
        const shareData = {
          file: file ? {
            name: file.name,
            type: file.type,
            size: file.size,
            // Convert file to base64 or store as blob URL
            data: file
          } : null,
          title: title || '',
          text: text || '',
          url: url || '',
          timestamp: timestamp
        }
        
        // Store the file separately if it exists
        if (file) {
          await cache.put(
            new Request(`/pwa/shared-file-${timestamp}`),
            new Response(file, {
              headers: {
                'Content-Type': file.type,
                'X-File-Name': file.name
              }
            })
          )
        }
        
        // Store metadata
        await cache.put(
          new Request('/pwa/shared-data'),
          new Response(JSON.stringify(shareData), {
            headers: { 'Content-Type': 'application/json' }
          })
        )

        // Redirect to the app
        return Response.redirect('/pwa/?share=true', 303)
      })()
    )
  }
})
