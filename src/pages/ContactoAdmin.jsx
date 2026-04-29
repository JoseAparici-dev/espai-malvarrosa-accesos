import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import emailjs from '@emailjs/browser'

const MOTIVOS = [
  { id: 'problema_tecnico', label: '🔧 Problema técnico' },
  { id: 'alta_organizacion', label: '🏢 Alta de organización' },
  { id: 'ajuste_usuario', label: '👤 Ajuste de usuario' },
  { id: 'ajuste_persona', label: '📋 Ajuste de persona/registro' },
  { id: 'otro', label: '💬 Otro' },
]

export default function ContactoAdmin({ onCerrar, emailUsuario }) {
  const [paso, setPaso] = useState('motivo') // 'motivo' | 'formulario' | 'ok' | 'error'
  const [motivoSeleccionado, setMotivoSeleccionado] = useState(null)
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailAdmin, setEmailAdmin] = useState('')

  useEffect(() => {
    supabase
      .from('operadores')
      .select('email')
      .eq('rol', 'admin')
      .single()
      .then(({ data }) => setEmailAdmin(data?.email ?? ''))
  }, [])

  async function enviar() {
    if (!descripcion.trim()) return
    setLoading(true)
    try {
      await emailjs.send(
        'service_fb17m6h',
        'template_w3cb8ed',
        {
          asunto: motivoSeleccionado.label,
          motivo: motivoSeleccionado.label,
          email_usuario: emailUsuario,
          descripcion: descripcion.trim(),
          email_admin: emailAdmin,
          name: emailUsuario,
          email: emailUsuario,
        },
        'm98dfdvqAwnQbkYBO'
      )
      setPaso('ok')
    } catch {
      setPaso('error')
    }
    setLoading(false)
  }

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onCerrar() }}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.titulo}>Contactar con el administrador</h2>
          <button style={styles.btnCerrar} onClick={onCerrar}>✕</button>
        </div>

        {paso === 'motivo' && (
          <>
            <p style={styles.subtitulo}>¿Cuál es el motivo de tu consulta?</p>
            <div style={styles.motivos}>
              {MOTIVOS.map(m => (
                <button
                  key={m.id}
                  style={styles.btnMotivo}
                  onClick={() => { setMotivoSeleccionado(m); setPaso('formulario') }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </>
        )}

        {paso === 'formulario' && (
          <>
            <div style={styles.motivoBadge}>{motivoSeleccionado.label}</div>
            <p style={styles.subtitulo}>Describe tu solicitud:</p>
            <textarea
              style={styles.textarea}
              placeholder="Explica con detalle lo que necesitas..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={5}
              autoFocus
            />
            <div style={styles.botones}>
              <button style={styles.btnVolver} onClick={() => setPaso('motivo')}>← Volver</button>
              <button
                style={{ ...styles.btnEnviar, opacity: !descripcion.trim() || loading ? 0.5 : 1 }}
                onClick={enviar}
                disabled={!descripcion.trim() || loading}
              >
                {loading ? 'Enviando...' : '📨 Enviar'}
              </button>
            </div>
          </>
        )}

        {paso === 'ok' && (
          <div style={styles.resultado}>
            <span style={{ fontSize: '2.5rem' }}>✅</span>
            <p style={styles.resultadoTexto}>Solicitud enviada correctamente. El administrador la recibirá en breve.</p>
            <button style={styles.btnEnviar} onClick={onCerrar}>Cerrar</button>
          </div>
        )}

        {paso === 'error' && (
          <div style={styles.resultado}>
            <span style={{ fontSize: '2.5rem' }}>❌</span>
            <p style={styles.resultadoTexto}>Error al enviar. Comprueba tu conexión e inténtalo de nuevo.</p>
            <div style={styles.botones}>
              <button style={styles.btnVolver} onClick={() => setPaso('formulario')}>← Reintentar</button>
              <button style={styles.btnEnviar} onClick={onCerrar}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' },
  modal: { backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  modalHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: '#111' },
  btnCerrar: { background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#666', padding: '0.25rem' },
  subtitulo: { margin: 0, fontSize: '0.9rem', color: '#555' },
  motivos: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  btnMotivo: { padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem', color: '#111', fontWeight: '500' },
  motivoBadge: { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600', width: 'fit-content' },
  textarea: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' },
  botones: { display: 'flex', gap: '0.75rem' },
  btnVolver: { flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
  btnEnviar: { flex: 1, padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  resultado: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0', textAlign: 'center' },
  resultadoTexto: { margin: 0, fontSize: '0.95rem', color: '#374151' },
}