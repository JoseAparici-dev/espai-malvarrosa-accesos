import Historial from './Historial'
import RegistroDiario from './RegistroDiario'
import CambiarPassword from './CambiarPassword'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import ContactoAdmin from './ContactoAdmin'

export default function VisualizadorAccesos({ onCerrarSesion }) {
  const [vista, setVista] = useState('inicio')
  const [mostrarContacto, setMostrarContacto] = useState(false)
  const [miEmail, setMiEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setMiEmail(user.email))
  }, [])

  if (vista === 'historial') return <Historial onVolver={() => setVista('inicio')} rol="visualizador" miId={null} />
  if (vista === 'registro') return <RegistroDiario onVolver={() => setVista('inicio')} rol="visualizador" miId={null} />
  if (vista === 'password') return <CambiarPassword onVolver={() => setVista('inicio')} />

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Espai Malvarrosa</h1>
          <p style={styles.subtitulo}>Control d'accessos — Consulta</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button style={styles.btnIcono} onClick={() => window.open('https://bxvfheldvxgmcuhfbncq.supabase.co/storage/v1/object/public/Documentos/APP-manual_espai_malvarrosa.pdf', '_blank')} title="Manual d'ús">📖</button>
          <button style={styles.btnIcono} onClick={() => setVista('password')} title="Cambiar contraseña">🔑</button>
          <button style={styles.btnIcono} onClick={onCerrarSesion} title="Salir">🚪</button>
        </div>
      </div>

      <div style={styles.opciones}>
        <button style={styles.btnOpcion} onClick={() => setVista('registro')}>
          <span style={styles.btnIconoGrande}>📋</span>
          <span style={styles.btnTexto}>Registro diario</span>
        </button>
        <button style={styles.btnOpcion} onClick={() => setVista('historial')}>
          <span style={styles.btnIconoGrande}>📅</span>
          <span style={styles.btnTexto}>Historial</span>
        </button>
      </div>
      <div style={styles.footer}>
        <button style={styles.btnContacto} onClick={() => setMostrarContacto(true)}>
          ✉️ Contactar con el administrador
        </button>
      </div>
      {
        mostrarContacto && (
          <ContactoAdmin onCerrar={() => setMostrarContacto(false)} emailUsuario={miEmail} />
        )
      }
    </div>
  )
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '1rem' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
  titulo: { fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.25rem', color: 'white' },
  subtitulo: { fontSize: '0.875rem', color: '#666', margin: 0 },
  btnIcono: { padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '1.1rem' },
  opciones: { display: 'flex', gap: '1rem', marginTop: '2rem' },
  btnOpcion: { flex: 1, padding: '2rem 1rem', backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  btnIconoGrande: { fontSize: '2.5rem' },
  btnTexto: { fontSize: '1rem', fontWeight: 'bold', color: '#111' },
  footer: { textAlign: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' },
  btnContacto: { background: 'none', border: 'none', color: '#9ca3af', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' },
}