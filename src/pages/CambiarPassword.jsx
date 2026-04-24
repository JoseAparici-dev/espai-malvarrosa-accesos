import { useState } from 'react'
import { supabase } from '../supabase'

export default function CambiarPassword({ onVolver }) {
  const [passNueva, setPassNueva] = useState('')
  const [passNueva2, setPassNueva2] = useState('')
  const [errorPass, setErrorPass] = useState('')
  const [okPass, setOkPass] = useState(false)
  const [loadingPass, setLoadingPass] = useState(false)

  async function cambiarPassword() {
    setErrorPass('')
    setOkPass(false)
    if (!passNueva.trim()) return setErrorPass('Introduce la nueva contraseña')
    if (passNueva.length < 6) return setErrorPass('La contraseña debe tener al menos 6 caracteres')
    if (passNueva !== passNueva2) return setErrorPass('Las contraseñas no coinciden')

    setLoadingPass(true)
    const { error } = await supabase.auth.updateUser({ password: passNueva })
    if (error) {
      setErrorPass('Error: ' + error.message)
    } else {
      setOkPass(true)
      setPassNueva('')
      setPassNueva2('')
    }
    setLoadingPass(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.btnVolver} onClick={onVolver}>← Volver</button>
        <h1 style={styles.titulo}>Cambiar contraseña</h1>
      </div>
      <div style={styles.formulario}>
        <label style={styles.label}>Nueva contraseña *</label>
        <input style={styles.input} type="password" value={passNueva} onChange={e => setPassNueva(e.target.value)} placeholder="Mínimo 6 caracteres" />
        <label style={styles.label}>Repetir nueva contraseña *</label>
        <input style={styles.input} type="password" value={passNueva2} onChange={e => setPassNueva2(e.target.value)} placeholder="Repite la contraseña" />
        {errorPass && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errorPass}</p>}
        {okPass && <p style={{ color: '#16a34a', fontSize: '0.875rem' }}>✅ Contraseña cambiada correctamente</p>}
        <button style={styles.btnGuardar} onClick={cambiarPassword} disabled={loadingPass}>
          {loadingPass ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '500px', margin: '0 auto', padding: '1rem' },
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
  titulo: { fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#111' },
  btnVolver: { padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
  formulario: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.5rem', display: 'flex', flexDirection: 'column' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' },
  input: { padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', marginBottom: '1rem' },
  btnGuardar: { padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
}