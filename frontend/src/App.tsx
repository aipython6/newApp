import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import SourceDB from './pages/SourceDB'
import TargetDB from './pages/TargetDB'
import SyncTasks from './pages/SyncTasks'
import SyncLogs from './pages/SyncLogs'
import UserManagement from './pages/UserManagement'
import DeptMapping from './pages/DeptMapping'
import KspxManagement from './pages/KspxManagement'
import KnowledgeBase from './pages/KnowledgeBase'
import Settings from './pages/Settings'

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'))

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/source-db" element={<SourceDB />} />
          <Route path="/target-db" element={<TargetDB />} />
          <Route path="/sync-tasks" element={<SyncTasks />} />
          <Route path="/sync-logs" element={<SyncLogs />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/depts" element={<DeptMapping />} />
          <Route path="/kspx" element={<KspxManagement />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
