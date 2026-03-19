import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// Inline SVG car graphic
const CarSVG = () => (
  <svg viewBox="0 0 600 250" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-2xl mx-auto">
    {/* Road */}
    <rect x="0" y="200" width="600" height="50" fill="url(#roadGrad)" rx="4"/>
    {/* Road markings */}
    <rect x="60" y="221" width="60" height="8" fill="rgba(255,255,255,0.15)" rx="4"/>
    <rect x="180" y="221" width="60" height="8" fill="rgba(255,255,255,0.15)" rx="4"/>
    <rect x="300" y="221" width="60" height="8" fill="rgba(255,255,255,0.15)" rx="4"/>
    <rect x="420" y="221" width="60" height="8" fill="rgba(255,255,255,0.15)" rx="4"/>
    {/* Car body */}
    <path d="M100 200 L100 155 L140 120 L240 110 L360 110 L420 135 L480 155 L480 200 Z"
      fill="url(#carBodyGrad)" rx="8"/>
    {/* Car top */}
    <path d="M175 150 L200 118 L310 112 L360 118 L395 150 Z"
      fill="url(#carTopGrad)" rx="4"/>
    {/* Windshield */}
    <path d="M185 147 L207 120 L305 115 L305 147 Z" fill="rgba(150,200,255,0.15)" rx="2"/>
    {/* Rear window */}
    <path d="M315 147 L315 115 L355 120 L388 147 Z" fill="rgba(150,200,255,0.1)" rx="2"/>
    {/* Windows separator */}
    <rect x="308" y="116" width="5" height="31" fill="#1a1a2e"/>
    {/* Front bumper */}
    <path d="M460 185 L490 185 L500 200 L450 200 Z" fill="#DC2626"/>
    {/* Rear bumper */}
    <path d="M90 185 L70 185 L60 200 L110 200 Z" fill="#DC2626"/>
    {/* Headlights */}
    <ellipse cx="470" cy="170" rx="15" ry="8" fill="rgba(255,200,50,0.9)"/>
    <ellipse cx="470" cy="170" rx="12" ry="6" fill="rgba(255,220,100,0.8)"/>
    {/* Headlight glow */}
    <ellipse cx="480" cy="170" rx="25" ry="12" fill="rgba(255,200,50,0.15)"/>
    <ellipse cx="495" cy="170" rx="35" ry="15" fill="rgba(255,200,50,0.07)"/>
    {/* Tail lights */}
    <rect x="98" y="162" width="12" height="20" fill="#DC2626" rx="3"/>
    <rect x="98" y="162" width="12" height="20" fill="rgba(255,50,50,0.6)" rx="3"/>
    {/* Wheels */}
    <circle cx="165" cy="200" r="35" fill="#1a1a2e" stroke="#333" strokeWidth="3"/>
    <circle cx="165" cy="200" r="25" fill="#222" stroke="#DC2626" strokeWidth="2"/>
    <circle cx="165" cy="200" r="12" fill="#111"/>
    <circle cx="165" cy="200" r="5" fill="#DC2626"/>
    {/* Wheel spokes */}
    <line x1="165" y1="178" x2="165" y2="190" stroke="#444" strokeWidth="3"/>
    <line x1="165" y1="210" x2="165" y2="222" stroke="#444" strokeWidth="3"/>
    <line x1="143" y1="200" x2="155" y2="200" stroke="#444" strokeWidth="3"/>
    <line x1="175" y1="200" x2="187" y2="200" stroke="#444" strokeWidth="3"/>

    <circle cx="415" cy="200" r="35" fill="#1a1a2e" stroke="#333" strokeWidth="3"/>
    <circle cx="415" cy="200" r="25" fill="#222" stroke="#DC2626" strokeWidth="2"/>
    <circle cx="415" cy="200" r="12" fill="#111"/>
    <circle cx="415" cy="200" r="5" fill="#DC2626"/>
    <line x1="415" y1="178" x2="415" y2="190" stroke="#444" strokeWidth="3"/>
    <line x1="415" y1="210" x2="415" y2="222" stroke="#444" strokeWidth="3"/>
    <line x1="393" y1="200" x2="405" y2="200" stroke="#444" strokeWidth="3"/>
    <line x1="425" y1="200" x2="437" y2="200" stroke="#444" strokeWidth="3"/>

    {/* Door lines */}
    <path d="M200 152 L200 195" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
    <path d="M315 152 L315 195" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
    <rect x="240" y="168" width="4" height="4" rx="2" fill="rgba(255,255,255,0.3)"/>
    <rect x="355" y="168" width="4" height="4" rx="2" fill="rgba(255,255,255,0.2)"/>
    {/* FASTag sticker on windshield */}
    <rect x="270" y="118" width="26" height="16" rx="2" fill="#DC2626" opacity="0.8"/>
    <text x="273" y="129" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial">FASTag</text>
    {/* Speed lines */}
    <line x1="20" y1="160" x2="90" y2="160" stroke="rgba(220,38,38,0.3)" strokeWidth="2"/>
    <line x1="35" y1="172" x2="85" y2="172" stroke="rgba(220,38,38,0.2)" strokeWidth="1.5"/>
    <line x1="25" y1="148" x2="75" y2="148" stroke="rgba(220,38,38,0.15)" strokeWidth="1"/>
    <defs>
      <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a2e"/>
        <stop offset="100%" stopColor="#0d0d1a"/>
      </linearGradient>
      <linearGradient id="carBodyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#CC1F1F"/>
        <stop offset="50%" stopColor="#DC2626"/>
        <stop offset="100%" stopColor="#991B1B"/>
      </linearGradient>
      <linearGradient id="carTopGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#B91C1C"/>
        <stop offset="100%" stopColor="#DC2626"/>
      </linearGradient>
    </defs>
  </svg>
)

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Login failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Left: Branding + Car Visual */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-gradient-to-br from-[#0a0a0a] via-[#120a0a] to-[#0a0a0a]">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-red-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-red-950/10 to-transparent" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(rgba(220,38,38,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(220,38,38,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative p-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center red-glow">
              <Zap className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <div>
              <p className="font-display font-bold text-white text-xl">AK Toll Park</p>
              <p className="text-red-400 text-sm font-medium tracking-wide">OEM PORTAL</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-10 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center mb-8"
          >
            <h1 className="font-display font-bold text-5xl text-white mb-3 leading-tight">
              Activate <span className="gradient-text-red">FASTag</span>
              <br />with Ease
            </h1>
            <p className="text-white/40 text-lg max-w-sm mx-auto">
              OEM Showroom Portal — Activate tags by chassis or vehicle number instantly
            </p>
          </motion.div>

          {/* Car illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-full relative"
            style={{ animation: 'float 6s ease-in-out infinite' }}
          >
            <CarSVG />
            {/* Red glow under car */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-64 h-8 bg-red-600/20 blur-xl rounded-full" />
          </motion.div>

          {/* Feature chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mt-4"
          >
            {['Chassis Activation', 'VRN Activation', 'Instant KYC', 'Real-time Reports'].map((feat) => (
              <div key={feat} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-white/60 text-xs">{feat}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <div className="p-8 text-center">
          <p className="text-white/20 text-xs">Powered by Bajaj FASTag Network • Secure & Encrypted</p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-[440px] flex flex-col justify-center px-8 py-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <div>
            <p className="font-display font-bold text-white">AK Toll Park</p>
            <p className="text-red-400 text-xs">OEM Portal</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-white mb-2">Sign In</h2>
            <p className="text-white/40">Access your OEM activation portal</p>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 bg-green-500/5 border border-green-500/15 rounded-xl px-3 py-2 mb-6">
            <Shield size={14} className="text-green-400 flex-shrink-0" />
            <p className="text-green-400/80 text-xs">Secured with end-to-end encryption</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-white/50 text-sm font-medium mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  className="input-field pl-10"
                  placeholder="agent@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-white/50 text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6 h-12 text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-white/20 text-xs mt-8">
            Having trouble? Contact your administrator
          </p>
        </motion.div>

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-600/5 blur-3xl pointer-events-none" />
      </div>
    </div>
  )
}
