import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Car, Search, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { checkTagRegistrationStatus } from '../services/api'

const TAG_STATUS_CONFIG = {
  ACTIVE: { label: 'Active', icon: CheckCircle, color: '#16a34a', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  INACTIVE: { label: 'Inactive', icon: XCircle, color: '#dc2626', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  BLOCKED: { label: 'Blocked', icon: AlertCircle, color: '#ea580c', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  PENDING: { label: 'Pending', icon: Clock, color: '#2563eb', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
}

function getStatusConfig(tagStatus) {
  const key = (tagStatus || '').toUpperCase()
  return TAG_STATUS_CONFIG[key] || {
    label: tagStatus || 'Unknown',
    icon: AlertCircle,
    color: '#6b7280',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
  }
}

const ResultRow = ({ label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
    <span className="text-gray-500 text-sm w-40 flex-shrink-0">{label}</span>
    <span className="text-gray-900 text-sm font-medium flex-1">{value || '—'}</span>
  </div>
)

export default function TagRegStatus() {
  const [vrn, setVrn] = useState('')
  const [tagSerial, setTagSerial] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleCheck = async (e) => {
    e.preventDefault()
    const cleanVrn = vrn.replace(/\s/g, '').toUpperCase()
    if (!cleanVrn) {
      toast.error('Please enter the Vehicle Registration Number (VRN)')
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await checkTagRegistrationStatus({ vrn: cleanVrn, tagSerialNo: tagSerial.trim() })
      setResult({ ...res.data, checked: true })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to check tag status'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const statusCfg = result ? getStatusConfig(result.tagStatus) : null
  const StatusIcon = statusCfg?.icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center">
            <Tag size={18} className="text-red-600" />
          </div>
          <h1 className="font-display font-bold text-gray-900 text-xl">Tag Registration Status</h1>
        </div>
        <p className="text-gray-500 text-sm ml-12">Check the Bajaj FASTag registration status for a vehicle.</p>
      </motion.div>

      {/* Input Card */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <form onSubmit={handleCheck} className="space-y-4">
          {/* VRN */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Vehicle Registration Number (VRN) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Car size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={vrn}
                onChange={(e) => setVrn(e.target.value.toUpperCase())}
                placeholder="e.g. MH12AB1234"
                className="input pl-9 uppercase"
                required
              />
            </div>
          </div>

          {/* Tag Serial (optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tag Serial Number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={tagSerial}
                onChange={(e) => setTagSerial(e.target.value)}
                placeholder="Enter tag serial number"
                className="input pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={16} className="animate-spin" /> Checking…</>
            ) : (
              <><Search size={16} /> Check Status</>
            )}
          </button>
        </form>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {result?.checked && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`card border ${statusCfg.border} ${statusCfg.bg}`}
          >
            {/* Status badge */}
            <div className="flex items-center gap-3 mb-5">
              <StatusIcon size={32} style={{ color: statusCfg.color }} />
              <div>
                <p className={`text-xl font-bold ${statusCfg.text}`}>{statusCfg.label}</p>
                {result.tagStatus && (
                  <p className="text-gray-400 text-xs mt-0.5">{result.tagStatus}</p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 px-4">
              {result.tagId && <ResultRow label="Tag ID" value={result.tagId} />}
              {result.tagSerialNo && <ResultRow label="Tag Serial No." value={result.tagSerialNo} />}
              {result.status && <ResultRow label="Status Code" value={result.status} />}
              {result.remarks && <ResultRow label="Remarks" value={result.remarks} />}
              {result.respDateTime && <ResultRow label="Response Time" value={result.respDateTime} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
