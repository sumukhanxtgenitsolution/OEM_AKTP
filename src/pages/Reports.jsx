import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Download, Calendar, Filter, TrendingUp, RefreshCw, Car, Tag } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getSaleReport } from '../services/api'
import toast from 'react-hot-toast'

const today = () => new Date().toISOString().split('T')[0]
const monthStart = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0] }

export default function Reports() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [totals, setTotals] = useState({ activations: 0, replacements: 0 })
  const [dateRange, setDateRange] = useState({ from: monthStart(), to: today() })
  const [bankFilter, setBankFilter] = useState('all')

  useEffect(() => { fetchReport() }, [])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await getSaleReport({
        from: dateRange.from,
        to: dateRange.to,
        agentId: user?.id,
        ...(bankFilter !== 'all' ? { bank: bankFilter } : {}),
      })
      const list = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []
      setData(list)
      const acts = list.filter(r => !r.isReplacement).length
      const reps = list.filter(r => r.isReplacement).length
      setTotals({ activations: acts, replacements: reps })
    } catch (err) {
      toast.error('Failed to load report')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!data.length) { toast.error('No data to export'); return }
    const headers = ['Date', 'Vehicle No', 'Customer Name', 'Mobile', 'Tag Serial', 'Type', 'Bank', 'Status']
    const rows = data.map(r => [
      r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '-',
      r.vehicleNo || '-', r.customerName || r.name || '-',
      r.mobileNo || '-', r.serialNo || '-',
      r.isReplacement ? 'Replacement' : 'New', r.bank || (r.isBajaj ? 'Bajaj' : 'Livquick'),
      r.status || 'Active'
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `oem-report-${dateRange.from}-to-${dateRange.to}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success('Report downloaded')
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Report</h1>
          <p className="text-gray-500 text-sm mt-1">View your activation and replacement history</p>
        </div>
        <button onClick={downloadCSV} className="btn-secondary text-sm">
          <Download size={15} /> Export CSV
        </button>
      </motion.div>

      {/* Filters */}
      <div className="card mb-5 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-gray-500 mb-1.5 block">From</label>
          <input type="date" className="input-field" value={dateRange.from} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))} />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-gray-500 mb-1.5 block">To</label>
          <input type="date" className="input-field" value={dateRange.to} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))} />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-gray-500 mb-1.5 block">Bank</label>
          <select className="input-field" value={bankFilter} onChange={e => setBankFilter(e.target.value)}>
            <option value="all">All Banks</option>
            <option value="Bajaj">Bajaj</option>
            <option value="Livqick">Livquick</option>
          </select>
        </div>
        <button className="btn-primary px-6" onClick={fetchReport} disabled={loading}>
          {loading ? <RefreshCw size={15} className="animate-spin" /> : <Filter size={15} />}
          {loading ? 'Loading...' : 'Apply'}
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Records', value: data.length, icon: TrendingUp, color: '#6366f1' },
          { label: 'New Activations', value: totals.activations, icon: Car, color: '#DC2626' },
          { label: 'Replacements', value: totals.replacements, icon: RefreshCw, color: '#f59e0b' },
          { label: 'Bajaj Tags', value: data.filter(r => r.isBajaj || r.bank === 'Bajaj').length, icon: Tag, color: '#10b981' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{loading ? '–' : s.value}</p>
                <p className="text-gray-500 text-xs">{s.label}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Transaction History</h3>
          <span className="text-xs text-gray-500">{data.length} records</span>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center items-center gap-3 text-gray-500">
              <RefreshCw size={18} className="animate-spin" /> Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16">
              <BarChart2 size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-400">No records found for selected period</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/50">
                  {['Date', 'Vehicle No', 'Customer', 'Mobile', 'Serial No', 'Type', 'Bank', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={row._id || i} className="border-t border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-5 py-3 font-mono text-white text-xs whitespace-nowrap">{row.vehicleNo || '-'}</td>
                    <td className="px-5 py-3 text-white whitespace-nowrap">{row.customerName || row.name || '-'}</td>
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap">{row.mobileNo || '-'}</td>
                    <td className="px-5 py-3 font-mono text-gray-400 text-xs whitespace-nowrap">{row.serialNo || '-'}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${row.isReplacement ? 'bg-amber-900/30 text-amber-400 border-amber-800/40' : 'bg-brand-900/30 text-brand-400 border-brand-800/40'}`}>
                        {row.isReplacement ? 'Replacement' : 'New'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {row.bank || (row.isBajaj ? 'Bajaj' : 'Livquick')}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-800/40">
                        {row.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
