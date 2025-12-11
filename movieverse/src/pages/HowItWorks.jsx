import React, { useState, useEffect } from 'react';
import { Search, Star, Heart, Shield, Zap, Globe, Play, Database, Film, Sparkles } from 'lucide-react';

const HowItWorks = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      id: 1,
      icon: Search,
      title: 'Discover',
      subtitle: 'Search Any Movie',
      description: 'Type any movie or anime title to instantly access comprehensive details from our global database.',
      highlight: 'Real-time search powered by trusted APIs',
      color: 'from-red-600 via-red-500 to-pink-500',
      gradient: 'from-red-600/20 to-red-500/20'
    },
    {
      id: 2,
      icon: Star,
      title: 'Explore',
      subtitle: 'Rich Information',
      description: 'Get ratings, cast details, plot summaries, and reviews from multiple trusted sources instantly.',
      highlight: 'Data from IMDb, TMDb, and Jikan APIs',
      color: 'from-red-600 via-red-500 to-pink-500',
      gradient: 'from-red-600/20 to-red-500/20'
    },
    {
      id: 3,
      icon: Heart,
      title: 'Save',
      subtitle: 'Build Your Collection',
      description: 'Create your personal watchlist and favorites collection with smart recommendations.',
      highlight: 'Personalized suggestions',
      color: 'from-red-600 via-red-500 to-pink-500',
      gradient: 'from-red-600/20 to-red-500/20'
    }
  ];

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized search with instant results',
      color: 'from-red-500 to-red-600',
      stat: '< 0.5s',
      label: 'Response'
    },
    {
      icon: Shield,
      title: 'Privacy Protected',
      description: 'Your data stays secure',
      color: 'from-gray-500 to-gray-600',
      stat: '100%',
      label: 'Secure'
    },
    {
      icon: Globe,
      title: 'Global Content',
      description: 'Movies and anime worldwide',
      color: 'from-red-600 to-pink-600',
      stat: '1M+',
      label: 'Titles'
    },
    {
      icon: Database,
      title: 'Rich Database',
      description: 'Comprehensive information',
      color: 'from-red-500 to-pink-500',
      stat: '99.9%',
      label: 'Uptime'
    }
  ];

  const apis = [
    {
      name: 'OMDb',
      description: 'Complete movie database with ratings and cast',
      color: 'from-red-600 via-red-500 to-pink-500',
      features: ['IMDb Integration', 'Detailed Metadata', 'Global Coverage'],
      icon: Film,
      glow: 'shadow-red-500/50'
    },
    {
      name: 'TMDb',
      description: 'High-quality images and comprehensive data',
      color: 'from-gray-600 via-gray-500 to-gray-400',
      features: ['HD Posters', 'Rich Media', 'Multi-language'],
      icon: Star,
      glow: 'shadow-gray-500/50'
    },
    {
      name: 'Jikan',
      description: 'Dedicated anime database and information',
      color: 'from-red-500 via-pink-500 to-red-400',
      features: ['Anime Focus', 'Episode Data', 'Community Ratings'],
      icon: Sparkles,
      glow: 'shadow-red-500/50'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0E13] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"></div>
      
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-12">
        {/* Hero Header */}
        <div className="text-center mb-20 animate-fadeIn">
          <div className="inline-block mb-6">
            <div className="flex items-center space-x-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-full px-6 py-3 backdrop-blur-sm">
              <Sparkles size={20} className="text-red-400" />
              <span className="text-sm font-semibold text-gray-300">STREAMING PLATFORM</span>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tight">
            How <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-red-500">MovieVerse</span> Works
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light">
            Discover movies and anime with
            <span className="text-white font-semibold"> powerful search</span>,
            <span className="text-white font-semibold"> real-time data</span>, and
            <span className="text-white font-semibold"> fast performance</span>
          </p>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12">
            {[
              { value: '1M+', label: 'Movies & Shows' },
              { value: '50K+', label: 'Daily Searches' },
              { value: '99.9%', label: 'Uptime' },
              { value: '<0.5s', label: 'Avg Response' }
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-900/80 to-black/80 border border-gray-800/50 rounded-2xl p-6 backdrop-blur-sm hover:border-red-500/30 transition-all duration-300 animate-scaleIn"
                style={{ animationDelay: `${index * 0.1 + 0.5}s` }}
              >
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Process Flow */}
        <div className="mb-24">
          <div className="relative max-w-7xl mx-auto animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500/50 to-transparent transform -translate-y-1/2"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isActive = activeStep === index;
                
                return (
                  <div
                    key={step.id}
                    onMouseEnter={() => setActiveStep(index)}
                    className="relative group cursor-pointer animate-slideUp"
                    style={{ animationDelay: `${index * 0.2 + 0.5}s` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-3xl blur-xl transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
                    
                    <div className={`relative bg-gradient-to-br from-gray-900/90 via-black/90 to-gray-900/90 p-8 rounded-3xl border backdrop-blur-xl transition-all duration-500 transform ${
                      isActive 
                        ? 'border-red-500/50 shadow-2xl shadow-red-500/20 scale-105 -translate-y-2' 
                        : 'border-gray-800/50 hover:border-gray-700/50 hover:scale-102'
                    }`}>
                      <div className="absolute -top-4 -right-4">
                        <div className={`w-12 h-12 bg-gradient-to-r ${step.color} text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg ${isActive ? 'animate-pulse' : ''}`}>
                          {step.id}
                        </div>
                      </div>

                      <div className="mb-6">
                        <div className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center shadow-lg ${isActive ? 'animate-bounce-subtle' : ''}`}>
                          <IconComponent size={40} className="text-white" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-3xl font-black text-white">
                          {step.title}
                        </h3>
                        <h4 className={`text-lg font-bold bg-gradient-to-r ${step.color} text-transparent bg-clip-text`}>
                          {step.subtitle}
                        </h4>
                        <p className="text-gray-400 leading-relaxed text-base">
                          {step.description}
                        </p>
                        <div className="pt-4">
                          <div className={`relative overflow-hidden text-sm bg-gradient-to-r ${step.gradient} p-4 rounded-xl border border-gray-700/50 backdrop-blur-sm`}>
                            <div className="relative z-10 flex items-center space-x-2">
                              <Zap size={16} className="text-white" />
                              <span className="text-white font-semibold">{step.highlight}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isActive && (
                        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-b-3xl animate-progress"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-24 animate-fadeIn" style={{ animationDelay: '1s' }}>
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black text-white mb-4">
              Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">MovieVerse</span>?
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto font-light">
              Powered by cutting-edge technology and premium APIs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative animate-scaleIn hover:scale-105 hover:-translate-y-1 transition-all duration-300"
                  style={{ animationDelay: `${1.2 + index * 0.1}s` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 rounded-2xl`}></div>
                  
                  <div className="relative bg-gradient-to-br from-gray-900/80 to-black/80 p-6 rounded-2xl border border-gray-800/50 group-hover:border-red-500/30 transition-all duration-300 backdrop-blur-sm">
                    <div className="mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow duration-300`}>
                        <IconComponent size={28} className="text-white" />
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className={`text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${feature.color}`}>
                        {feature.stat}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">
                        {feature.label}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* API Sources */}
        <div className="mb-24 animate-fadeIn" style={{ animationDelay: '1.5s' }}>
          <div className="relative bg-gradient-to-r from-red-500/5 via-gray-500/5 to-red-500/5 rounded-3xl p-12 border border-gray-800/50 backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_50%)]"></div>
            </div>

            <div className="relative z-10">
              <div className="text-center mb-12">
                <div className="inline-block mb-4">
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-full px-5 py-2">
                    <Database size={18} className="text-red-400" />
                    <span className="text-sm font-bold text-gray-300">POWERED BY</span>
                  </div>
                </div>
                <h2 className="text-5xl font-black text-white mb-4">
                  Premium <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">API Integration</span>
                </h2>
                <p className="text-gray-400 text-xl font-light">
                  Real-time data from trusted entertainment databases
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {apis.map((source, index) => {
                  const IconComponent = source.icon;
                  return (
                    <div
                      key={index}
                      className="group relative animate-slideUp hover:-translate-y-2 hover:scale-102 transition-all duration-300"
                      style={{ animationDelay: `${1.7 + index * 0.2}s` }}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r ${source.color} opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 rounded-2xl`}></div>
                      
                      <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 p-8 rounded-2xl border border-gray-800/50 group-hover:border-red-500/30 transition-all duration-300 backdrop-blur-sm">
                        <div className={`w-20 h-20 bg-gradient-to-r ${source.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl ${source.glow} group-hover:shadow-3xl group-hover:rotate-360 transition-all duration-600`}>
                          <IconComponent size={36} className="text-white" />
                        </div>
                        
                        <h3 className="text-white font-black text-2xl mb-2 text-center">
                          {source.name} <span className="text-gray-600 text-sm">API</span>
                        </h3>
                        <p className="text-gray-400 mb-6 text-center text-sm">
                          {source.description}
                        </p>
                        
                        <div className="space-y-2">
                          {source.features.map((feature, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 text-sm bg-gray-800/30 px-4 py-2 rounded-lg border border-gray-700/30"
                            >
                              <div className={`w-1.5 h-1.5 bg-gradient-to-r ${source.color} rounded-full`}></div>
                              <span className="text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div className="mb-24 animate-fadeIn" style={{ animationDelay: '2s' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-gray-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 p-8 rounded-2xl border border-gray-800/50 group-hover:border-red-500/30 transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-gray-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/50">
                    <Shield size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Your Privacy Matters</h3>
                    <p className="text-red-400 text-sm font-semibold">Secure & Private</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    'Secure encryption',
                    'No data collection',
                    'No third-party tracking',
                    'Complete control over your data'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-3 text-gray-300 bg-gray-800/30 px-4 py-3 rounded-lg border border-gray-700/30">
                      <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-gray-500 rounded-full"></div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 p-8 rounded-2xl border border-gray-800/50 group-hover:border-red-500/30 transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/50">
                    <Zap size={32} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">Instant Access</h3>
                    <p className="text-red-400 text-sm font-semibold">No Registration Required</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {[
                    'Start using immediately',
                    'Smart local storage',
                    'Personalized recommendations',
                    'Zero signup friction'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-3 text-gray-300 bg-gray-800/30 px-4 py-3 rounded-lg border border-gray-700/30">
                      <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center animate-fadeIn" style={{ animationDelay: '2.2s' }}>
          <div className="relative bg-gradient-to-r from-red-500/10 via-gray-500/10 to-red-500/10 p-16 rounded-3xl border border-gray-800/50 backdrop-blur-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-gray-500/5 to-red-500/5"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full bg-gradient-to-b from-red-500/10 to-transparent blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="inline-block mb-6 animate-pulse">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-red-500/30 to-pink-500/30 border border-red-500/50 rounded-full px-6 py-3 backdrop-blur-sm">
                  <Sparkles size={20} className="text-red-400" />
                  <span className="text-sm font-bold text-white">START YOUR JOURNEY</span>
                </div>
              </div>
              
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-red-500">Explore?</span>
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto font-light">
                Join thousands of movie enthusiasts discovering their next favorite film
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button
                  onClick={() => window.location.href = '/home'}
                  className="group relative px-12 py-5 bg-gradient-to-r from-red-600 to-pink-600 text-white font-black rounded-2xl shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 hover:scale-105 active:scale-95 transition-all duration-300 text-lg overflow-hidden"
                >
                  <span className="relative z-10 flex items-center space-x-2">
                    <Play size={20} fill="white" />
                    <span>Explore Movies Now</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-12 py-5 border-2 border-red-500/50 text-red-400 font-black rounded-2xl hover:bg-red-500/10 hover:border-red-500 hover:scale-105 active:scale-95 transition-all duration-300 text-lg backdrop-blur-sm"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes progress {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; opacity: 0; }
        .animate-slideUp { animation: slideUp 0.6s ease-out forwards; opacity: 0; }
        .animate-scaleIn { animation: scaleIn 0.5s ease-out forwards; opacity: 0; }
        .animate-progress { animation: progress 5s linear; }
        .animate-bounce-subtle { animation: bounce-subtle 2s ease-in-out infinite; }
        .hover\\:scale-102:hover { transform: scale(1.02); }
        .hover\\:rotate-360:hover { transform: rotate(360deg); }
        .duration-600 { transition-duration: 600ms; }
      `}</style>
    </div>
  );
};

export default HowItWorks;