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
    const [operadorEditando, setOperadorEditando] = useState(null)
    const [editNombre, setEditNombre] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editRol, setEditRol] = useState('operador')
    const [editPassword, setEditPassword] = useState('')
    const [errorEditar, setErrorEditar] = useState('')
    const [loadingEditar, setLoadingEditar] = useState(false)
    const [personaEditando, setPersonaEditando] = useState(null)
    const [editPersonaNombre, setEditPersonaNombre] = useState('')
    const [editPersonaDni, setEditPersonaDni] = useState('')
    const [editPersonaCarnetUpv, setEditPersonaCarnetUpv] = useState(false)
    const [editPersonaOrgId, setEditPersonaOrgId] = useState('')
    const [errorEditarPersona, setErrorEditarPersona] = useState('')
    const [loadingEditarPersona, setLoadingEditarPersona] = useState(false)
    const [orgEditando, setOrgEditando] = useState(null)
    const [editOrgNombre, setEditOrgNombre] = useState('')
    const [errorEditarOrg, setErrorEditarOrg] = useState('')
    const [loadingEditarOrg, setLoadingEditarOrg] = useState(false)
    const [editOrgTipo, setEditOrgTipo] = useState('externa')
    const [config, setConfig] = useState(null)
    const [editAforo, setEditAforo] = useState(0)
    const [editNombreLocal, setEditNombreLocal] = useState('')
    const [loadingConfig, setLoadingConfig] = useState(false)
    const [okConfig, setOkConfig] = useState(false)
    const [mostrarNuevaOrg, setMostrarNuevaOrg] = useState(false)
    const [nuevaOrgNombre, setNuevaOrgNombre] = useState('')
    const [nuevaOrgTipo, setNuevaOrgTipo] = useState('upv')
    const [errorNuevaOrg, setErrorNuevaOrg] = useState('')
    const [loadingNuevaOrg, setLoadingNuevaOrg] = useState(false)

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setMiId(user.id))
        if (seccion === 'personas') cargarPersonas()
        if (seccion === 'organizaciones') cargarOrganizaciones()
        if (seccion === 'operadores') cargarOperadores()
        if (seccion === 'configuracion') cargarConfig()
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


    async function guardarOperador() {
        setErrorEditar('')
        if (!editNombre.trim()) return setErrorEditar('El nombre es obligatorio')
        if (!editEmail.trim()) return setErrorEditar('El email es obligatorio')

        setLoadingEditar(true)
        const { error } = await supabase.rpc('modificar_operador', {
            p_id: operadorEditando.id,
            p_nombre: editNombre.trim(),
            p_email: editEmail.trim(),
            p_rol: editRol,
            p_password: editPassword || null
        })

        if (error) {
            setErrorEditar('Error al modificar: ' + error.message)
        } else {
            setOperadorEditando(null)
            setEditPassword('')
            cargarOperadores()
        }
        setLoadingEditar(false)
    }

    async function eliminarOperador(id) {
        if (!window.confirm('¿Seguro que quieres eliminar este operador?')) return

        const { error } = await supabase.rpc('eliminar_operador', { p_id: id })

        if (error) {
            alert('No se puede eliminar: ' + error.message)
        } else {
            cargarOperadores()
        }
    }

    async function guardarPersona() {
        setErrorEditarPersona('')
        if (!editPersonaNombre.trim()) return setErrorEditarPersona('El nombre es obligatorio')
        if (!editPersonaNombre.includes(',')) return setErrorEditarPersona('Introduce el nombre como "Apellidos, Nombre"')
        if (!editPersonaCarnetUpv && !editPersonaDni.trim()) return setErrorEditarPersona('El DNI es obligatorio si no tiene carnet UPV')
        if (!editPersonaOrgId) return setErrorEditarPersona('La organización es obligatoria')

        setLoadingEditarPersona(true)

        const { error } = await supabase
            .from('personas')
            .update({
                nombre: editPersonaNombre.trim(),
                dni: editPersonaCarnetUpv ? null : editPersonaDni.trim().toUpperCase(),
                carnet_upv: editPersonaCarnetUpv,
                organizacion_id: editPersonaOrgId
            })
            .eq('id', personaEditando.id)

        if (error) {
            setErrorEditarPersona('Error al guardar: ' + error.message)
        } else {
            setPersonaEditando(null)
            cargarPersonas()
        }
        setLoadingEditarPersona(false)
    }

    async function eliminarPersona(id) {
        if (!window.confirm('¿Seguro que quieres eliminar esta persona?')) return

        const { error } = await supabase.rpc('eliminar_persona', { p_id: id })

        if (error) {
            alert('No se puede eliminar: ' + error.message)
        } else {
            cargarPersonas()
        }
    }

    async function guardarOrganizacion() {
        setErrorEditarOrg('')
        if (!editOrgNombre.trim()) return setErrorEditarOrg('El nombre es obligatorio')

        setLoadingEditarOrg(true)
        const { error } = await supabase
            .from('organizaciones')
            .update({ nombre: editOrgNombre.trim(), tipo: editOrgTipo })
            .eq('id', orgEditando.id)

        if (error) {
            setErrorEditarOrg('Error al guardar: ' + error.message)
        } else {
            setOrgEditando(null)
            cargarOrganizaciones()
        }
        setLoadingEditarOrg(false)
    }

    async function eliminarOrganizacion(id) {
        if (!window.confirm('¿Seguro que quieres eliminar esta organización?')) return

        const { error } = await supabase.rpc('eliminar_organizacion', { p_id: id })

        if (error) {
            alert('No se puede eliminar: ' + error.message)
        } else {
            cargarOrganizaciones()
        }
    }

    async function cargarConfig() {
        const { data } = await supabase.from('configuracion').select('*').single()
        setConfig(data)
        setEditAforo(data?.aforo_maximo ?? 0)
        setEditNombreLocal(data?.nombre_local ?? '')
    }

    async function guardarConfig() {
        setLoadingConfig(true)
        setOkConfig(false)
        await supabase.from('configuracion').update({
            aforo_maximo: editAforo,
            nombre_local: editNombreLocal,
            updated_at: new Date().toISOString()
        }).eq('id', 1)
        setOkConfig(true)
        setLoadingConfig(false)
    }

    async function crearOrganizacion() {
        setErrorNuevaOrg('')
        if (!nuevaOrgNombre.trim()) return setErrorNuevaOrg('El nombre es obligatorio')

        setLoadingNuevaOrg(true)
        const { error } = await supabase
            .from('organizaciones')
            .insert({ nombre: nuevaOrgNombre.trim(), tipo: nuevaOrgTipo })

        if (error) {
            setErrorNuevaOrg(error.message.includes('unique') ? 'Ya existe una organización con ese nombre' : 'Error al crear')
        } else {
            setMostrarNuevaOrg(false)
            setNuevaOrgNombre('')
            setNuevaOrgTipo('upv')
            cargarOrganizaciones()
        }
        setLoadingNuevaOrg(false)
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
                <button style={{ ...styles.tab, ...(seccion === 'configuracion' ? styles.tabActivo : {}) }} onClick={() => setSeccion('configuracion')}>⚙️ Config</button>
            </div>

            {loading && <p style={styles.info}>Cargando...</p>}

            {!loading && seccion === 'personas' && (
                <div style={styles.lista}>
                    {personaEditando && (
                        <div style={styles.formulario}>
                            <h3 style={{ margin: '0 0 1rem', color: '#111' }}>Modificar persona</h3>
                            <label style={styles.label}>Nombre (Apellidos, Nombre) *</label>
                            <input style={styles.input} value={editPersonaNombre} onChange={e => setEditPersonaNombre(e.target.value)} />
                            <label style={styles.label}>¿Tiene carnet UPV?</label>
                            <div style={styles.toggle}>
                                <button style={{ ...styles.toggleBtn, ...(editPersonaCarnetUpv ? styles.toggleActivo : {}) }} onClick={() => setEditPersonaCarnetUpv(true)}>Sí</button>
                                <button style={{ ...styles.toggleBtn, ...(!editPersonaCarnetUpv ? styles.toggleActivo : {}) }} onClick={() => setEditPersonaCarnetUpv(false)}>No</button>
                            </div>
                            {!editPersonaCarnetUpv && (
                                <>
                                    <label style={styles.label}>DNI *</label>
                                    <input style={styles.input} value={editPersonaDni} onChange={e => setEditPersonaDni(e.target.value)} />
                                </>
                            )}
                            <label style={styles.label}>Organización *</label>
                            <select style={styles.input} value={editPersonaOrgId} onChange={e => setEditPersonaOrgId(e.target.value)}>
                                {organizaciones.filter(o => o.activo).map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                            </select>
                            {errorEditarPersona && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errorEditarPersona}</p>}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button style={styles.btnCancelar} onClick={() => setPersonaEditando(null)}>Cancelar</button>
                                <button style={styles.btnGuardar} onClick={guardarPersona} disabled={loadingEditarPersona}>
                                    {loadingEditarPersona ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </div>
                        </div>
                    )}

                    {personas.map(p => (
                        <div key={p.id} style={{ ...styles.card, opacity: p.activo ? 1 : 0.5 }}>
                            <div style={styles.cardInfo}>
                                <span style={styles.nombre}>{p.nombre}</span>
                                <span style={styles.detalle}>{p.organizacion} · {p.carnet_upv ? 'UPV' : p.dni}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    style={styles.btnAccion}
                                    onClick={() => {
                                        setPersonaEditando(p)
                                        setEditPersonaNombre(p.nombre)
                                        setEditPersonaDni(p.dni || '')
                                        setEditPersonaCarnetUpv(p.carnet_upv)
                                        setEditPersonaOrgId(p.organizacion_id)
                                        setErrorEditarPersona('')
                                    }}
                                >
                                    Modificar
                                </button>
                                <button
                                    style={{ ...styles.btnToggle, backgroundColor: p.activo ? '#fee2e2' : '#d1fae5', color: p.activo ? '#991b1b' : '#065f46' }}
                                    onClick={() => toggleActivo('personas', p.id, p.activo)}
                                >
                                    {p.activo ? 'Desactivar' : 'Activar'}
                                </button>
                                <button
                                    style={{ ...styles.btnToggle, backgroundColor: '#fee2e2', color: '#991b1b' }}
                                    onClick={() => eliminarPersona(p.id)}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && seccion === 'organizaciones' && (
                <div style={styles.lista}>
                    <div style={{ marginBottom: '1rem' }}>
                        <button style={styles.btnNuevo} onClick={() => setMostrarNuevaOrg(!mostrarNuevaOrg)}>
                            + Nueva organización
                        </button>
                    </div>

                    {mostrarNuevaOrg && (
                        <div style={styles.formulario}>
                            <h3 style={{ margin: '0 0 1rem', color: '#111' }}>Nueva organización</h3>
                            <label style={styles.label}>Nombre *</label>
                            <input style={styles.input} value={nuevaOrgNombre} onChange={e => setNuevaOrgNombre(e.target.value)} placeholder="Nombre de la organización" />
                            <label style={styles.label}>Tipo</label>
                            <select style={styles.input} value={nuevaOrgTipo} onChange={e => setNuevaOrgTipo(e.target.value)}>
                                <option value="upv">🏛️ UPV</option>
                                <option value="externa">🏢 Externa</option>
                            </select>
                            {errorNuevaOrg && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errorNuevaOrg}</p>}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button style={styles.btnCancelar} onClick={() => setMostrarNuevaOrg(false)}>Cancelar</button>
                                <button style={styles.btnGuardar} onClick={crearOrganizacion} disabled={loadingNuevaOrg}>
                                    {loadingNuevaOrg ? 'Creando...' : 'Crear organización'}
                                </button>
                            </div>
                        </div>
                    )}
                    {orgEditando && (
                        <div style={styles.formulario}>
                            <h3 style={{ margin: '0 0 1rem', color: '#111' }}>Modificar organización</h3>
                            <label style={styles.label}>Nombre *</label>
                            <input style={styles.input} value={editOrgNombre} onChange={e => setEditOrgNombre(e.target.value)} />
                            <label style={styles.label}>Tipo</label>
                            <select style={styles.input} value={editOrgTipo} onChange={e => setEditOrgTipo(e.target.value)}>
                                <option value="externa">Externa</option>
                                <option value="upv">UPV</option>
                            </select>
                            {errorEditarOrg && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errorEditarOrg}</p>}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button style={styles.btnCancelar} onClick={() => setOrgEditando(null)}>Cancelar</button>
                                <button style={styles.btnGuardar} onClick={guardarOrganizacion} disabled={loadingEditarOrg}>
                                    {loadingEditarOrg ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </div>
                        </div>
                    )}

                    {organizaciones.map(o => (
                        <div key={o.id} style={{ ...styles.card, opacity: o.activo ? 1 : 0.5 }}>
                            <span style={styles.nombre}>{o.nombre}</span>
                            <span style={styles.detalle}>{o.tipo === 'upv' ? '🏛️ UPV' : '🏢 Externa'}</span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    style={styles.btnAccion}
                                    onClick={() => { setOrgEditando(o); setEditOrgNombre(o.nombre); setEditOrgTipo(o.tipo); setErrorEditarOrg('') }}
                                >
                                    Modificar
                                </button>
                                <button
                                    style={{ ...styles.btnToggle, backgroundColor: o.activo ? '#fee2e2' : '#d1fae5', color: o.activo ? '#991b1b' : '#065f46' }}
                                    onClick={() => toggleActivo('organizaciones', o.id, o.activo)}
                                >
                                    {o.activo ? 'Desactivar' : 'Activar'}
                                </button>
                                <button
                                    style={{ ...styles.btnToggle, backgroundColor: '#fee2e2', color: '#991b1b' }}
                                    onClick={() => eliminarOrganizacion(o.id)}
                                >
                                    Eliminar
                                </button>
                            </div>
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

                    {operadorEditando && (
                        <div style={styles.formulario}>
                            <h3 style={{ margin: '0 0 1rem', color: '#111' }}>Modificar operador</h3>
                            <label style={styles.label}>Nombre *</label>
                            <input style={styles.input} value={editNombre} onChange={e => setEditNombre(e.target.value)} />
                            <label style={styles.label}>Email *</label>
                            <input style={styles.input} type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                            <label style={styles.label}>Rol</label>
                            <select style={styles.input} value={editRol} onChange={e => setEditRol(e.target.value)}>
                                <option value="operador">Operador</option>
                                <option value="admin">Admin</option>
                            </select>
                            <label style={styles.label}>Nueva contraseña (dejar vacío para no cambiar)</label>
                            <input style={styles.input} type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Nueva contraseña" />
                            {errorEditar && <p style={{ color: '#dc2626', fontSize: '0.875rem' }}>{errorEditar}</p>}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button style={styles.btnCancelar} onClick={() => setOperadorEditando(null)}>Cancelar</button>
                                <button style={styles.btnGuardar} onClick={guardarOperador} disabled={loadingEditar}>
                                    {loadingEditar ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                            </div>
                        </div>
                    )}

                    {operadores.map(o => (
                        <div key={o.id} style={{ ...styles.card, opacity: o.activo ? 1 : 0.5 }}>
                            <div style={styles.cardInfo}>
                                <span style={styles.nombre}>{o.nombre}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    style={styles.btnAccion}
                                    onClick={() => { setOperadorEditando(o); setEditNombre(o.nombre); setEditEmail(o.email); setEditRol(o.rol); setEditPassword(''); setErrorEditar('') }}
                                >
                                    Modificar
                                </button>
                                <button
                                    style={{ ...styles.btnToggle, backgroundColor: o.activo ? '#fee2e2' : '#d1fae5', color: o.activo ? '#991b1b' : '#065f46', opacity: o.id === miId ? 0.4 : 1 }}
                                    onClick={() => toggleActivo('operadores', o.id, o.activo)}
                                    disabled={o.id === miId}
                                >
                                    {o.activo ? 'Desactivar' : 'Activar'}
                                </button>
                                <button
                                    style={{ ...styles.btnToggle, backgroundColor: '#fee2e2', color: '#991b1b', opacity: o.id === miId ? 0.4 : 1 }}
                                    onClick={() => eliminarOperador(o.id)}
                                    disabled={o.id === miId}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {!loading && seccion === 'configuracion' && (
                <div style={styles.formulario}>
                    <h3 style={{ margin: '0 0 1rem', color: '#111' }}>Configuración del local</h3>
                    <label style={styles.label}>Nombre del local</label>
                    <input style={styles.input} value={editNombreLocal} onChange={e => setEditNombreLocal(e.target.value)} />
                    <label style={styles.label}>Aforo máximo (0 = sin límite)</label>
                    <input style={styles.input} type="number" min="0" value={editAforo} onChange={e => setEditAforo(parseInt(e.target.value) || 0)} />
                    {okConfig && <p style={{ color: '#16a34a', fontSize: '0.875rem', marginBottom: '0.5rem' }}>✅ Guardado correctamente</p>}
                    <button style={styles.btnGuardar} onClick={guardarConfig} disabled={loadingConfig}>
                        {loadingConfig ? 'Guardando...' : 'Guardar configuración'}
                    </button>
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
    btnAccion: { padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', color: '#111', fontSize: '0.875rem' },
    toggle: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
    toggleBtn: { flex: 1, padding: '0.5rem', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '0.875rem', color: '#111' },
    toggleActivo: { backgroundColor: '#2563eb', color: 'white', border: '1px solid #2563eb' },
}