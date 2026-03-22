import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, CircleCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

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
    <div className="min-h-screen bg-white flex">
      {/* Left: Branding */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-red-800">
        {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-red-900/30 to-transparent" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Logo */}
        <div className="relative p-10">
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="AK Toll Park" className="w-12 h-12 object-contain bg-white rounded-2xl p-1 shadow-lg" />
            <div>
              <p className="font-display font-bold text-white text-xl">AK Toll Park</p>
              <p className="text-red-100 text-sm font-medium tracking-wide">OEM PORTAL</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-10 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-left max-w-xl"
          >
            <h1 className="font-display font-bold text-5xl text-white mb-3 leading-tight">
              Professional FASTag
              <br />Operations Portal
            </h1>
            <p className="text-red-100/80 text-lg max-w-lg">
              Official AK Toll Park OEM portal for secure FASTag activation, status checks, and reporting.
            </p>
          </motion.div>

          {/* Feature list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 gap-3 mt-10 w-full max-w-xl"
          >
            {['Chassis Activation', 'VRN Activation', 'Tag Registration Status', 'Real-time Reports'].map((feat) => (
              <div key={feat} className="flex items-center gap-2.5 bg-white/10 border border-white/20 px-4 py-3 rounded-xl">
                <CircleCheck size={16} className="text-white/90 flex-shrink-0" />
                <span className="text-white/90 text-sm font-medium">{feat}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <div className="p-8 text-center">
          <p className="text-white/40 text-xs">Powered by Bajaj FASTag Network • Secure & Encrypted</p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-[440px] flex flex-col justify-center px-8 py-12 relative bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 flex items-center gap-3">
          <img src="/Logo.png" alt="AK Toll Park" className="w-10 h-10 object-contain" />
          <div>
            <p className="font-display font-bold text-gray-900">AK Toll Park</p>
            <p className="text-red-500 text-xs">OEM Portal</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h2 className="font-display font-bold text-3xl text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-500">Access your OEM activation portal</p>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-6">
            <Shield size={14} className="text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-xs">Secured with end-to-end encryption</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-gray-600 text-sm font-medium mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
              <label className="text-gray-600 text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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

          <p className="text-center text-gray-400 text-xs mt-8">
            Having trouble? Contact your administrator
          </p>
        </motion.div>

        {/* Bottom glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-50 blur-3xl pointer-events-none" />
      </div>
    </div>
  )
}
