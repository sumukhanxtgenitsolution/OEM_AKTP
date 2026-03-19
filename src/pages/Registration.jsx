import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car, Hash, Phone, User, ChevronRight, ChevronLeft,
  CheckCircle, Upload, Tag, Loader2, AlertCircle, X, CreditCard
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  sendOtp, validateOtp, createWallet,
  uploadDocument, registerFastag, checkTagStatus,
  getAgentTags
} from '../services/api'

const UPLOAD_LABELS = {
  RCFRONT: 'RC Front',
  RCBACK: 'RC Back',
  VEHICLEFRONT: 'Vehicle Front',
  VEHICLESIDE: 'Vehicle Side',
  TAGAFFIX: 'Tag Affixed'
}

const STEPS = [
  { id: 1, title: 'Vehicle Details', icon: Car },
  { id: 2, title: 'Verify OTP', icon: Phone },
  { id: 3, title: 'Customer KYC', icon: User },
  { id: 4, title: 'Upload Documents', icon: Upload },
  { id: 5, title: 'Assign Tag', icon: Tag },
  { id: 6, title: 'Complete', icon: CheckCircle },
]

const StepIndicator = ({ steps, current }) => (
  <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
    {steps.map((s, i) => {
      const Icon = s.icon
      const state = current > s.id ? 'done' : current === s.id ? 'active' : 'pending'
      return (
        <div key={s.id} className="flex items-center flex-shrink-0">
          <div className={`flex flex-col items-center gap-1`}>
            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300
              ${state === 'active' ? 'bg-brand-600 border-brand-500 shadow-lg shadow-brand-900/50' :
                state === 'done' ? 'bg-brand-900/60 border-brand-700' : 'bg-gray-800 border-gray-700'}`}>
              {state === 'done'
                ? <CheckCircle size={16} className="text-brand-400" />
                : <Icon size={16} className={state === 'active' ? 'text-white' : 'text-gray-500'} />}
            </div>
            <span className={`text-[10px] font-medium hidden sm:block ${state === 'active' ? 'text-brand-400' : 'text-gray-600'}`}>
              {s.title}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-8 md:w-16 mx-1 transition-all duration-500 ${
              current > s.id ? 'bg-brand-700' : 'bg-gray-800'}`} />
          )}
        </div>
      )
    })}
  </div>
)

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

