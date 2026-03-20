import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Phone, ChevronRight, Loader2, CheckCircle, AlertCircle, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { sendOtpReplacement, validateOtpReplacement, replaceTag, getBajajTags } from '../services/api'

const REASONS = [
  { id: '1', label: 'Tag Damaged' },
  { id: '2', label: 'Lost Tag' },
  { id: '3', label: 'Tag Not Working' },
  { id: '99', label: 'Others' },
]

const STEPS = [
  { id: 1, title: 'Vehicle Details' },
  { id: 2, title: 'Verify OTP' },
  { id: 3, title: 'Replace Tag' },
  { id: 4, title: 'Complete' },
]

export default function Replacement() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ vehicleNo: '', mobileNo: '', walletId: '' })
  const [sessionId, setSessionId] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [vehicleDetails, setVehicleDetails] = useState(null)
  const [custDetails, setCustDetails] = useState(null)
  const [reason, setReason] = useState('1')
  const [reasonDesc, setReasonDesc] = useState('')
  const [agentTags, setAgentTags] = useState([])
  const [selectedTag, setSelectedTag] = useState(null)
  const [result, setResult] = useState(null)

  const handleSendOtp = async () => {
    if (!form.vehicleNo) { toast.error('Enter vehicle number'); return }
    if (!form.mobileNo || form.mobileNo.length < 10) { toast.error('Enter valid mobile number'); return }
    setLoading(true)
    try {
      const res = await sendOtpReplacement({
        mobileNo: form.mobileNo, vehicleNo: form.vehicleNo, reqType: 'REP', resend: 0, isChassis: 0
      })
      const sid = res.data?.validateCustResp?.sessionId
      if (!sid) throw new Error(res.data?.response?.errorDesc || 'OTP send failed')
      setSessionId(sid)
      toast.success('OTP sent')
      setStep(2)
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const handleOtpDigit = (val, idx) => {
    const digits = [...otpDigits]
    digits[idx] = val.replace(/\D/, '').slice(-1)
    setOtpDigits(digits)
    if (val && idx < 5) document.getElementById(`rep-otp-${idx + 1}`)?.focus()
    if (digits.every(d => d !== '') && val) setTimeout(() => handleValidateOtp(digits), 300)
  }

  const handleValidateOtp = async (digitsArg) => {
    const otpVal = (digitsArg || otpDigits).join('')
    if (otpVal.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    setLoading(true)
    try {
      const res = await validateOtpReplacement({ validateOtpReq: { mobileNo: form.mobileNo, otp: otpVal } })
      const resp = res.data?.validateOtpResp
      if (!resp) throw new Error(res.data?.response?.errorDesc || 'OTP validation failed')
      setVehicleDetails(resp.vrnDetails)
      setCustDetails(resp.custDetails)
      toast.success('OTP verified!')
      setStep(3)
      const tagRes = await getBajajTags()
      const list = Array.isArray(tagRes.data) ? tagRes.data : tagRes.data?.data || []
      setAgentTags(list)
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  const handleReplace = async () => {
    if (!selectedTag) { toast.error('Select a replacement tag'); return }
    if (reason === '99' && !reasonDesc) { toast.error('Enter reason description'); return }
    setLoading(true)
    try {
      const res = await replaceTag({
        mobileNo: form.mobileNo,
        vehicleNo: form.vehicleNo || vehicleDetails?.vehicleNo,
        serialNo: selectedTag.kitNo || selectedTag.serialNo,
        reason,
        ...(reason === '99' ? { reasonDesc } : {}),
        repTagCost: String(vehicleDetails?.repTagCost || '0'),
        chassisNo: vehicleDetails?.chassisNo || '',
        engineNo: vehicleDetails?.engineNo || '',
        isNationalPermit: vehicleDetails?.isNationalPermit || '0',
        permitExpiryDate: vehicleDetails?.permitExpiryDate || '',
        stateOfRegistration: vehicleDetails?.stateOfRegistration || '',
        vehicleDescriptor: vehicleDetails?.vehicleDescriptor || '',
      })
      if (!res.data?.success) throw new Error(res.data?.message || res.data?.response?.errorDesc || 'Replacement failed')
      const r = res.data?.APIResponse?.tagReplaceResp || res.data?.APIResponse || res.data
      setResult(r)
      toast.success('Tag replaced successfully!')
      setStep(4)
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Replace failed')
    } finally { setLoading(false) }
  }

  const handleReset = () => {
    setStep(1); setForm({ vehicleNo: '', mobileNo: '', walletId: '' })
    setSessionId(''); setOtpDigits(['','','','','','']); setVehicleDetails(null)
    setCustDetails(null); setReason('1'); setReasonDesc(''); setSelectedTag(null); setResult(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tag Replacement</h1>
        <p className="text-gray-500 text-sm mt-1">Replace a damaged, lost or non-functional FASTag</p>
      </motion.div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${step === s.id ? 'bg-red-600 text-white' : step > s.id ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
              <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">{s.id}</span>
              {s.title}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} className="text-gray-400 mx-1 flex-shrink-0" />}
          </div>
        ))}
      </div>

      <div className="card">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="r1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter Vehicle Details</h2>
              <div className="space-y-4">
                <input className="input-field" placeholder="Vehicle Number (e.g. MH12AB1234) *" value={form.vehicleNo} onChange={e => setForm(f => ({ ...f, vehicleNo: e.target.value.toUpperCase() }))} />
                <input className="input-field" placeholder="Customer Mobile Number *" maxLength={10} value={form.mobileNo} onChange={e => setForm(f => ({ ...f, mobileNo: e.target.value.replace(/\D/, '') }))} />
              </div>
              <button className="btn-primary w-full mt-6" onClick={handleSendOtp} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Sending...' : 'Send OTP'} <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="r2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Verify OTP</h2>
              <p className="text-gray-500 text-sm mb-6">OTP sent to {form.mobileNo}</p>
              <div className="flex gap-3 justify-center mb-6">
                {otpDigits.map((d, i) => (
                  <input key={i} id={`rep-otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e => handleOtpDigit(e.target.value, i)}
                    onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && document.getElementById(`rep-otp-${i - 1}`)?.focus()}
                    className="w-11 h-14 text-center text-xl font-bold rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all" />
                ))}
              </div>
              {loading && <div className="flex justify-center mb-4"><Loader2 size={24} className="animate-spin text-red-500" /></div>}
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary flex-1" onClick={() => handleValidateOtp()} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="r3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Replacement Tag</h2>
              {vehicleDetails && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-sm">
                  <p className="text-red-600 font-semibold">{vehicleDetails.vehicleNo}</p>
                  <p className="text-gray-500 mt-1">{vehicleDetails.vehicleManuf} {vehicleDetails.model}</p>
                </div>
              )}
              <div className="mb-4">
                <label className="text-sm text-gray-600 mb-2 block">Reason for Replacement *</label>
                <select className="input-field" value={reason} onChange={e => setReason(e.target.value)}>
                  {REASONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
                {reason === '99' && (
                  <textarea className="input-field mt-3" rows={3} placeholder="Describe the reason *" value={reasonDesc} onChange={e => setReasonDesc(e.target.value)} />
                )}
              </div>
              <label className="text-sm text-gray-600 mb-2 block">Select New Tag *</label>
              {agentTags.length === 0
                ? <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-gray-200">No tags available in inventory</div>
                : <div className="space-y-2 max-h-52 overflow-y-auto">
                    {agentTags.map(tag => (
                      <button key={tag._id} onClick={() => setSelectedTag(tag)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left
                          ${selectedTag?._id === tag._id ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div>
                          <p className="font-mono text-sm text-gray-800">{tag.kitNo || tag.serialNo}</p>
                          <p className="text-xs text-gray-500">Bajaj</p>
                        </div>
                        {selectedTag?._id === tag._id && <CheckCircle size={16} className="text-red-500" />}
                      </button>
                    ))}
                  </div>
              }
              <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1" onClick={() => setStep(2)}>Back</button>
                <button className="btn-primary flex-1" onClick={handleReplace} disabled={loading || !selectedTag}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  {loading ? 'Replacing...' : 'Replace Tag'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="r4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 bg-green-50 border-2 border-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-green-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tag Replaced!</h2>
                <p className="text-gray-500 mb-6">The tag has been successfully replaced</p>
                {result && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-left space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Vehicle</span>
                      <span className="text-gray-800 font-mono">{result.vrn}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">New Serial No</span>
                      <span className="text-gray-800 font-mono">{result.serialNo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">NPCI Status</span>
                      <span className="text-green-600">{result.npciStatus}</span>
                    </div>
                  </div>
                )}
                <button className="btn-primary w-full" onClick={handleReset}>Start New Replacement</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
