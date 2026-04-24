import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import NuevaPersona from './NuevaPersona'
import RegistroDiario from './RegistroDiario'
import PanelAdmin from './PanelAdmin'
import Historial from './Historial'
import VisualizadorAccesos from './VisualizadorAccesos'
import CambiarPassword from './CambiarPassword'

export default function Accesos() {
  const [busqueda, setBusqueda] = useState('')
  const [personas, setPersonas] = useState([])
  const [aforo, setAforo] = useState(0)
  const [aforoMaximo, setAforoMaximo] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [mostrarRegistro, setMostrarRegistro] = useState(false)
  const [esAdmin, setEsAdmin] = useState(false)
  const [rol, setRol] = useState('')
  const [mostrarAdmin, setMostrarAdmin] = useState(false)
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [personasDentro, setPersonasDentro] = useState([])
  const [mostrarPassword, setMostrarPassword] = useState(false)

  useEffect(() => {
    cargarAforo()
    cargarPersonasDentro()
    supabase.from('configuracion').select('aforo_maximo').eq('id', 1).single()
      .then(({ data }) => {
        setAforoMaximo(data?.aforo_maximo ?? 0)
      })
    supabase.auth.getUser().then(({ data: { user } }) => {
      supabase
        .from('operadores')
        .select('rol')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setEsAdmin(data?.rol === 'admin')
          setRol(data?.rol ?? '')
        })
    })
  }, [])

  async function cargarAforo() {
    const { data } = await supabase
      .from('personas_con_estado')
      .select('dentro_ahora')
      .eq('dentro_ahora', true)
    setAforo(data?.length ?? 0)
  }

  async function cargarPersonasDentro() {
    const { data } = await supabase
      .from('personas_con_estado')
      .select('id, nombre, organizacion, carnet_upv, dni')
      .eq('dentro_ahora', true)
      .eq('activo', true)
      .order('nombre', { ascending: true })
    setPersonasDentro(data ?? [])
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
      await cargarPersonasDentro()
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

  if (mostrarPassword) return <CambiarPassword onVolver={() => setMostrarPassword(false)} />
  if (rol === 'visualizador') return <VisualizadorAccesos onCerrarSesion={cerrarSesion} />
  if (mostrarRegistro) return <RegistroDiario onVolver={() => setMostrarRegistro(false)} />
  if (mostrarAdmin) return <PanelAdmin onVolver={() => setMostrarAdmin(false)} />
  if (mostrarHistorial) return <Historial onVolver={() => setMostrarHistorial(false)} />

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Espai Malvarrosa</h1>
          <p style={styles.subtitulo}>Control d'accessos</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={styles.aforoBox}>
            <span style={styles.aforoNum}>{aforo}</span>
            <span style={styles.aforoLabel}>Dins ara</span>
          </div>
          <button style={styles.btnIcono} onClick={() => setMostrarHistorial(true)} title="Historial">📅</button>
          <button style={styles.btnIcono} onClick={() => setMostrarRegistro(true)} title="Registro diario">📋</button>
          {esAdmin && (
            <button style={styles.btnIcono} onClick={() => setMostrarAdmin(true)} title="Administración">⚙️</button>
          )}
          <button style={styles.btnIcono} onClick={() => setMostrarPassword(true)} title="Cambiar contraseña">🔑</button>
          <button style={styles.btnIcono} onClick={cerrarSesion} title="Salir">🚪</button>
        </div>
      </div>

      {aforoMaximo > 0 && aforo >= aforoMaximo && (
        <div style={styles.alerta}>
          ⚠️ Aforo máximo alcanzado ({aforo}/{aforoMaximo}) — se pueden seguir registrando entradas
        </div>
      )}

      <div style={styles.buscadorBox}>
        <input
          style={styles.buscador}
          placeholder="Buscar por nombre o DNI..."
          value={busqueda}
          onChange={e => buscarPersonas(e.target.value)}
          autoFocus
        />
      </div>

      {personasDentro.length > 0 && (
        <div style={styles.cuadroDins}>
          <div style={styles.cuadroDinsHeader}>
            <span style={styles.cuadroDinsTitulo}>👥 Dins ara — {personasDentro.length}</span>
          </div>
          <div style={styles.dinsList}>
            {personasDentro.map(persona => (
              <div key={persona.id} style={styles.dinsCard}>
                <div style={styles.dinsInfo}>
                  <span style={styles.dinsNombre}>{persona.nombre}</span>
                  <span style={styles.dinsOrg}>{persona.organizacion}</span>
                </div>
                <button
                  style={styles.btnSalidaDins}
                  onClick={() => registrarAcceso(persona, 'salida')}
                >
                  Salida
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
  titulo: { fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.25rem', color: 'white' },
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
  btnRegistro: { padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
  btnAdmin: { padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
  btnHistorial: { padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
  btnIcono: { padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '1.1rem' },
  alerta: { backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1rem', color: '#92400e', fontWeight: '600', textAlign: 'center' },
  cuadroDins: { backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1rem', overflow: 'hidden' },
  cuadroDinsHeader: { backgroundColor: '#eff6ff', padding: '0.6rem 1rem', borderBottom: '1px solid #dbeafe' },
  cuadroDinsTitulo: { fontWeight: 'bold', fontSize: '0.9rem', color: '#1d4ed8' },
  dinsList: { display: 'flex', flexDirection: 'column', maxHeight: '240px', overflowY: 'auto' },
  dinsCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid #f3f4f6' },
  dinsInfo: { display: 'flex', flexDirection: 'column', gap: '0.1rem' },
  dinsNombre: { fontSize: '0.9rem', fontWeight: '600', color: '#111' },
  dinsOrg: { fontSize: '0.78rem', color: '#666' },
  btnSalidaDins: { padding: '0.35rem 0.85rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', flexShrink: 0 },
}