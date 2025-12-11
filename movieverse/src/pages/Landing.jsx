// src/pages/Landing.jsx
import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, Star, Heart, Search } from 'lucide-react'

const Landing = () => {
  const navigate = useNavigate()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        duration: 0.8
      }
    }
  }

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  }

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-black via-primary-smoke to-primary-gray">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 w-40 h-40 bg-primary-red/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 -right-20 w-60 h-60 bg-primary-red/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/3 w-32 h-32 bg-white/5 rounded-full blur-2xl"
          animate={{
            x: [-50, 50, -50],
            y: [-20, 20, -20]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-20 left-20"
            variants={floatingVariants}
            animate="animate"
          >
            <Play className="w-8 h-8 text-primary-red/40" />
          </motion.div>
          <motion.div
            className="absolute top-40 right-32"
            variants={floatingVariants}
            animate="animate"
            style={{ animationDelay: '1s' }}
          >
            <Star className="w-6 h-6 text-yellow-500/40" />
          </motion.div>
          <motion.div
            className="absolute bottom-32 left-1/4"
            variants={floatingVariants}
            animate="animate"
            style={{ animationDelay: '2s' }}
          >
            <Heart className="w-7 h-7 text-primary-red/40" />
          </motion.div>
          <motion.div
            className="absolute bottom-40 right-20"
            variants={floatingVariants}
            animate="animate"
            style={{ animationDelay: '1.5s' }}
          >
            <Search className="w-8 h-8 text-white/30" />
          </motion.div>
        </div>

        {/* Logo/Brand */}
        <motion.div
          className="mb-8"
          variants={itemVariants}
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-white via-gray-200 to-primary-red bg-clip-text text-transparent"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            MovieVerse
          </motion.h1>
          <motion.div
            className="h-1 w-32 bg-gradient-to-r from-primary-red to-white mx-auto rounded-full"
            initial={{ width: 0 }}
            animate={{ width: 128 }}
            transition={{ delay: 1, duration: 1 }}
          />
        </motion.div>

        {/* Main Headline */}
        <motion.h2
          className="text-3xl md:text-5xl font-bold mb-6 leading-tight max-w-4xl"
          variants={itemVariants}
        >
          <span className="text-white">Your one-stop place for</span>
          <br />
          <span className="bg-gradient-to-r from-primary-red via-red-400 to-primary-red bg-clip-text text-transparent">
            movie & anime reviews!
          </span>
        </motion.h2>

        {/* Subtext */}
        <motion.p
          className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl leading-relaxed"
          variants={itemVariants}
        >
          Discover trending titles, read authentic reviews, and favorite what you love. 
          All in one beautiful, lightning-fast platform.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          onClick={() => navigate('/home')}
          className="group relative px-12 py-4 bg-gradient-to-r from-primary-red to-red-600 text-white font-bold text-lg rounded-xl overflow-hidden"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.05,
          }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              "0 0 20px rgba(220, 38, 38, 0.3)",
              "0 0 40px rgba(220, 38, 38, 0.6)",
              "0 0 20px rgba(220, 38, 38, 0.3)"
            ]
          }}
          transition={{
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          {/* Button Background Animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-red-600 to-primary-red opacity-0 group-hover:opacity-100"
            initial={{ x: '-100%' }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Button Content */}
          <span className="relative z-10 flex items-center gap-3">
            Get Started
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Play className="w-5 h-5 fill-current" />
            </motion.div>
          </span>
        </motion.button>

        {/* Stats */}
        <motion.div
          className="mt-16 grid grid-cols-3 gap-8 text-center"
          variants={itemVariants}
        >
          {[
            { number: '10M+', label: 'Movies & Shows' },
            { number: '24/7', label: 'Real-time Data' },
            { number: '∞', label: 'Possibilities' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="group"
              whileHover={{ scale: 1.1 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 + index * 0.2 }}
            >
              <motion.div
                className="text-2xl md:text-3xl font-black bg-gradient-to-r from-primary-red to-white bg-clip-text text-transparent mb-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {stat.number}
              </motion.div>
              <div className="text-gray-400 text-sm font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-3 bg-white/60 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Landing;