import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Package, Search, Tag, RefreshCw, CheckCircle, Clock, Filter } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAgentTags } from '../services/api'
import toast from 'react-hot-toast'

export default function Inventory() {
  const { user } = useAuth()
  const [tags, setTags] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [bankFilter, setBankFilter] = useState('all')

  useEffect(() => { fetchTags() }, [])

  useEffect(() => {
    let list = [...tags]
    if (search) list = list.filter(t => (t.kitNo || t.serialNo || '')?.toLowerCase().includes(search.toLowerCase()))
    if (bankFilter !== 'all') list = list.filter(t => bankFilter === 'bajaj' ? t.isBajaj : !t.isBajaj)
    setFiltered(list)
  }, [tags, search, bankFilter])

  const fetchTags = async () => {
    setLoading(true)
    try {
      const res = await getAgentTags()
      const list = Array.isArray(res.data) ? res.data : res.data?.data || []
      setTags(list)
    } catch {
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const bajajCount = tags.filter(t => t.isBajaj).length

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tag Inventory</h1>
        <p className="text-gray-500 text-sm mt-1">Your assigned FASTag inventory</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { label: 'Total Tags', value: tags.length, color: '#6366f1', icon: Package },
          { label: 'Bajaj Tags', value: bajajCount, color: '#DC2626', icon: Tag },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="card flex flex-col items-center text-center p-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{loading ? '–' : s.value}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input className="input-field pl-9" placeholder="Search by serial number..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-500" />
          {['all', 'bajaj'].map(f => (
            <button key={f} onClick={() => setBankFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${bankFilter === f ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {f === 'all' ? 'All' : 'Bajaj'}
            </button>
          ))}
        </div>
        <button onClick={fetchTags} className="btn-secondary px-4">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Tags Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No tags found</p>
          <p className="text-gray-400 text-sm mt-1">{search ? 'Try a different search' : 'Contact admin to assign tags to you'}</p>
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((tag, i) => (
            <motion.div key={tag._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="card hover:border-gray-300 transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border bg-red-50 text-red-600 border-red-200`}>
                  BAJAJ
                </span>
                <CheckCircle size={14} className="text-green-500" />
              </div>
              <p className="font-mono text-sm font-semibold text-gray-800 mb-1">{tag.kitNo || tag.serialNo}</p>
              {tag.tid && <p className="font-mono text-xs text-gray-500">TID: {tag.tid}</p>}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                <Clock size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400">{tag.tagClass || 'Standard'}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
