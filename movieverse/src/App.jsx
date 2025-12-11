// src/App.jsx - COMPLETE PRODUCTION VERSION WITH FAVORITES CONTEXT
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Context
import { FavoritesProvider } from './context/FavoritesContext'  // ✅ IMPORT CONTEXT

// Components
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Favorites from './pages/Favorites'
import HowItWorks from './pages/HowItWorks'
import MovieDetail from './pages/MovieDetail'
import AuthModal from './components/AuthModal'
import Landing from './pages/Landing'

function App() {
  const [user, setUser] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')
  const [isLoading, setIsLoading] = useState(true)

  // ✅ AUTO-LOGIN: Check localStorage on app mount
  useEffect(() => {
    const checkStoredUser = () => {
      try {
        const storedUser = localStorage.getItem('currentUser')
        const loginTimestamp = localStorage.getItem('loginTimestamp')
        
        if (storedUser) {
          const userData = JSON.parse(storedUser)
          
          // ✅ Session validation (optional: 7 days expiration)
          const sessionDuration = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
          const currentTime = Date.now()
          
          if (loginTimestamp && (currentTime - parseInt(loginTimestamp)) > sessionDuration) {
            // Session expired, clear data
            console.log('⚠️ Session expired, clearing user data')
            localStorage.removeItem('currentUser')
            localStorage.removeItem('loginTimestamp')
            setUser(null)
          } else {
            // ✅ Valid session, restore user
            console.log('✅ Restoring user session:', userData)
            setUser(userData)
          }
        } else {
          console.log('ℹ️ No stored user found')
        }
      } catch (error) {
        console.error('❌ Error checking stored user:', error)
        localStorage.removeItem('currentUser')
        localStorage.removeItem('loginTimestamp')
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkStoredUser()
  }, [])

  // ✅ Handle successful login/signup
  const handleAuthSuccess = (userData) => {
    console.log('✅ Auth success, setting user:', userData)
    
    // ✅ Ensure user has both _id and id fields
    const normalizedUser = {
      _id: userData._id || userData.id,
      id: userData._id || userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      phone: userData.phone,
      address: userData.address,
      favorites: userData.favorites || [],
      ...userData
    }
    
    setUser(normalizedUser)
    
    // ✅ Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(normalizedUser))
    localStorage.setItem('loginTimestamp', Date.now().toString())
    
    console.log('✅ User saved to localStorage')
    
    setIsAuthModalOpen(false)
  }

  // ✅ Handle logout
  const handleLogout = () => {
    console.log('👋 Logging out user')
    setUser(null)
    localStorage.removeItem('currentUser')
    localStorage.removeItem('loginTimestamp')
  }

  // ✅ Open auth modal
  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode)
    setIsAuthModalOpen(true)
  }

  // ✅ Close auth modal
  const closeAuthModal = () => {
    setIsAuthModalOpen(false)
  }

  // ✅ Update user state (for refreshing user data after favorite changes)
  const refreshUser = async () => {
    if (!user) return
    
    try {
      const userId = user._id || user.id || user.email
      const response = await fetch(`http://localhost:5000/api/favorites/${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          const updatedUser = {
            ...user,
            favorites: data.favorites || []
          }
          
          setUser(updatedUser)
          localStorage.setItem('currentUser', JSON.stringify(updatedUser))
          console.log('✅ User favorites refreshed:', data.favorites?.length || 0)
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error)
    }
  }

  // ✅ Show loading spinner while checking for stored user
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-gray-300 text-lg font-medium">Loading MovieVerse...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      {/* ✅ WRAP ENTIRE APP WITH FAVORITES PROVIDER */}
      <FavoritesProvider user={user} openAuthModal={openAuthModal}>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
          {/* Navigation */}
          <Navbar
            user={user}
            onLogout={handleLogout}
            openAuthModal={openAuthModal}
          />

          {/* Routes */}
          <Routes>
            {/* Landing Page - Redirect to home if logged in */}
            <Route 
              path="/" 
              element={
                user ? (
                  <Navigate to="/home" replace />
                ) : (
                  <Landing openAuthModal={openAuthModal} />
                )
              } 
            />

            {/* Home Page */}
            <Route 
              path="/home" 
              element={
                <Home 
                  user={user} 
                  openAuthModal={openAuthModal}
                  refreshUser={refreshUser}
                />
              } 
            />

            {/* Movie Detail Page */}
            <Route 
              path="/movie/:id" 
              element={
                <MovieDetail 
                  user={user} 
                  openAuthModal={openAuthModal}
                  refreshUser={refreshUser}
                />
              } 
            />

            {/* Favorites Page - Protected Route */}
            <Route 
              path="/favorites" 
              element={
                user ? (
                  <Favorites 
                    user={user} 
                    openAuthModal={openAuthModal}
                    refreshUser={refreshUser}
                  />
                ) : (
                  <Navigate to="/home" replace />
                )
              } 
            />

            {/* How It Works Page */}
            <Route 
              path="/how-it-works" 
              element={<HowItWorks />} 
            />

            {/* Catch-all - Redirect to home */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>

          {/* Auth Modal */}
          <AuthModal
            isOpen={isAuthModalOpen}
            mode={authModalMode}
            onClose={closeAuthModal}
            onAuthSuccess={handleAuthSuccess}
          />
        </div>
      </FavoritesProvider>
    </Router>
  )
}

export default App