import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Tag, FileText, Activity, Car } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const features = [
  { icon: Car,      label: 'Vehicle FASTag Activation',    desc: 'Activate by chassis or VRN instantly' },
  { icon: Tag,      label: 'Tag Registration & Status',    desc: 'Real-time tag lifecycle tracking' },
  { icon: FileText, label: 'Inventory Management',         desc: 'Track and manage tag stock with ease' },
  { icon: Activity, label: 'Reports & Analytics',          desc: 'Live performance and transaction reports' },
]

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
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f0f0f 0%, #1a0505 40%, #2d0808 100%)' }}>

        {/* Subtle red orb */}
        <div className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(185,28,28,0.18) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(185,28,28,0.10) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        {/* Thin horizontal rule accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, transparent, #dc2626 40%, #dc2626 60%, transparent)' }} />

        {/* Logo Row */}
        <div className="relative px-12 pt-10">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-white/10 p-[3px] flex-shrink-0"
              style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08)' }}>
              <img src="/Logo.png" alt="AK Toll Park" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div>
              <p className="text-white font-semibold text-base tracking-wide leading-none">AK Toll Park</p>
              <p className="text-red-400 text-xs font-medium tracking-widest uppercase mt-0.5">OEM Portal</p>
            </div>
          </div>
        </div>

        {/* Main copy */}
        <div className="flex-1 flex flex-col justify-center px-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <p className="text-red-500 text-xs font-semibold tracking-widest uppercase mb-4">
              Authorised OEM Portal
            </p>
            <h1 className="text-white font-bold leading-tight mb-5"
              style={{ fontSize: '2.6rem', letterSpacing: '-0.02em' }}>
              FASTag Operations,<br />
              <span style={{ color: '#f87171' }}>Simplified.</span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed max-w-sm">
              The official showroom platform for FASTag activation, tag management, and performance reporting — built for AK Toll Park dealership partners.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="grid grid-cols-2 gap-3 mt-10"
          >
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label}
                className="rounded-xl px-4 py-3.5 flex flex-col gap-1.5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(220,38,38,0.18)', border: '1px solid rgba(220,38,38,0.25)' }}>
                  <Icon size={14} color="#f87171" />
                </div>
                <p className="text-white text-xs font-semibold leading-snug">{label}</p>
                <p className="text-gray-500 text-xs leading-snug">{desc}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="px-12 pb-8 flex items-center justify-between">
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} AK Toll Park. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ boxShadow: '0 0 6px #22c55e' }} />
            <span className="text-gray-500 text-xs">Secure & Encrypted</span>
          </div>
        </div>
      </div>

      {/* ── Right panel – login form ── */}
      <div className="w-full lg:w-[460px] flex flex-col justify-center relative bg-white">

        {/* Top red accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, #dc2626, #b91c1c)' }} />

        <div className="px-10 py-14 max-w-sm mx-auto w-full">

          {/* Mobile logo */}
          <div className="lg:hidden mb-10 flex items-center gap-3">
            <img src="/Logo.png" alt="AK Toll Park" className="w-10 h-10 object-contain" />
            <div>
              <p className="font-semibold text-gray-900">AK Toll Park</p>
              <p className="text-red-500 text-xs tracking-wide uppercase">OEM Portal</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-gray-900 font-bold text-2xl mb-1.5" style={{ letterSpacing: '-0.02em' }}>
                Welcome back
              </h2>
              <p className="text-gray-400 text-sm">Sign in to your dealership account</p>
            </div>

            {/* Security badge */}
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 mb-7"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <ShieldCheck size={14} color="#16a34a" className="flex-shrink-0" />
              <p className="text-green-700 text-xs font-medium">256-bit encrypted & secured connection</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    className="input-field pl-10"
                    placeholder="you@dealership.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input-field pl-10 pr-11"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{
                  background: loading ? '#b91c1c' : 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(185,28,28,0.35)',
                }}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-gray-400 text-xs mt-8">
              Need access? Contact your AK Toll Park administrator
            </p>
          </motion.div>
        </div>

        {/* Subtle bottom decoration */}
        <div className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(220,38,38,0.05) 0%, transparent 70%)' }} />
      </div>

    </div>
  )
}
