import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function NuevaPersona({ onGuardado, onCancelar, nombreInicial = '' }) {
  const [nombre, setNombre] = useState(nombreInicial)
  const [dni, setDni] = useState('')
  const [carnetUpv, setCarnetUpv] = useState(false)
  const [organizaciones, setOrganizaciones] = useState([])
  const [orgId, setOrgId] = useState('')
  const [nuevaOrg, setNuevaOrg] = useState('')
  const [modoNuevaOrg, setModoNuevaOrg] = useState(false)
  const [sugerencias, setSugerencias] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function buscarSugerencias(texto) {
    if (texto.length < 2) { setSugerencias([]); return }
    const { data } = await supabase
      .from('personas_con_estado')
      .select('id, nombre, organizacion, carnet_upv')
      .ilike('nombre', `%${texto}%`)
      .eq('activo', true)
      .limit(6)
    setSugerencias(data ?? [])
  }
  useEffect(() => {
    supabase.from('organizaciones').select('id, nombre, tipo').eq('activo', true).order('nombre')
      .then(({ data }) => setOrganizaciones(data ?? []))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrgId('')
    setModoNuevaOrg(false)
  }, [carnetUpv])

  function normalizar(texto) {
    return texto
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(' ')
      .filter(Boolean)
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ')
  }

  async function handleGuardar() {
    setError('')
    if (!nombre.trim()) return setError('El nombre es obligatorio')
    if (!nombre.includes(',')) return setError('Introduce el nombre como "Apellidos, Nombre"')
    if (!carnetUpv && !dni.trim()) return setError('El DNI es obligatorio si no tiene carnet UPV')
    if (!orgId && !nuevaOrg.trim()) return setError('La organización es obligatoria')

    setLoading(true)

    let organizacion_id = orgId

    if (modoNuevaOrg && nuevaOrg.trim()) {
      const { data, error } = await supabase
        .from('organizaciones')
        .insert({ nombre: normalizar(nuevaOrg) })
        .select('id')
        .single()
      if (error) { setError('Error al crear la organización: ' + error.message); setLoading(false); return }
      organizacion_id = data.id
    }

    const { error: errPersona } = await supabase.from('personas').insert({
      nombre: normalizar(nombre),
      dni: carnetUpv ? null : dni.trim().toUpperCase(),
      carnet_upv: carnetUpv,
      organizacion_id,
    })

    if (errPersona) {
      setError(errPersona.message.includes('unique') ? 'Ya existe una persona con ese DNI' : 'Error al guardar')
    } else {
      onGuardado()
    }
    setLoading(false)
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.titulo}>Nueva persona</h2>

        <label style={styles.label}>Apellidos, Nombre *</label>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            style={{ ...styles.input, margin: 0 }}
            value={nombre}
            onChange={e => { setNombre(e.target.value); buscarSugerencias(e.target.value); setMostrarSugerencias(true) }}
            placeholder="Apellidos, Nombre"
            autoFocus
            onFocus={e => { e.target.setSelectionRange(e.target.value.length, e.target.value.length); setMostrarSugerencias(true) }}
            onBlur={() => setTimeout(() => setMostrarSugerencias(false), 150)}
          />
          {mostrarSugerencias && sugerencias.length > 0 && (
            <div style={styles.sugerencias}>
              {sugerencias.map(p => (
                <div
                  key={p.id}
                  style={styles.sugerenciaItem}
                  onMouseDown={() => {
                    setNombre(p.nombre)
                    setSugerencias([])
                    setMostrarSugerencias(false)
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{p.nombre}</span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}> — {p.organizacion}{p.carnet_upv ? ' · UPV' : ''}</span>
                </div>
              ))}
              <div style={styles.sugerenciaAviso}>
                ☝️ Si ya existe, búscala desde la pantalla principal
              </div>
            </div>
          )}
        </div>
        <label style={styles.label}>¿Tiene carnet UPV?</label>
        <div style={styles.toggle}>
          <button style={{ ...styles.toggleBtn, ...(carnetUpv ? styles.toggleActivo : {}) }} onClick={() => setCarnetUpv(true)}>Sí</button>
          <button style={{ ...styles.toggleBtn, ...(!carnetUpv ? styles.toggleActivo : {}) }} onClick={() => setCarnetUpv(false)}>No</button>
        </div>

        {!carnetUpv && (
          <>
            <label style={styles.label}>DNI / NIE *</label>
            <input style={styles.input} value={dni} onChange={e => setDni(e.target.value)} placeholder="12345678A o X1234567A" />
          </>
        )}

        <label style={styles.label}>Organización *</label>
        {!modoNuevaOrg ? (
          < select style={styles.input} value={orgId} onChange={e => {
            if (e.target.value === '__nueva__') { setModoNuevaOrg(true); setOrgId('') }
            else setOrgId(e.target.value)
          }}>
            <option value="">Selecciona...</option>
            {organizaciones
              .filter(o => carnetUpv ? o.tipo === 'upv' : o.tipo === 'externa')
              .sort((a, b) => a.nombre.localeCompare(b.nombre))
              .map(o => (
                <option key={o.id} value={o.id}>
                  {carnetUpv ? '🏛️ ' : '🏢 '}{o.nombre}
                </option>
              ))
            }
            {!carnetUpv && <option value="__nueva__">+ Nueva organización</option>}
          </select>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input style={{ ...styles.input, margin: 0, flex: 1 }} value={nuevaOrg} onChange={e => setNuevaOrg(e.target.value)} placeholder="Nombre de la organización" />
            <button style={styles.btnCancelarOrg} onClick={() => { setModoNuevaOrg(false) }}>✕</button>
          </div>
        )}

        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.botones}>
          <button style={styles.btnCancelar} onClick={onCancelar}>Cancelar</button>
          <button style={styles.btnGuardar} onClick={handleGuardar} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div >
  )
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' },
  modal: { backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '400px' },
  titulo: { margin: '0 0 1.25rem', fontSize: '1.25rem', fontWeight: 'bold' },
  label: { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '1rem' },
  toggle: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  toggleBtn: { flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', color: '#111' },
  toggleActivo: { backgroundColor: '#2563eb', color: 'white', border: '1px solid #2563eb' },
  error: { color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem' },
  botones: { display: 'flex', gap: '0.75rem', marginTop: '0.5rem' },
  btnCancelar: { flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
  btnGuardar: { flex: 1, padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  btnCancelarOrg: { padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
  sugerencias: { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 200, overflow: 'hidden' },
  sugerenciaItem: { padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' },
  sugerenciaAviso: { padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#999', backgroundColor: '#f9f9f9' },
}