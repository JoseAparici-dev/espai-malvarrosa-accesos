import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function RegistroDiario({ onVolver }) {
    const hoy = new Date().toISOString().split('T')[0]
    const [fecha, setFecha] = useState(hoy)
    const [registros, setRegistros] = useState([])
    const [loading, setLoading] = useState(false)
    const [filtroTipo, setFiltroTipo] = useState('entrada')

    async function cargarRegistros() {
        setLoading(true)
        const desde = `${fecha}T00:00:00`
        const hasta = `${fecha}T23:59:59`
        const { data } = await supabase
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
            .gte('timestamp', desde)
            .lte('timestamp', hasta)
            .in('tipo', filtroTipo === 'ambos' ? ['entrada', 'salida'] : [filtroTipo])
            .order('timestamp', { ascending: true })

        setRegistros(data ?? [])
        setLoading(false)
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargarRegistros()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fecha, filtroTipo])

    function formatearHora(timestamp) {
        return new Date(timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }

    function formatearFecha(fechaStr) {
        return new Date(fechaStr + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }

    function generarPDF() {
        const doc = new jsPDF()

        const titulo = filtroTipo === 'entrada' ? 'Registro de entradas' :
            filtroTipo === 'salida' ? 'Registro de salidas' :
                'Registro de entradas y salidas'

        doc.setFontSize(14)
        doc.text(`Espai Malvarrosa (Mañanas)`, 14, 15)
        doc.setFontSize(11)
        doc.text(titulo, 14, 23)
        doc.text(formatearFecha(fecha), 14, 30)

        const columnas = filtroTipo === 'ambos'
            ? ['Hora', 'Tipo', 'Nombre y Apellidos', 'Organización']
            : ['Hora', 'DNI / UPV', 'Nombre y Apellidos', 'Organización']

        const filas = registros.map(r => [
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
                <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    style={styles.inputFecha}
                />
            </div>

            <div style={styles.documento}>
                <h2 style={styles.titulo}>Registro de entrada de personas en Espai Malvarrosa (Mañanas)</h2>
                <p style={styles.fechaDoc}>{formatearFecha(fecha)}</p>
                <button style={styles.btnPDF} onClick={generarPDF} disabled={registros.length === 0}>
                    ⬇️ Descargar PDF
                </button>
                <div style={styles.filtroTipoBox}>
                    <button style={{ ...styles.btnTipo, ...(filtroTipo === 'entrada' ? styles.btnTipoActivo : {}) }} onClick={() => setFiltroTipo('entrada')}>Solo entradas</button>
                    <button style={{ ...styles.btnTipo, ...(filtroTipo === 'salida' ? styles.btnTipoActivo : {}) }} onClick={() => setFiltroTipo('salida')}>Solo salidas</button>
                    <button style={{ ...styles.btnTipo, ...(filtroTipo === 'ambos' ? styles.btnTipoActivo : {}) }} onClick={() => setFiltroTipo('ambos')}>Ambos</button>
                </div>
                {loading && <p style={styles.info}>Cargando...</p>}

                {!loading && (
                    <table style={styles.tabla}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Hora</th>
                                <th style={styles.th}>{filtroTipo === 'ambos' ? 'Tipo' : 'DNI / UPV'}</th>
                                <th style={styles.th}>Nombre y Apellidos</th>
                                <th style={styles.th}>Empresa o Entidad Organizativa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registros.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ ...styles.td, textAlign: 'center', color: '#999' }}>
                                        No hay entradas registradas para este día
                                    </td>
                                </tr>
                            ) : (
                                registros.map((r, i) => (
                                    <tr key={i} style={i % 2 === 0 ? {} : { backgroundColor: '#f9f9f9' }}>
                                        <td style={styles.td}>{formatearHora(r.timestamp)}</td>
                                        <td style={styles.td}>{filtroTipo === 'ambos' ? r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1) : (r.personas.carnet_upv ? 'UPV' : r.personas.dni)}</td>
                                        <td style={styles.td}>{r.personas.nombre}</td>
                                        <td style={styles.td}>{r.personas.organizaciones?.nombre}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}

                {!loading && registros.length > 0 && (
                    <p style={styles.total}>Total entradas: <strong>{registros.length}</strong></p>
                )}
            </div>
        </div>
    )
}

const styles = {
    container: { maxWidth: '900px', margin: '0 auto', padding: '1rem' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
    btnVolver: { padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
    inputFecha: { padding: '0.5rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' },
    documento: { backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
    titulo: { textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#111' },
    fechaDoc: { textAlign: 'center', color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' },
    info: { textAlign: 'center', color: '#666' },
    tabla: { width: '100%', borderCollapse: 'collapse' },
    th: { border: '1px solid #ccc', padding: '0.6rem 0.75rem', backgroundColor: '#f0f4f8', textAlign: 'left', fontSize: '0.875rem', fontWeight: 'bold' },
    td: { border: '1px solid #ccc', padding: '0.6rem 0.75rem', fontSize: '0.875rem' },
    total: { marginTop: '1rem', textAlign: 'right', fontSize: '0.9rem', color: '#444' },
    filtroTipoBox: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
    btnTipo: { flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111', fontSize: '0.875rem' },
    btnTipoActivo: { backgroundColor: '#2563eb', color: 'white', border: '1px solid #2563eb', fontWeight: 'bold' },
    btnPDF: { padding: '0.5rem 1rem', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem' },
}