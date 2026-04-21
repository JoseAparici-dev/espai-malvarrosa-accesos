import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function PanelAdmin({ onVolver }) {
    const [seccion, setSeccion] = useState('personas')
    const [personas, setPersonas] = useState([])
    const [organizaciones, setOrganizaciones] = useState([])
    const [operadores, setOperadores] = useState([])
    const [loading, setLoading] = useState(false)
    const [miId, setMiId] = useState(null)
    const [mostrarNuevoOperador, setMostrarNuevoOperador] = useState(false)
    const [nuevoNombre, setNuevoNombre] = useState('')
    const [nuevoEmail, setNuevoEmail] = useState('')
    const [nuevoPassword, setNuevoPassword] = useState('')
    const [nuevoRol, setNuevoRol] = useState('operador')
    const [errorOperador, setErrorOperador] = useState('')
    const [loadingOperador, setLoadingOperador] = useState(false)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setMiId(user.id))
        if (seccion === 'personas') cargarPersonas()
        if (seccion === 'organizaciones') cargarOrganizaciones()
        if (seccion === 'operadores') cargarOperadores()
    }, [seccion])

    async function cargarPersonas() {
        setLoading(true)
        const { data } = await supabase
            .from('personas_con_estado')
            .select('*')
            .order('nombre')
        setPersonas(data ?? [])
        setLoading(false)
    }

    async function cargarOrganizaciones() {
        setLoading(true)
        const { data } = await supabase
            .from('organizaciones')
            .select('*')
            .order('nombre')
        setOrganizaciones(data ?? [])
        setLoading(false)
    }

    async function cargarOperadores() {
        setLoading(true)
        const { data } = await supabase
            .from('operadores')
            .select('*')
            .order('nombre')
        setOperadores(data ?? [])
        setLoading(false)
    }

    async function toggleActivo(tabla, id, activo) {
        await supabase.from(tabla).update({ activo: !activo }).eq('id', id)
        if (tabla === 'personas') cargarPersonas()
        if (tabla === 'organizaciones') cargarOrganizaciones()
        if (tabla === 'operadores') cargarOperadores()
    }

    async function crearOperador() {
        setErrorOperador('')
        if (!nuevoNombre.trim()) return setErrorOperador('El nombre es obligatorio')
        if (!nuevoEmail.trim()) return setErrorOperador('El email es obligatorio')
        if (!nuevoPassword.trim() || nuevoPassword.length < 6) return setErrorOperador('La contraseña debe tener al menos 6 caracteres')

        setLoadingOperador(true)
        const { error } = await supabase.rpc('crear_operador', {
            p_email: nuevoEmail.trim(),
            p_nombre: nuevoNombre.trim(),
            p_password: nuevoPassword,
            p_rol: nuevoRol
        })

        if (error) {
            setErrorOperador('Error al crear el operador: ' + error.message)
        } else {
            setMostrarNuevoOperador(false)
            setNuevoNombre('')
            setNuevoEmail('')
            setNuevoPassword('')
            setNuevoRol('operador')
            cargarOperadores()
        }
        setLoadingOperador(false)
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button style={styles.btnVolver} onClick={onVolver}>← Volver</button>
                <h1 style={styles.titulo}>Panel de administración</h1>
            </div>

            <div style={styles.tabs}>
                <button style={{ ...styles.tab, ...(seccion === 'personas' ? styles.tabActivo : {}) }} onClick={() => setSeccion('personas')}>Personas</button>
                <button style={{ ...styles.tab, ...(seccion === 'organizaciones' ? styles.tabActivo : {}) }} onClick={() => setSeccion('organizaciones')}>Organizaciones</button>
                <button style={{ ...styles.tab, ...(seccion === 'operadores' ? styles.tabActivo : {}) }} onClick={() => setSeccion('operadores')}>Operadores</button>
            </div>

            {loading && <p style={styles.info}>Cargando...</p>}

            {!loading && seccion === 'personas' && (
                <div style={styles.lista}>
                    {personas.map(p => (
                        <div key={p.id} style={{ ...styles.card, opacity: p.activo ? 1 : 0.5 }}>
                            <div style={styles.cardInfo}>
                                <span style={styles.nombre}>{p.nombre}</span>
                                <span style={styles.detalle}>{p.organizacion} · {p.carnet_upv ? 'UPV' : p.dni}</span>
                            </div>
                            <button
                                style={{ ...styles.btnToggle, backgroundColor: p.activo ? '#fee2e2' : '#d1fae5', color: p.activo ? '#991b1b' : '#065f46' }}
                                onClick={() => toggleActivo('personas', p.id, p.activo)}
                            >
                                {p.activo ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!loading && seccion === 'organizaciones' && (
                <div style={styles.lista}>
                    {organizaciones.map(o => (
                        <div key={o.id} style={{ ...styles.card, opacity: o.activo ? 1 : 0.5 }}>
                            <span style={styles.nombre}>{o.nombre}</span>
                            <button
                                style={{ ...styles.btnToggle, backgroundColor: o.activo ? '#fee2e2' : '#d1fae5', color: o.activo ? '#991b1b' : '#065f46' }}
                                onClick={() => toggleActivo('organizaciones', o.id, o.activo)}
                            >
                                {o.activo ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!loading && seccion === 'operadores' && (
                <div style={styles.lista}>
                    <div style={{ marginBottom: '1rem' }}>
                        <button style={styles.btnNuevo} onClick={() => setMostrarNuevoOperador(!mostrarNuevoOperador)}>
                            + Nuevo operador
                        </button>
                    </div>

                    {mostrarNuevoOperador && (
                        <div style={styles.formulario}>
                            <h3 style={{ margin: '0 0 1rem', color: '#111' }}>Nuevo operador</h3>
                            <label style={styles.label}>Nombre *</label>
                            <input style={styles.input} value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre completo" />
                            <label style={styles.label}>Email *</label>
                            <input style={styles.input} type="email" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)} placeholder="email@ejemplo.com" />
                            <label style={styles.label}>Contraseña *</label>
                            <input style={styles.input} type="password" value={nuevoPassword} onChange={e => setNuevoPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                            <label style={styles.label}>Rol</label>
                            <select style={styles.input} value={nuevoRol} onChange={e => setNuevoRol(e.target.value)}>
                                <option value="operador">Operador</option>
                                <option value="admin">Admin</option>
                            </select>
                            {errorOperador && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errorOperador}</p>}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button style={styles.btnCancelar} onClick={() => setMostrarNuevoOperador(false)}>Cancelar</button>
                                <button style={styles.btnGuardar} onClick={crearOperador} disabled={loadingOperador}>
                                    {loadingOperador ? 'Creando...' : 'Crear operador'}
                                </button>
                            </div>
                        </div>
                    )}
                    {operadores.map(o => (
                        <div key={o.id} style={{ ...styles.card, opacity: o.activo ? 1 : 0.5 }}>
                            <div style={styles.cardInfo}>
                                <span style={styles.nombre}>{o.nombre}</span>
                                <span style={styles.detalle}>{o.email} · {o.rol}</span>
                            </div>
                            <button
                                style={{ ...styles.btnToggle, backgroundColor: o.activo ? '#fee2e2' : '#d1fae5', color: o.activo ? '#991b1b' : '#065f46' }}
                                onClick={() => toggleActivo('operadores', o.id, o.activo)}
                                disabled={o.id === miId}
                            >
                                {o.activo ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const styles = {
    container: { maxWidth: '700px', margin: '0 auto', padding: '1rem' },
    header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
    titulo: { fontSize: '1.25rem', fontWeight: 'bold', margin: 0, color: '#111' },
    btnVolver: { padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
    tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' },
    tab: { flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111', fontWeight: '600' },
    tabActivo: { backgroundColor: '#2563eb', color: 'white', border: '1px solid #2563eb' },
    info: { textAlign: 'center', color: '#666' },
    lista: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
    card: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    cardInfo: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
    nombre: { fontWeight: 'bold', fontSize: '1rem', color: '#111' },
    detalle: { fontSize: '0.875rem', color: '#666' },
    btnToggle: { padding: '0.5rem 1rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.875rem' },
    btnNuevo: { padding: '0.5rem 1rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    formulario: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem' },
    label: { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' },
    input: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', boxSizing: 'border-box', marginBottom: '1rem' },
    btnCancelar: { flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111' },
    btnGuardar: { flex: 1, padding: '0.75rem', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
}