import { FC } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import QueuePage from './pages/QueuePage'
import ReviewPage from './pages/ReviewPage'

const App: FC = () => {
  const { isAuthenticated } = useAuthStore()

  return (
    <div style={{ minHeight: '100vh' }}>
      <Routes>
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/queue" /> : <LoginPage />} 
        />
        <Route 
          path="/queue" 
          element={isAuthenticated ? <QueuePage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/review/:projectId" 
          element={isAuthenticated ? <ReviewPage /> : <Navigate to="/login" />} 
        />
        <Route path="/" element={<Navigate to="/queue" />} />
      </Routes>
    </div>
  )
}

export default App