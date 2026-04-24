import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Historial({ onVolver, rol, miId }) {
  const hoy = new Date().toISOString().split('T')[0]
  const [fechaDesde, setFechaDesde] = useState(hoy)
  const [fechaHasta, setFechaHasta] = useState(hoy)
  const [filtroPersoa, setFiltroPersona] = useState('')
  const [filtroOrg, setFiltroOrg] = useState('')
  const [organizaciones, setOrganizaciones] = useState([])
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('entrada')

  useEffect(() => {
    supabase.from('organizaciones').select('id, nombre').eq('activo', true).order('nombre')
      .then(({ data }) => setOrganizaciones(data ?? []))
  }, [])

  async function buscar() {
    setLoading(true)
    setBuscado(true)

    let query = supabase
      .from('registros_acceso')
      .select(`
            timestamp,
            tipo,
            personas (
                nombre,
                dni,
                carnet_upv,
                organizaciones ( nombre )
            )
        `)
      .in('tipo', filtroTipo === 'ambos' ? ['entrada', 'salida'] : [filtroTipo])
      .gte('timestamp', `${fechaDesde}T00:00:00`)
      .lte('timestamp', `${fechaHasta}T23:59:59`)

    if (rol === 'operador' && miId) {
      query = query.eq('operador_id', miId)
    }

    query = query.order('timestamp', { ascending: false })

    const { data } = await query
    let resultado = data ?? []

    if (filtroPersoa.trim().length > 0) {
      resultado = resultado.filter(r =>
        r.personas.nombre.toLowerCase().includes(filtroPersoa.toLowerCase())
      )
    }

    if (filtroOrg) {
      resultado = resultado.filter(r =>
        r.personas.organizaciones?.nombre === filtroOrg
      )
    }

    setRegistros(resultado)
    setLoading(false)
  }

  function formatearFecha(timestamp) {
    return new Date(timestamp).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  function formatearHora(timestamp) {
    return new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  function generarPDF() {
    const doc = new jsPDF()

    const titulo = filtroTipo === 'entrada' ? 'Historial de entradas' :
      filtroTipo === 'salida' ? 'Historial de salidas' :
        'Historial de entradas y salidas'

    doc.setFontSize(14)
    doc.text('Espai Malvarrosa (Mañanas)', 14, 15)
    doc.setFontSize(11)
    doc.text(titulo, 14, 23)
    doc.text(`${fechaDesde} — ${fechaHasta}`, 14, 30)

    const columnas = filtroTipo === 'ambos'
      ? ['Fecha', 'Hora', 'Tipo', 'Nombre y Apellidos', 'Organización']
      : ['Fecha', 'Hora', 'DNI / UPV', 'Nombre y Apellidos', 'Organización']

    const filas = registros.map(r => [
      formatearFecha(r.timestamp),
      formatearHora(r.timestamp),
      filtroTipo === 'ambos'
        ? r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1)
        : (r.personas.carnet_upv ? 'UPV' : r.personas.dni),
      r.personas.nombre,
      r.personas.organizaciones?.nombre ?? ''
    ])

    autoTable(doc, {
      head: [columnas],
      body: filas,
      startY: 36,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] }
    })

    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.btnVolver} onClick={onVolver}>← Volver</button>
        <h1 style={styles.titulo}>Historial de entradas</h1>
      </div>

      <div style={styles.filtros}>
        <div style={styles.filtroGrupo}>
          <label style={styles.label}>Desde</label>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.filtroGrupo}>
          <label style={styles.label}>Hasta</label>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.filtroGrupo}>
          <label style={styles.label}>Persona</label>
          <input
            type="text"
            value={filtroPersoa}
            onChange={e => setFiltroPersona(e.target.value)}
            placeholder="Nombre o apellidos..."
            style={styles.input}
          />
        </div>
        <div style={styles.filtroGrupo}>
          <label style={styles.label}>Organización</label>
          <select value={filtroOrg} onChange={e => setFiltroOrg(e.target.value)} style={styles.input}>
            <option value="">Todas</option>
            {organizaciones.map(o => <option key={o.id} value={o.nombre}>{o.nombre}</option>)}
          </select>
        </div>
        <div style={styles.filtroGrupo}>
          <label style={styles.label}>Tipo</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={{ ...styles.btnTipo, ...(filtroTipo === 'entrada' ? styles.btnTipoActivo : {}) }} onClick={() => setFiltroTipo('entrada')}>Entradas</button>
            <button style={{ ...styles.btnTipo, ...(filtroTipo === 'salida' ? styles.btnTipoActivo : {}) }} onClick={() => setFiltroTipo('salida')}>Salidas</button>
            <button style={{ ...styles.btnTipo, ...(filtroTipo === 'ambos' ? styles.btnTipoActivo : {}) }} onClick={() => setFiltroTipo('ambos')}>Ambos</button>
          </div>
        </div>
        <button style={styles.btnBuscar} onClick={buscar}>Buscar</button>
      </div>

      {loading && <p style={styles.info}>Cargando...</p>}

      {buscado && registros.length > 0 && (
        <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
          <button style={styles.btnPDF} onClick={generarPDF}>⬇️ Descargar PDF</button>
        </div>
      )}
      {!loading && buscado && (
        <div style={styles.documento}>
          <table style={styles.tabla}>
            <thead>
              <tr>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Hora</th>
                <th style={styles.th}>{filtroTipo === 'ambos' ? 'Tipo' : 'DNI / UPV'}</th>
                <th style={styles.th}>Nombre y Apellidos</th>
                <th style={styles.th}>Organización</th>
              </tr>
            </thead>
            <tbody>
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>
                    No hay entradas para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                registros.map((r, i) => (
                  <tr key={i} style={i % 2 === 0 ? {} : { backgroundColor: '#f9f9f9' }}>
                    <td style={styles.td}>{formatearFecha(r.timestamp)}</td>
                    <td style={styles.td}>{formatearHora(r.timestamp)}</td>
                    <td style={styles.td}>{filtroTipo === 'ambos' ? r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1) : (r.personas.carnet_upv ? 'UPV' : r.personas.dni)}</td>
                    <td style={styles.td}>{r.personas.nombre}</td>
                    <td style={styles.td}>{r.personas.organizaciones?.nombre}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {registros.length > 0 && (
            <p style={styles.total}>Total entradas: <strong>{registros.length}</strong></p>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto', padding: '1rem' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '0.5rem', flexWrap: 'wrap' },
  titulo: { fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#111' },
  btnVolver: { padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
  filtros: { display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end', backgroundColor: 'white', padding: '1.25rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1.5rem' },
  filtroGrupo: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1', minWidth: '150px' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#374151' },
  input: { padding: '0.625rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' },
  btnBuscar: { padding: '0.625rem 1.5rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-end' },
  info: { textAlign: 'center', color: '#666' },
  documento: { backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }, btnTipo: { padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111', fontSize: '0.8rem' },
  btnTipoActivo: { backgroundColor: '#2563eb', color: 'white', border: '1px solid #2563eb', fontWeight: 'bold' },
  btnPDF: { padding: '0.5rem 1rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem' },
}