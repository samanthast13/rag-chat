# Chat RAG

App en React que responde preguntas sobre documentos de texto propios. Usa la API de Groq (plan gratuito).

## Cómo funciona
1. Se cargan archivos `.txt` o `.md`; se dividen en fragmentos de unos 600 caracteres.
2. Al preguntar, se eligen los 3 fragmentos con más palabras en común con la pregunta.
3. Esos fragmentos se envían como contexto al modelo `llama-3.3-70b-versatile`, que responde solo con ellos.

La recuperación es por coincidencia de palabras, sin embeddings.

## Uso
Hace falta una clave gratuita de https://console.groq.com.

Versión publicada: pegar la clave en el campo de la página. No se guarda; solo vive en memoria.

En local:
```
npm install
npm run dev
```
Opcional: copiar `.env.example` a `.env.local` y poner la clave en `VITE_GROQ_KEY` para que el campo aparezca relleno. No subir ese archivo (ya está en `.gitignore`).

## Publicación
El flujo `.github/workflows/pages.yml` construye y publica en GitHub Pages al hacer push a `main`. En el repositorio: Settings > Pages > Source: GitHub Actions.

## Limitaciones
La llamada a la API sale desde el navegador, por eso la clave la pone cada usuario. Para producción haría falta un servidor intermedio.
