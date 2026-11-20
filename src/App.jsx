import { useState } from "react";

const MODEL = "llama-3.3-70b-versatile";

// Divide el texto en fragmentos de ~600 caracteres respetando párrafos.
function trocear(texto) {
  const fragmentos = [];
  let actual = "";
  for (const p of texto.split(/\n\s*\n/)) {
    if (actual && actual.length + p.length > 600) {
      fragmentos.push(actual);
      actual = "";
    }
    actual += (actual ? "\n\n" : "") + p;
  }
  if (actual.trim()) fragmentos.push(actual);
  return fragmentos;
}

const palabras = (s) => s.toLowerCase().match(/\p{L}{4,}/gu) ?? [];

// Recuperación por coincidencia de palabras; devuelve los 3 fragmentos más afines.
function recuperar(fragmentos, pregunta) {
  const q = new Set(palabras(pregunta));
  return fragmentos
    .map((f) => ({ f, puntos: palabras(f).filter((w) => q.has(w)).length }))
    .filter((x) => x.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 3)
    .map((x) => x.f);
}

async function preguntar(apiKey, historial, contexto) {
  const system =
    "Responde solo con el contexto dado. Si la respuesta no está, dilo.\n\nContexto:\n" +
    (contexto.length ? contexto.join("\n---\n") : "(sin fragmentos relevantes)");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: system }, ...historial] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? res.statusText);
  return data.choices[0].message.content;
}

export default function App() {
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GROQ_KEY ?? "");
  const [fragmentos, setFragmentos] = useState([]);
  const [mensajes, setMensajes] = useState([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function cargarArchivos(e) {
    const textos = await Promise.all([...e.target.files].map((f) => f.text()));
    setFragmentos(textos.flatMap(trocear));
  }

  async function enviar(e) {
    e.preventDefault();
    const pregunta = entrada.trim();
    if (!pregunta || cargando) return;
    const historial = [...mensajes, { role: "user", content: pregunta }];
    setMensajes(historial);
    setEntrada("");
    setError("");
    setCargando(true);
    try {
      const respuesta = await preguntar(apiKey, historial, recuperar(fragmentos, pregunta));
      setMensajes([...historial, { role: "assistant", content: respuesta }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const listo = apiKey && fragmentos.length > 0;

  return (
    <main>
      <header>
        <h1>Chat sobre tus documentos</h1>
        <input type="password" placeholder="API key de Groq (gratis)" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        <input type="file" accept=".txt,.md" multiple onChange={cargarArchivos} />
        <small>{fragmentos.length} fragmentos cargados</small>
      </header>
      <section className="chat">
        {mensajes.map((m, i) => (
          <p key={i} className={m.role}>{m.content}</p>
        ))}
        {cargando && <p className="assistant">…</p>}
        {error && <p className="error">{error}</p>}
      </section>
      <form onSubmit={enviar}>
        <input value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder={listo ? "Haz una pregunta" : "Pon la clave y carga un .txt o .md"} disabled={!listo} />
        <button disabled={!listo || cargando}>Enviar</button>
      </form>
    </main>
  );
}
