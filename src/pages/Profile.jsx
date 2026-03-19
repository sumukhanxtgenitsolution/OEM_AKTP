import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, CreditCard, Shield, LogOut, Key, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const fields = [
    { icon: User, label: 'Full Name', value: user?.name || '-' },
    { icon: Mail, label: 'Email', value: user?.email || '-' },
    { icon: Phone, label: 'Phone Number', value: user?.number || '-' },
    { icon: CreditCard, label: 'Wallet Balance', value: `₹${(user?.wallet || 0).toLocaleString('en-IN')}` },
    { icon: Shield, label: 'Allowed Banks', value: (user?.allowedBanks || []).join(', ') || 'None' },
    { icon: Building2, label: 'OEM Access', value: user?.isOEMAgent ? '✅ Enabled' : '❌ Disabled' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Your account information and settings</p>
      </motion.div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card mb-5 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-white">
          {(user?.name || 'A')[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold bg-brand-900/40 text-brand-400 border border-brand-800/50 px-2.5 py-1 rounded-full">
            <Shield size={11} /> OEM Agent
          </span>
        </div>
      </motion.div>

      {/* Info Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card mb-5 divide-y divide-gray-800">
        {fields.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={16} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm text-white font-medium truncate">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Security */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card mb-5">
        <h3 className="text-sm font-semibold text-white mb-4">Security</h3>
        <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors text-left">
          <Key size={16} className="text-gray-400" />
          <div>
            <p className="text-sm text-white">Change Password</p>
            <p className="text-xs text-gray-500">Update your login password</p>
          </div>
        </button>
      </motion.div>

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-900/20 border border-red-900/40 hover:bg-red-900/30 text-red-400 font-semibold transition-all duration-200">
          <LogOut size={18} />
          Sign Out
        </button>
      </motion.div>
    </div>
  )
}
