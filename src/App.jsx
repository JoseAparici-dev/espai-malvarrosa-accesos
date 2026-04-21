import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Accesos from './pages/Accesos'

function App() {
  const [sesion, setSesion] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSesion(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (sesion === undefined) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!sesion ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={sesion ? <Accesos /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App