export default function Registration() {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1
  const [mode, setMode] = useState('chassis') // 'chassis' | 'vrn'
  const [vehicleForm, setVehicleForm] = useState({ chassisNo: '', vehicleNo: '', engineNo: '', mobileNo: '', vehicleCategory: 'VC4' })
  const [sessionId, setSessionId] = useState('')

  // Step 2 - OTP
  const [otp, setOtp] = useState('')
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [vehicleDetails, setVehicleDetails] = useState(null)
  const [custDetails, setCustDetails] = useState(null)
  const [vahanSuccess, setVahanSuccess] = useState(false)
  const [needsWallet, setNeedsWallet] = useState(false)

  // Step 3 - KYC
  const [kycForm, setKycForm] = useState({ name: '', lastName: '', dob: '', docType: '1', docNo: '', expiryDate: '' })

  // Step 4 - Docs
  const [uploads, setUploads] = useState({})
  const [uploadProgress, setUploadProgress] = useState({})

  // Step 5 - Tag
  const [agentTags, setAgentTags] = useState([])
  const [selectedTag, setSelectedTag] = useState(null)
  const [tagResult, setTagResult] = useState(null)

  const next = () => setStep(s => Math.min(s + 1, 6))
  const back = () => setStep(s => Math.max(s - 1, 1))

  // ── STEP 1: Send OTP ──────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const { chassisNo, vehicleNo, engineNo, mobileNo } = vehicleForm
    if ((mode === 'chassis' && !chassisNo) || (mode === 'vrn' && !vehicleNo)) {
      toast.error('Please enter ' + (mode === 'chassis' ? 'chassis number' : 'vehicle number'))
      return
    }
    if (!engineNo) { toast.error('Please enter last 5 digits of engine number'); return }
    if (!mobileNo || mobileNo.length < 10) { toast.error('Please enter valid mobile number'); return }

    setLoading(true)
    try {
      const payload = {
        mobileNo,
        engineNo,
        reqType: 'REG',
        resend: 0,
        isChassis: mode === 'chassis' ? 1 : 0,
        vehicleCategory: vehicleForm.vehicleCategory,
        ...(mode === 'chassis' ? { chassisNo } : { vehicleNo }),
      }
      const res = await sendOtp(payload)
      const sid = res.data?.validateCustResp?.sessionId
      if (!sid) throw new Error(res.data?.response?.errorDesc || 'OTP send failed')
      setSessionId(sid)
      toast.success('OTP sent to ' + mobileNo)
      next()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  // ── STEP 2: Validate OTP ──────────────────────────────────────────────
  const handleValidateOtp = async () => {
    const otpVal = otpDigits.join('')
    if (otpVal.length !== 6) { toast.error('Enter 6-digit OTP'); return }
    setLoading(true)
    try {
      const res = await validateOtp({ validateOtpReq: { mobileNo: vehicleForm.mobileNo, otp: otpVal, sessionId } })
      const resp = res.data?.validateOtpResp
      if (!resp) throw new Error(res.data?.response?.errorDesc || 'OTP validation failed')
      setVahanSuccess(res.data?.vahanSuccess === true)
      setVehicleDetails(resp.vrnDetails)
      setCustDetails(resp.custDetails)
      const walletExists = resp.custDetails?.walletStatus !== 'NE' && resp.custDetails?.walletStatus !== undefined
      setNeedsWallet(!walletExists)
      toast.success('OTP verified!')
      // Pre-fill KYC form with available data from Vahan
      if (resp.custDetails?.name) setKycForm(f => ({ ...f, name: resp.custDetails.name, lastName: resp.custDetails.lastName || '' }))
      if (!walletExists) {
        next() // go to KYC
      } else {
        setStep(4) // skip KYC, go to docs
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpDigit = (val, idx) => {
    const digits = [...otpDigits]
    digits[idx] = val.replace(/\D/, '').slice(-1)
    setOtpDigits(digits)
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus()
    if (digits.every(d => d !== '') && val) {
      setTimeout(() => handleValidateOtpAuto(digits), 300)
    }
  }

  const handleValidateOtpAuto = async (digits) => {
    const otpVal = digits.join('')
    setLoading(true)
    try {
      const res = await validateOtp({ validateOtpReq: { mobileNo: vehicleForm.mobileNo, otp: otpVal, sessionId } })
      const resp = res.data?.validateOtpResp
      if (!resp) throw new Error(res.data?.response?.errorDesc || 'OTP validation failed')
      setVahanSuccess(res.data?.vahanSuccess === true)
      setVehicleDetails(resp.vrnDetails)
      setCustDetails(resp.custDetails)
      const walletExists = resp.custDetails?.walletStatus !== 'NE' && resp.custDetails?.walletStatus !== undefined
      setNeedsWallet(!walletExists)
      toast.success('OTP verified!')
      if (resp.custDetails?.name) setKycForm(f => ({ ...f, name: resp.custDetails.name, lastName: resp.custDetails.lastName || '' }))
      if (!walletExists) { next() } else { setStep(4) }
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  // ── STEP 3: Create Wallet ─────────────────────────────────────────────
  const handleCreateWallet = async () => {
    const { name, lastName, dob, docType, docNo, expiryDate } = kycForm
    if (!name || !lastName || !dob || !docNo) { toast.error('Please fill all required fields'); return }
    setLoading(true)
    try {
      const res = await createWallet({
        reqWallet: { sessionId },
        custDetails: {
          name, lastName, mobileNo: vehicleForm.mobileNo, dob,
          doc: [{ docType, docNo, ...(expiryDate ? { expiryDate } : {}) }],
        }
      })
      const cd = res.data?.custDetails
      if (!cd || res.data?.response?.code !== '00') throw new Error(res.data?.response?.errorDesc || 'Wallet creation failed')
      setCustDetails(cd)
      toast.success('Wallet created!')
      next()
      fetchAgentTags()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to create wallet')
    } finally {
      setLoading(false)
    }
  }

  // ── STEP 4: Upload Documents ──────────────────────────────────────────
  const getRequiredDocs = () => {
    const isVc4 = String(vehicleDetails?.npciVehicleClassID || (vehicleForm.vehicleCategory === 'VC4' ? '4' : '0')) === '4'
    if (isVc4 && vahanSuccess) return ['VEHICLEFRONT']
    if (isVc4 && !vahanSuccess) return ['RCFRONT', 'RCBACK', 'VEHICLEFRONT']
    return ['RCFRONT', 'RCBACK', 'VEHICLEFRONT', 'VEHICLESIDE', 'TAGAFFIX']
  }

  const requiredDocs = getRequiredDocs()
  const allDocsUploaded = requiredDocs.every(t => uploads[t] !== undefined)

  const handleUploadFile = (imageType, file) => {
    if (!file) return
    setUploads(u => ({ ...u, [imageType]: file }))
    setUploadProgress(p => ({ ...p, [imageType]: 'done' }))
  }

  const handleUploadAllAndContinue = async () => {
    if (!allDocsUploaded) return toast.error('Upload all required documents')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('mobileNo', String(vehicleForm.mobileNo || ''))
      formData.append('vahanSuccess', vahanSuccess ? '1' : '0')
      formData.append('npciVehicleClassID', String(vehicleDetails?.npciVehicleClassID || (vehicleForm.vehicleCategory === 'VC4' ? '4' : '0')))
      
      requiredDocs.forEach(docType => {
        if(uploads[docType]) {
          formData.append(docType, uploads[docType])
        }
      })
      
      const res = await uploadDocument(formData)
      toast.success('All documents uploaded successfully!')
      next()
      fetchAgentTags()
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to upload documents')
    } finally {
      setLoading(false)
    }
  }

  // ── STEP 5: Fetch Tags + Register ────────────────────────────────────
  const fetchAgentTags = async () => {
    try {
      const res = await getAgentTags()
      const list = Array.isArray(res.data) ? res.data : res.data?.data || []
      setAgentTags(list.filter(t => ['Assigned', 'Available'].includes(t.status)))
    } catch { setAgentTags([]) }
  }

  const handleRegisterTag = async () => {
    if (!selectedTag) { toast.error('Please select a tag'); return }
    setLoading(true)
    try {
      const res = await registerFastag({
        vrn: vehicleDetails?.vehicleNo || vehicleForm.vehicleNo,
        chassis: vehicleDetails?.chassis || vehicleForm.chassisNo,
        engine: vehicleDetails?.engineNo || vehicleForm.engineNo,
        vehicleManuf: vehicleDetails?.vehicleManuf || '',
        model: vehicleDetails?.model || '',
        vehicleColour: vehicleDetails?.vehicleColour || '',
        type: vehicleDetails?.type || '',
        status: vehicleDetails?.status || '',
        npciStatus: vehicleDetails?.npciStatus || '',
        isCommercial: vehicleDetails?.isCommercial || '0',
        tagVehicleClassID: vehicleDetails?.tagVehicleClassID || vehicleForm.vehicleCategory,
        npciVehicleClassID: vehicleDetails?.npciVehicleClassID || vehicleForm.vehicleCategory,
        vehicleType: vehicleDetails?.vehicleType || '',
        rechargeAmount: vehicleDetails?.rechargeAmount || '0',
        securityDeposit: vehicleDetails?.securityDeposit || '0',
        tagCost: vehicleDetails?.tagCost || '0',
        vehicleDescriptor: vehicleDetails?.vehicleDescriptor || '',
        isNationalPermit: vehicleDetails?.isNationalPermit || '0',
        permitExpiryDate: vehicleDetails?.permitExpiryDate || '',
        stateOfRegistration: vehicleDetails?.stateOfRegistration || '',
        custName: custDetails?.name || '',
        custMobileNo: vehicleForm.mobileNo,
        walletId: custDetails?.walletId || '',
        serialNo: selectedTag.kitNo || selectedTag.serialNo,
        tid: selectedTag.tid || '',
        custId: custDetails?.custId || ''
      })
      const result = res.data?.tagRegistrationResp
      if (!result) throw new Error(res.data?.response?.errorDesc || 'Registration failed')
      setTagResult(result)
      toast.success('FASTag activated successfully!')
      setStep(6)
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep(1); setMode('chassis'); setVehicleForm({ chassisNo: '', vehicleNo: '', engineNo: '', mobileNo: '', vehicleCategory: 'VC4' })
    setSessionId(''); setOtpDigits(['','','','','','']); setVehicleDetails(null); setCustDetails(null); setVahanSuccess(false)
    setNeedsWallet(false); setKycForm({ name: '', lastName: '', dob: '', docType: '1', docNo: '', expiryDate: '' })
    setUploads({}); setUploadProgress({}); setAgentTags([]); setSelectedTag(null); setTagResult(null)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-white">New FASTag Registration</h1>
        <p className="text-gray-500 text-sm mt-1">Activate a new FASTag for your customer's vehicle</p>
      </motion.div>

      <div className="card">
        <StepIndicator steps={STEPS} current={step} />

        <AnimatePresence mode="wait">
          {/* ── Step 1: Vehicle ── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-white mb-4">Vehicle Details</h2>
              {/* Mode Toggle */}
              <div className="flex bg-gray-800 rounded-xl p-1 mb-5 w-fit">
                {[{ id: 'chassis', label: '🔩 Chassis Number' }, { id: 'vrn', label: '🚗 Vehicle Number' }].map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m.id ? 'bg-brand-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="space-y-4">
                {mode === 'chassis'
                  ? <input className="input-field" placeholder="Chassis Number *" value={vehicleForm.chassisNo} onChange={e => setVehicleForm(f => ({ ...f, chassisNo: e.target.value.toUpperCase() }))} />
                  : <input className="input-field" placeholder="Vehicle Number (e.g. MH12AB1234) *" value={vehicleForm.vehicleNo} onChange={e => setVehicleForm(f => ({ ...f, vehicleNo: e.target.value.toUpperCase() }))} />}
                <input className="input-field" placeholder="Engine Number (Last 5 digits) *" maxLength={5} value={vehicleForm.engineNo} onChange={e => setVehicleForm(f => ({ ...f, engineNo: e.target.value.toUpperCase() }))} />
                <input className="input-field" placeholder="Customer Mobile Number *" maxLength={10} value={vehicleForm.mobileNo} onChange={e => setVehicleForm(f => ({ ...f, mobileNo: e.target.value.replace(/\D/, '') }))} />
                <select className="input-field" value={vehicleForm.vehicleCategory} onChange={e => setVehicleForm(f => ({ ...f, vehicleCategory: e.target.value }))}>
                  <option value="VC4">VC4 – Car / LMV</option>
                  <option value="VC5">VC5 – Jeep / Van</option>
                  <option value="VC6">VC6 – Mini Bus</option>
                  <option value="VC7">VC7 – Bus / Truck</option>
                  <option value="VC12">VC12 – 3-Axle Commercial</option>
                  <option value="VC15">VC15 – 4-Axle Commercial</option>
                  <option value="VC16">VC16 – Multi-Axle</option>
                </select>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="btn-primary w-full sm:w-auto" onClick={handleSendOtp} disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Sending OTP...' : 'Send OTP'} <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-white mb-2">Verify OTP</h2>
              <p className="text-gray-500 text-sm mb-6">Enter the 6-digit OTP sent to <span className="text-white font-medium">{vehicleForm.mobileNo}</span></p>
              <div className="flex gap-3 justify-center mb-6">
                {otpDigits.map((d, i) => (
                  <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                    value={d}
                    onChange={e => handleOtpDigit(e.target.value, i)}
                    onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && document.getElementById(`otp-${i - 1}`)?.focus()}
                    className="w-11 h-14 text-center text-xl font-bold rounded-xl bg-gray-800 border border-gray-700 text-white focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all" />
                ))}
              </div>
              {loading && <div className="flex justify-center mb-4"><Loader2 size={24} className="animate-spin text-brand-500" /></div>}
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={back}>Back</button>
                <button className="btn-primary flex-1" onClick={handleValidateOtp} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
              <button onClick={handleSendOtp} className="w-full text-center text-xs text-gray-500 hover:text-brand-400 mt-3 transition-colors">
                Resend OTP
              </button>
            </motion.div>
          )}

          {/* ── Step 3: KYC ── */}
          {step === 3 && needsWallet && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-white mb-1">Customer KYC</h2>
              <p className="text-gray-500 text-sm mb-5">New customer – create wallet before activation</p>
              {vehicleDetails && (
                <div className="bg-gray-800/60 rounded-xl p-3 mb-4 text-sm flex items-center gap-3">
                  <span className="text-brand-400 font-semibold">{vehicleDetails.vehicleNo || vehicleForm.chassisNo}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-400">{vehicleDetails.vehicleManuf} {vehicleDetails.model}</span>
                </div>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input className="input-field" placeholder="First Name *" value={kycForm.name} onChange={e => setKycForm(f => ({ ...f, name: e.target.value }))} />
                  <input className="input-field" placeholder="Last Name *" value={kycForm.lastName} onChange={e => setKycForm(f => ({ ...f, lastName: e.target.value }))} />
                </div>
                <input className="input-field" placeholder="Date of Birth (DD-MM-YYYY) *" value={kycForm.dob} onChange={e => setKycForm(f => ({ ...f, dob: e.target.value }))} />
                <select className="input-field" value={kycForm.docType} onChange={e => setKycForm(f => ({ ...f, docType: e.target.value }))}>
                  <option value="1">PAN Card</option>
                  <option value="2">Driving Licence (expiry required)</option>
                  <option value="3">Voter ID</option>
                  <option value="4">Passport (expiry required)</option>
                </select>
                <input className="input-field" placeholder="Document Number *" value={kycForm.docNo} onChange={e => setKycForm(f => ({ ...f, docNo: e.target.value }))} />
                {(kycForm.docType === '2' || kycForm.docType === '4') && (
                  <input className="input-field" placeholder="Expiry Date (DD-MM-YYYY) *" value={kycForm.expiryDate} onChange={e => setKycForm(f => ({ ...f, expiryDate: e.target.value }))} />
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1" onClick={back}>Back</button>
                <button className="btn-primary flex-1" onClick={handleCreateWallet} disabled={loading}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Creating Wallet...' : 'Create & Continue'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 4: Upload Docs ── */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-white mb-1">Upload Documents</h2>
              <p className="text-gray-500 text-sm mb-3">{requiredDocs.length === 1 ? 'Upload vehicle photo to proceed' : `Upload all ${requiredDocs.length} documents before activation`}</p>
              {vahanSuccess && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-green-900/20 border border-green-800/40 text-sm">
                  <CheckCircle size={14} className="text-green-400" />
                  <span className="text-green-400">Vahan verified</span>
                  <span className="text-gray-500">— fewer documents needed</span>
                </div>
              )}
              {!needsWallet && custDetails && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-brand-900/20 border border-brand-800/40 text-sm">
                  <CheckCircle size={14} className="text-brand-400" />
                  <span className="text-brand-400">Wallet exists</span>
                  <span className="text-gray-500">— KYC step skipped</span>
                </div>
              )}
              {vehicleDetails && (
                <div className="bg-gray-800/60 rounded-xl p-4 mb-5 text-sm">
                  <p className="text-brand-400 font-semibold mb-2">{vehicleDetails.vehicleNo || vehicleForm.chassisNo}</p>
                  <div className="grid grid-cols-2 gap-2 text-gray-400">
                    <span>Make: <span className="text-white">{vehicleDetails.vehicleManuf}</span></span>
                    <span>Model: <span className="text-white">{vehicleDetails.model}</span></span>
                    <span>Type: <span className="text-white">{vehicleDetails.type}</span></span>
                    <span>RTO: <span className={vehicleDetails.rtoStatus === 'ACTIVE' ? 'text-green-400' : 'text-amber-400'}>{vehicleDetails.rtoStatus}</span></span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {requiredDocs.map(imgType => {
                  const status = uploadProgress[imgType]
                  const done = uploads[imgType] !== undefined
                  return (
                    <label key={imgType} className={`relative flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200
                      ${done ? 'border-green-700 bg-green-900/20' : 'border-gray-700 bg-gray-800/50 hover:border-brand-700'}`}>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadFile(imgType, e.target.files[0])} />
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                        ${done ? 'bg-green-900/50' : 'bg-gray-700'}`}>
                        {status === 'uploading' ? <Loader2 size={16} className="animate-spin text-brand-400" />
                          : done ? <CheckCircle size={16} className="text-green-400" />
                          : status === 'error' ? <AlertCircle size={16} className="text-red-400" />
                          : <Upload size={16} className="text-gray-400" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${done ? 'text-green-400' : 'text-white'}`}>{UPLOAD_LABELS[imgType] || imgType}</p>
                        <p className="text-xs text-gray-500">{done ? 'Uploaded ✓' : status === 'uploading' ? 'Uploading...' : 'Click to upload'}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
              <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1" onClick={() => setStep(needsWallet ? 3 : 2)}>Back</button>
                <button className="btn-primary flex-1" onClick={handleUploadAllAndContinue} disabled={loading || !allDocsUploaded}>
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 5: Assign Tag ── */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-white mb-1">Assign FASTag</h2>
              <p className="text-gray-500 text-sm mb-5">Select a tag from your inventory to assign</p>
              {agentTags.length === 0
                ? <div className="text-center py-12 text-gray-500">
                    <Tag size={40} className="mx-auto mb-3 text-gray-700" />
                    <p>No tags in inventory</p>
                    <p className="text-xs mt-1">Contact admin to assign tags</p>
                  </div>
                : <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {agentTags.map(tag => (
                      <button key={tag._id} onClick={() => setSelectedTag(tag)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left
                          ${selectedTag?._id === tag._id ? 'border-brand-600 bg-brand-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'}`}>
                        <div>
                          <p className="font-mono text-sm text-white font-semibold">{tag.kitNo || tag.serialNo}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{tag.isBajaj ? 'Bajaj' : 'Livquick'} • {tag.tagClass || 'Standard'}</p>
                        </div>
                        {selectedTag?._id === tag._id && <CheckCircle size={18} className="text-brand-500" />}
                      </button>
                    ))}
                  </div>
              }
              <div className="flex gap-3 mt-6">
                <button className="btn-secondary flex-1" onClick={back}>Back</button>
                <button className="btn-primary flex-1" onClick={handleRegisterTag} disabled={loading || !selectedTag}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  {loading ? 'Activating...' : 'Activate FASTag'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 6: Success ── */}
          {step === 6 && (
            <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="w-20 h-20 bg-green-900/30 border-2 border-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-green-400" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">FASTag Activated!</h2>
                <p className="text-gray-500 mb-6">The FASTag has been successfully registered</p>
                {tagResult && (
                  <div className="bg-gray-800/60 rounded-2xl p-5 text-left space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Vehicle Number</span>
                      <span className="text-white font-mono font-semibold">{tagResult.vrn || vehicleDetails?.vehicleNo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tag Serial No</span>
                      <span className="text-white font-mono">{tagResult.serialNo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className="text-green-400 font-medium">{tagResult.npciStatus || 'Active'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Agent Balance</span>
                      <span className="text-white">₹{tagResult.agentBalance || '0'}</span>
                    </div>
                  </div>
                )}
                <button className="btn-primary w-full" onClick={handleReset}>
                  + New Registration
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
