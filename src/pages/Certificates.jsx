import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  FileText, Search, Download, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Tag, Calendar, Car, CheckCircle2, RefreshCw, User
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getMyActivations, downloadFitmentCertificate } from '../services/api'

const PAGE_SIZE = 20

export default function Certificates() {
  const [activations, setActivations] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [downloading, setDownloading] = useState(null) // serialNo currently downloading

  const fetchActivations = useCallback(async (pg, q) => {
    setLoading(true)
    try {
      const res = await getMyActivations({ page: pg, limit: PAGE_SIZE, search: q || '' })
      const data = res.data
      setActivations(data.activations || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / PAGE_SIZE) || 1)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load activations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActivations(page, search)
  }, [page]) // eslint-disable-line

  // When search changes, reset to page 1
  const handleSearch = () => {
    setPage(1)
    fetchActivations(1, search)
  }

  const handleDownload = async (serialNo, vrn) => {
    setDownloading(serialNo)
    try {
      const res = await downloadFitmentCertificate(serialNo)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `fitment_${vrn || serialNo}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Certificate downloaded')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Download failed')
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Fitment Certificates</h1>
        <p className="text-gray-500 text-sm mt-1">Download FASTag fitment certificates for your activations</p>
      </motion.div>

      <div className="card">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder="Search by VRN, Chassis No or Tag Serial..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button className="btn-primary shrink-0 px-5" onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            <span className="ml-1.5">Search</span>
          </button>
        </div>

        {/* Stats row */}
        {!loading && (
          <p className="text-xs text-gray-400 mb-3">
            Showing {activations.length > 0 ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)}` : '0'} of {total} activations
          </p>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 size={28} className="animate-spin text-red-500" />
          </div>
        ) : activations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <FileText size={40} className="mb-3 opacity-40" />
            <p className="text-sm">No activations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">
                    <span className="flex items-center gap-1.5"><Car size={13} /> Vehicle</span>
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4">
                    <span className="flex items-center gap-1.5"><Tag size={13} /> Tag Serial</span>
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4 hidden md:table-cell">TID</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4 hidden lg:table-cell">Cert ID</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4 hidden xl:table-cell">
                    <span className="flex items-center gap-1.5"><User size={13} /> Customer</span>
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-3 pr-4 hidden sm:table-cell">
                    <span className="flex items-center gap-1.5"><Calendar size={13} /> Activated On</span>
                  </th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activations.map((item, i) => (
                  <motion.tr
                    key={item._id || i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-mono text-gray-900 font-semibold text-xs">{item.vehicleNo || '—'}</p>
                        {item.isChassisBased && (
                          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 rounded px-1.5 py-0.5 mt-0.5 inline-block">
                            Chassis
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-gray-700 text-xs">{item.serialNo || '—'}</span>
                    </td>
                    <td className="py-3 pr-4 hidden md:table-cell">
                      <span className="font-mono text-gray-500 text-xs">
                        {item.tid ? item.tid.slice(0, 8) + '...' : '—'}
                      </span>
                    </td>
                    {/* Cert ID — shows stored ID + issued badge, hidden on small screens */}
                    <td className="py-3 pr-4 hidden lg:table-cell">
                      {item.fitmentCertId ? (
                        <div>
                          <span className="font-mono text-gray-700 text-[11px]">
                            {item.fitmentCertId.length > 18
                              ? item.fitmentCertId.slice(0, 18) + '…'
                              : item.fitmentCertId}
                          </span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <CheckCircle2 size={10} className="text-green-500" />
                            <span className="text-[10px] text-green-600 font-medium">Issued</span>
                            {item.fitmentIssuedAt && (
                              <span className="text-[10px] text-gray-400">
                                · {new Date(item.fitmentIssuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-gray-400">Not yet issued</span>
                      )}
                    </td>
                    {/* Customer name + mobile — hidden below xl */}
                    <td className="py-3 pr-4 hidden xl:table-cell">
                      <div>
                        <p className="text-gray-800 text-xs font-medium">{item.customerName || '\u2014'}</p>
                        {item.mobileNo && (
                          <p className="text-gray-400 text-[11px] font-mono mt-0.5">{item.mobileNo}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 hidden sm:table-cell">
                      <span className="text-gray-500 text-xs">{formatDate(item.createdAt)}</span>
                    </td>
                    <td className="py-3">
                      {item.serialNo ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => handleDownload(item.serialNo, item.vehicleNo)}
                            disabled={downloading === item.serialNo}
                            className={`flex items-center gap-1.5 text-xs font-medium rounded-lg px-2.5 py-1.5 transition-colors disabled:opacity-50 border ${
                              item.fitmentCertId
                                ? 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                                : 'text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                            }`}
                            title={item.fitmentCertId ? 'Re-download (same cert ID)' : 'Generate & download certificate'}
                          >
                            {downloading === item.serialNo
                              ? <Loader2 size={13} className="animate-spin" />
                              : item.fitmentCertId
                                ? <RefreshCw size={13} />
                                : <Download size={13} />}
                            <span className="hidden sm:inline">
                              {item.fitmentCertId ? 'Re-download' : 'Download'}
                            </span>
                          </button>
                          {item.fitmentCertId && (
                            <span className="text-[9px] text-gray-400 pr-0.5">Same cert ID</span>
                          )}
                        </div>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <AlertCircle size={13} /> N/A
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-gray-100">
            <button
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-900">{page}</span> of {totalPages}
            </span>
            <button
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
