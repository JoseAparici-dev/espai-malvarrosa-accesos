import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import NuevaPersona from './NuevaPersona'

export default function Accesos() {
  const [busqueda, setBusqueda] = useState('')
  const [personas, setPersonas] = useState([])
  const [aforo, setAforo] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mostrarNueva, setMostrarNueva] = useState(false)

  useEffect(() => {
    cargarAforo()
  }, [])

  async function cargarAforo() {
    const { data } = await supabase
      .from('personas_con_estado')
      .select('dentro_ahora')
      .eq('dentro_ahora', true)
    setAforo(data?.length ?? 0)
  }

  async function buscarPersonas(texto) {
    setBusqueda(texto)
    if (texto.length < 2) { setPersonas([]); return }

    setLoading(true)
    const { data } = await supabase
      .from('personas_con_estado')
      .select('*')
      .or(`nombre.ilike.%${texto}%,dni.ilike.%${texto}%`)
      .eq('activo', true)
      .limit(10)

    setPersonas(data ?? [])
    setLoading(false)
  }

  async function registrarAcceso(persona, tipo) {
    const { error } = await supabase
      .from('registros_acceso')
      .insert({ persona_id: persona.id, tipo })

    if (!error) {
      await cargarAforo()
      setPersonas(prev => prev.map(p =>
        p.id === persona.id
          ? { ...p, ultimo_tipo: tipo, dentro_ahora: tipo === 'entrada' }
          : p
      ))
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Espai Malvarrosa</h1>
          <p style={styles.subtitulo}>Control d'accessos</p>
        </div>
      <div style={styles.aforoBox}>
        <span style={styles.aforoNum}>{aforo}</span>
        <span style={styles.aforoLabel}>Dins ara</span>
     </div>
      <button style={styles.btnSalir} onClick={cerrarSesion}>Salir</button>
    </div>

      <div style={styles.buscadorBox}>
        <input
          style={styles.buscador}
          placeholder="Buscar por nombre o DNI..."
          value={busqueda}
          onChange={e => buscarPersonas(e.target.value)}
          autoFocus
        />
      </div>

      {loading && <p style={styles.info}>Buscando...</p>}

      {personas.length === 0 && busqueda.length >= 2 && !loading && (
  <div style={{ textAlign: 'center', padding: '1rem' }}>
    <p style={styles.info}>No se encontró ninguna persona.</p>
    <button style={styles.btnNueva} onClick={() => setMostrarNueva(true)}>+ Nueva persona</button>
  </div>
)}

{mostrarNueva && (
  <NuevaPersona
    nombreInicial={busqueda}
    onGuardado={() => { setMostrarNueva(false); buscarPersonas(busqueda) }}
    onCancelar={() => setMostrarNueva(false)}
  />
)}

      <div style={styles.lista}>
        {personas.map(persona => (
          <div key={persona.id} style={styles.card}>
            <div style={styles.cardInfo}>
              <span style={styles.nombre}>{persona.nombre}</span>
              <span style={styles.org}>{persona.organizacion}</span>
              {persona.carnet_upv && <span style={styles.upv}>UPV</span>}
            </div>
            <div style={styles.cardBotones}>
              <button
                style={{
                  ...styles.btn,
                  backgroundColor: persona.dentro_ahora ? '#d1fae5' : '#2563eb',
                  color: persona.dentro_ahora ? '#065f46' : 'white',
                }}
                onClick={() => registrarAcceso(persona, 'entrada')}
                disabled={persona.dentro_ahora}
              >
                Entrada
              </button>
              <button
                style={{
                  ...styles.btn,
                  backgroundColor: !persona.dentro_ahora ? '#fee2e2' : '#dc2626',
                  color: !persona.dentro_ahora ? '#991b1b' : 'white',
                }}
                onClick={() => registrarAcceso(persona, 'salida')}
                disabled={!persona.dentro_ahora}
              >
                Salida
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '600px', margin: '0 auto', padding: '1rem' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' },
  titulo: { fontSize: '1.25rem', fontWeight: 'bold', margin: 0 },
  subtitulo: { fontSize: '0.875rem', color: '#666', margin: 0 },
  aforoBox: { textAlign: 'center', minWidth: '60px' },
  aforoNum: { display: 'block', fontSize: '2rem', fontWeight: 'bold', color: '#2563eb' },
  aforoLabel: { fontSize: '0.75rem', color: '#666' },
  btnSalir: { padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
  buscadorBox: { marginBottom: '1rem' },
  buscador: { width: '100%', padding: '0.875rem', fontSize: '1rem', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' },
  info: { textAlign: 'center', color: '#666', padding: '1rem' },
  lista: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  cardInfo: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  nombre: { fontWeight: 'bold', fontSize: '1rem' },
  org: { fontSize: '0.875rem', color: '#666' },
  upv: { fontSize: '0.75rem', backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '0.125rem 0.5rem', borderRadius: '99px', width: 'fit-content' },
  cardBotones: { display: 'flex', gap: '0.5rem' },
  btn: { padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem' },
  btnNueva: { padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
}