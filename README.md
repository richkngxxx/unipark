# UniPark España – web + PWA

Sitio estático y app web (PWA) de UniPark España. Vanilla JS, sin backend: los datos se guardan en `localStorage` del dispositivo.

- Web: https://richkngxxx.github.io/unipark/
- App: https://richkngxxx.github.io/unipark/app/

Zonas y precios son **datos de ejemplo**, no tarifas reales. UniPark no cobra ni valida aparcamientos y no está afiliada a Telpark ni a ningún ayuntamiento. Comisión en beta: 0,00 EUR.

## Estructura
- `index.html`, `como-funciona/`, `ciudades/`, `privacidad/`, `soporte/`, `blog/` – generados con `python3 build.py`
- `app/` – PWA (manifest, service worker, app.js)
- `sitemap.xml`, `robots.txt`
- Analítica: snippet GoatCounter comentado en cada página; sustituye `CODE` y descomenta.

## Enlaces UTM
- TikTok: https://richkngxxx.github.io/unipark/?utm_source=tiktok&utm_medium=social&utm_campaign=beta_launch
- Instagram: https://richkngxxx.github.io/unipark/?utm_source=instagram&utm_medium=social&utm_campaign=beta_launch
- YouTube: https://richkngxxx.github.io/unipark/?utm_source=youtube&utm_medium=video&utm_campaign=beta_launch
- Facebook: https://richkngxxx.github.io/unipark/?utm_source=facebook&utm_medium=social&utm_campaign=beta_launch
