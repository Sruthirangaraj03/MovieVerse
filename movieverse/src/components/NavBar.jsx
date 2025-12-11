// src/components/Navbar.jsx - Updated with Backend Integration
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Home, Heart, HelpCircle, User, LogOut, Menu, X, Play, Settings } from 'lucide-react'

const Navbar = ({ user, onLogout, openAuthModal }) => {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Simple navigation items - no dynamic user-specific items
  const navItems = [
    { name: 'Home', path: '/home', icon: Home },
    { name: 'Favorites', path: '/favorites', icon: Heart },
    { name: 'How It Works', path: '/how-it-works', icon: HelpCircle }
  ]
  const isActive = (path) => location.pathname === path

  // Close all menus
  const closeAllMenus = () => {
    setShowUserMenu(false)
    setIsMenuOpen(false)
  }

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-primary-black/80 backdrop-blur-lg border-b border-white/10"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Bold and Visible */}
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/home" className="flex items-center gap-2" onClick={closeAllMenus}>
              <div className="relative">
                <Play className="w-8 h-8 text-primary-red fill-current" />
                {/* Subtle glow effect - much reduced */}
                <motion.div
                  className="absolute inset-0 bg-primary-red/10 rounded-full blur-md"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <span className="text-xl font-black text-white">
                MovieVerse
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <motion.div key={item.name}>
                <Link
                  to={item.path}
                  onClick={closeAllMenus}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    isActive(item.path)
                      ? 'text-primary-red bg-primary-red/10'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                  
                  {/* Active indicator */}
                  {isActive(item.path) && (
                    <motion.div
                      className="absolute bottom-0 left-1/2 w-1 h-1 bg-primary-red rounded-full"
                      layoutId="activeIndicator"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ x: '-50%', y: '150%' }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* User Section */}
          <div className="flex items-center gap-4">
            {user ? (
              /* Logged In User - Show Full Name as Button */
              <div className="relative">
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 text-white font-medium hover:text-primary-red transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-sm">{`${user.firstName} ${user.lastName}`}</span>
                  <motion.div
                    animate={{ rotate: showUserMenu ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-3 h-3 border-l border-b border-gray-400 transform rotate-45"
                  />
                </motion.button>

                {/* Simple Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.button
                        onClick={() => {
                          onLogout()
                          closeAllMenus()
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition-all duration-300"
                        whileHover={{ backgroundColor: "#374151" }}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Not Logged In - Show Login Button with Reduced Shadow */
              <motion.button
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-primary-red to-red-600 text-white font-medium rounded-lg hover:from-red-600 hover:to-primary-red transition-all duration-300 shadow-md shadow-primary-red/20"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 6px 15px rgba(220, 38, 38, 0.25)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:block">Login</span>
              </motion.button>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden bg-primary-gray/95 backdrop-blur-lg border-t border-white/10"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 py-6 space-y-4">
              {/* Mobile User Info (if logged in) */}
              {user && (
                <motion.div
                  className="flex items-center gap-3 px-4 py-3 bg-primary-red/10 rounded-lg border border-primary-red/20 mb-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-red to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{`${user.firstName} ${user.lastName}`}</p>
                    <p className="text-gray-400 text-xs">{user.email}</p>
                  </div>
                </motion.div>
              )}

              {/* Navigation Items */}
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={item.path}
                    onClick={closeAllMenus}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? 'text-primary-red bg-primary-red/10'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile Logout (if logged in) */}
              {user && (
                <motion.button
                  onClick={() => {
                    onLogout()
                    closeAllMenus()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 border border-red-500/20"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: navItems.length * 0.1 }}
                  whileHover={{ x: 5 }}
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close menus */}
      {(showUserMenu || isMenuOpen) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={closeAllMenus}
        />
      )}
    </motion.nav>
  )
}

export default Navbar