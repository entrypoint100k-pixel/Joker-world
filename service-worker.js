
"use strict";

const CACHE_NAME = "joker-worlds-v1";
const APP_URL = "./";

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const response = await fetch(APP_URL);
      if (response.ok) {
        await cache.put(APP_URL, response);
      }
    } catch (error) {
      console.log("No se pudo guardar la página inicial.");
    }

    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith("joker-worlds-") &&
          key !== CACHE_NAME
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(APP_URL, response.clone());
        }

        return response;
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match(APP_URL) ||
          new Response("Necesitás conexión para abrir JOKER WORLDS.", {
            status: 503
          });
      }
    })());

    return;
  }

  event.respondWith((async () => {
    try {
      const response = await fetch(request);

      if (response.ok && response.type === "basic") {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(request) || Response.error();
    }
  })());
});
