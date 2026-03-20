import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Car, Tag, RefreshCw, TrendingUp, ArrowRight, Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getSaleReport } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

const StatCard = ({ icon: Icon, label, value, sub, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="card relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-5 -translate-y-6 translate-x-6`}
      style={{ background: color }} />
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
        style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <TrendingUp size={14} className="text-gray-300" />
    </div>
    <p className="text-3xl font-display font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-gray-500 text-sm">{label}</p>
    {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
  </motion.div>
)

const QuickAction = ({ icon: Icon, label, to, color }) => {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="flex flex-col items-center gap-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl hover:border-red-200 hover:bg-red-50/50 transition-all duration-200 group"
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
        style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <span className="text-gray-500 text-xs font-medium group-hover:text-gray-700 transition-colors">{label}</span>
    </button>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, today: 0, tags: 0, replaced: 0 })
  const [recentActivations, setRecentActivations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const res = await getSaleReport({ from: today, to: today, agentId: user?.id })
      const data = res.data
      setStats({
        total: data?.totalActivations || 0,
        today: data?.todayActivations || 0,
        tags: data?.totalTags || 0,
        replaced: data?.replaced || 0,
      })
      setRecentActivations(data?.recent || [])
    } catch {
      // fail silently, show zeros
    } finally {
      setLoading(false)
    }
  }

  const statusIcon = (status) => {
    if (status === 'success' || status === 'ACTIVE') return <CheckCircle size={14} className="text-green-400" />
    if (status === 'pending') return <Clock size={14} className="text-amber-400" />
    return <AlertCircle size={14} className="text-red-400" />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'},{' '}
            <span className="gradient-text-red">{user?.name?.split(' ')[0] || 'Agent'}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-xl">
          <Activity size={14} className="text-green-600 animate-pulse" />
          <span className="text-green-700 text-sm font-medium">System Live</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Car} label="Today's Activations" value={loading ? '—' : stats.today} sub="New FASTag registrations" color="#DC2626" delay={0} />
        <StatCard icon={Tag} label="Total Activations" value={loading ? '—' : stats.total} sub="All time" color="#3b82f6" delay={0.1} />
        <StatCard icon={RefreshCw} label="Replacements" value={loading ? '—' : stats.replaced} sub="Tag replacements" color="#a855f7" delay={0.2} />
        <StatCard icon={TrendingUp} label="Wallet Balance" value={`₹${(user?.wallet || 0).toLocaleString('en-IN')}`} sub="Available balance" color="#22c55e" delay={0.3} />
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickAction icon={Car} label="New FASTag" to="/registration" color="#DC2626" />
          <QuickAction icon={RefreshCw} label="Replace Tag" to="/replacement" color="#a855f7" />
          <QuickAction icon={Tag} label="Tag Inventory" to="/inventory" color="#3b82f6" />
          <QuickAction icon={TrendingUp} label="Reports" to="/reports" color="#22c55e" />
        </div>
      </motion.div>

      {/* Activation Info Card */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Allowed Banks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
            Permitted Banks
          </h2>
          <div className="space-y-2">
            {(user?.allowedBanks?.length > 0 ? user.allowedBanks : ['Bajaj']).map((bank) => (
              <div key={bank} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <Tag size={14} className="text-red-500" />
                  </div>
                  <span className="text-gray-800 text-sm font-medium">{bank} FASTag</span>
                </div>
                <span className="badge-success">Active</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="w-1 h-5 bg-red-600 rounded-full inline-block" />
              Recent Activity
            </h2>
            <button onClick={() => window.location.href='/reports'} className="text-red-500 hover:text-red-600 text-xs flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-12 rounded-xl shimmer" />
              ))}
            </div>
          ) : recentActivations.length === 0 ? (
            <div className="text-center py-8">
              <Car size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No activations yet today</p>
              <button
                onClick={() => window.location.href='/registration'}
                className="mt-3 text-red-500 hover:text-red-600 text-xs flex items-center gap-1 mx-auto"
              >
                Activate first tag <ArrowRight size={12} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivations.slice(0, 4).map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
                  {statusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-xs font-medium truncate">{item.vrn || item.chassisNo}</p>
                    <p className="text-gray-400 text-xs">{item.mobile || 'N/A'}</p>
                  </div>
                  <span className="text-gray-400 text-xs">{item.time}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
