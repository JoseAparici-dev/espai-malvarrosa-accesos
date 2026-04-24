const CACHE_NAME = 'espai-malvarrosa-v1'

// Archivos a cachear para funcionamiento básico offline
const ARCHIVOS_CACHE = [
  '/',
  '/index.html',
]

// Instalación: cachear archivos base
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ARCHIVOS_CACHE))
  )
  self.skipWaiting()
})

// Activación: limpiar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: red primero, caché como respaldo
self.addEventListener('fetch', event => {
  // Solo cachear peticiones GET
  if (event.request.method !== 'GET') return

  // No interceptar peticiones a Supabase — siempre red
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar copia en caché si la respuesta es válida
        if (response && response.status === 200) {
          const copia = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia))
        }
        return response
      })
      .catch(() => caches.match(event.request))
  )
})