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
  uploadDocument, registerFastag,
  getBajajTags, getVehicleMake, getVehicleModel
} from '../services/api'
import SearchableSelect from '../components/SearchableSelect'
import { INDIAN_STATES, VEHICLE_COLOURS, FUEL_TYPES, VEHICLE_TYPES } from '../constants/vehicleData'

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
              ${state === 'active' ? 'bg-red-600 border-red-500 shadow-lg shadow-red-200' :
                state === 'done' ? 'bg-red-50 border-red-200' : 'bg-gray-100 border-gray-300'}`}>
              {state === 'done'
                ? <CheckCircle size={16} className="text-red-600" />
                : <Icon size={16} className={state === 'active' ? 'text-white' : 'text-gray-400'} />}
            </div>
            <span className={`text-[10px] font-medium hidden sm:block ${state === 'active' ? 'text-red-600' : 'text-gray-500'}`}>
              {s.title}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px w-8 md:w-16 mx-1 transition-all duration-500 ${
              current > s.id ? 'bg-red-300' : 'bg-gray-200'}`} />
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

  // Vehicle details edit form (for when Vahan fails / fields are incomplete)
  const [vehEdit, setVehEdit] = useState({
    vehicleManuf: '', model: '', vehicleColour: '', type: 'VC4', status: 'ACTIVE',
    npciStatus: 'ACTIVE', isCommercial: false, tagVehicleClassID: '4', npciVehicleClassID: '4',
    vehicleType: '', vehicleDescriptor: '', isNationalPermit: '2', permitExpiryDate: '',
    stateOfRegistration: '', rechargeAmount: '0', securityDeposit: '0', tagCost: '0',
  })
  const [makeList, setMakeList] = useState([])
  const [modelList, setModelList] = useState([])
  const [loadingMakes, setLoadingMakes] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)

  const next = () => setStep(s => Math.min(s + 1, 6))
  const back = () => setStep(s => Math.max(s - 1, 1))

  // Helper: pre-fill vehEdit from Vahan response (whatever fields Bajaj returned)
  const prefillVehEdit = (vrn) => {
    if (!vrn) return
    setVehEdit(prev => ({
      ...prev,
      vehicleManuf: vrn.vehicleManuf || '',
      model: vrn.model || '',
      vehicleColour: vrn.vehicleColour || '',
      type: vrn.type || vehicleForm.vehicleCategory || 'VC4',
      status: vrn.status || 'ACTIVE',
      npciStatus: vrn.npciStatus || 'ACTIVE',
      isCommercial: typeof vrn.isCommercial === 'string' ? vrn.isCommercial.toLowerCase() === 'true' : !!vrn.isCommercial,
      tagVehicleClassID: vrn.tagVehicleClassID || String(vrn.npciVehicleClassID || '4'),
      npciVehicleClassID: vrn.npciVehicleClassID || '4',
      vehicleType: vrn.vehicleType || '',
      vehicleDescriptor: vrn.vehicleDescriptor || '',
      isNationalPermit: vrn.isNationalPermit || '2',
      permitExpiryDate: vrn.permitExpiryDate || '',
      stateOfRegistration: vrn.stateOfRegistration || '',
      rechargeAmount: vrn.rechargeAmount || '0',
      securityDeposit: vrn.securityDeposit || '0',
      tagCost: vrn.tagCost || '0',
    }))
  }

  // Fetch vehicle makes from Bajaj API
  const fetchMakes = async () => {
    setLoadingMakes(true)
    try {
      const res = await getVehicleMake({ mobileNo: vehicleForm.mobileNo })
      const data = res.data?.vehicleMakeData?.vehicleMakerList || res.data?.vehicleMakerList || []
      setMakeList(Array.isArray(data) ? data : [])
    } catch { setMakeList([]) }
    finally { setLoadingMakes(false) }
  }

  // Fetch vehicle models for a selected maker
  const fetchModels = async (maker) => {
    if (!maker) return
    setLoadingModels(true)
    try {
      const res = await getVehicleModel({ mobileNo: vehicleForm.mobileNo, vehicleMake: maker, includePricingDetails: true })
      const data = res.data?.vehicleModelData?.modelList || res.data?.modelList || []
      setModelList(Array.isArray(data) ? data : [])
      // If pricing details come with it, update amounts
      const pricing = res.data?.vehicleModelData?.pricingDetails || res.data?.pricingDetails
      if (pricing) {
        setVehEdit(f => ({
          ...f,
          rechargeAmount: String(pricing.rechargeAmount || '0'),
          securityDeposit: String(pricing.securityDeposit || '0'),
          tagCost: String(pricing.tagCost || '0'),
        }))
      }
    } catch { setModelList([]) }
    finally { setLoadingModels(false) }
  }

  // Check if critical fields are missing (Vahan failed or incomplete)
  const hasIncompleteVehicleDetails = () => {
    return !vehEdit.vehicleManuf || !vehEdit.model || !vehEdit.vehicleColour || !vehEdit.vehicleDescriptor || !vehEdit.stateOfRegistration || !vehEdit.vehicleType
  }

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
      const res = await validateOtp({ validateOtpReq: { mobileNo: vehicleForm.mobileNo, otp: otpVal, sessionId, isChassis: mode === 'chassis' ? 1 : 0 } })
      const resp = res.data?.validateOtpResp
      if (!resp) throw new Error(res.data?.response?.errorDesc || 'OTP validation failed')
      setVahanSuccess(res.data?.vahanSuccess === true)
      setVehicleDetails(resp.vrnDetails)
      setCustDetails(resp.custDetails)
      prefillVehEdit(resp.vrnDetails)
      if (res.data?.vahanSuccess !== true) fetchMakes()
      const walletExists = resp.custDetails?.walletStatus && resp.custDetails?.walletStatus !== 'NE'
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
      const res = await validateOtp({ validateOtpReq: { mobileNo: vehicleForm.mobileNo, otp: otpVal, sessionId, isChassis: mode === 'chassis' ? 1 : 0 } })
      const resp = res.data?.validateOtpResp
      if (!resp) throw new Error(res.data?.response?.errorDesc || 'OTP validation failed')
      setVahanSuccess(res.data?.vahanSuccess === true)
      setVehicleDetails(resp.vrnDetails)
      setCustDetails(resp.custDetails)
      prefillVehEdit(resp.vrnDetails)
      if (res.data?.vahanSuccess !== true) fetchMakes()
      const walletExists = resp.custDetails?.walletStatus && resp.custDetails?.walletStatus !== 'NE'
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
        reqWallet: { sessionId, isChassis: mode === 'chassis' ? 1 : 0 },
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
      formData.append('isChassis', mode === 'chassis' ? '1' : '0')
      
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
      const res = await getBajajTags()
      const list = Array.isArray(res.data) ? res.data : res.data?.data || []
      setAgentTags(list)
    } catch { setAgentTags([]) }
  }

  const handleRegisterTag = async () => {
    if (!selectedTag) { toast.error('Please select a tag'); return }
    // Validate critical fields before calling Bajaj API
    if (!vehEdit.vehicleManuf || !vehEdit.model) { toast.error('Please fill Vehicle Manufacturer and Model'); return }
    if (!vehEdit.vehicleColour) { toast.error('Please fill Vehicle Colour'); return }
    if (!vehEdit.vehicleDescriptor) { toast.error('Please select Fuel Type'); return }
    if (!vehEdit.stateOfRegistration) { toast.error('Please select State of Registration'); return }
    if (!vehEdit.vehicleType) { toast.error('Please select Vehicle Type'); return }
    setLoading(true)
    try {
      const res = await registerFastag({
        isChassis: mode === 'chassis' ? 1 : 0,
        vrn: vehicleDetails?.vehicleNo || vehicleForm.vehicleNo,
        chassis: vehicleDetails?.chassisNo || vehicleForm.chassisNo,
        engine: vehicleDetails?.engineNo || vehicleForm.engineNo,
        vehicleManuf: vehEdit.vehicleManuf,
        model: vehEdit.model,
        vehicleColour: vehEdit.vehicleColour,
        type: vehEdit.type || vehicleForm.vehicleCategory || 'VC4',
        status: vehEdit.status || 'ACTIVE',
        npciStatus: vehEdit.npciStatus || 'ACTIVE',
        isCommercial: vehEdit.isCommercial,
        tagVehicleClassID: vehEdit.tagVehicleClassID || '4',
        npciVehicleClassID: vehEdit.npciVehicleClassID || '4',
        vehicleType: vehEdit.vehicleType || '',
        rechargeAmount: vehEdit.rechargeAmount || '0',
        securityDeposit: vehEdit.securityDeposit || '0',
        tagCost: vehEdit.tagCost || '0',
        vehicleDescriptor: vehEdit.vehicleDescriptor,
        isNationalPermit: vehEdit.isNationalPermit || '2',
        permitExpiryDate: vehEdit.permitExpiryDate || '',
        stateOfRegistration: vehEdit.stateOfRegistration,
        custName: custDetails?.name || '',
        custMobileNo: vehicleForm.mobileNo,
        walletId: custDetails?.walletId || '',
        serialNo: selectedTag.kitNo || selectedTag.serialNo,
        tid: selectedTag.tid || '',
        custId: custDetails?.custId || ''
      })
      if (!res.data?.success) throw new Error(res.data?.message || res.data?.response?.errorDesc || 'Registration failed')
      const result = res.data?.decryptedResponse?.tagRegistrationResp || res.data?.decryptedResponse || res.data
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
    setVehEdit({ vehicleManuf: '', model: '', vehicleColour: '', type: 'VC4', status: 'ACTIVE', npciStatus: 'ACTIVE', isCommercial: false, tagVehicleClassID: '4', npciVehicleClassID: '4', vehicleType: '', vehicleDescriptor: '', isNationalPermit: '2', permitExpiryDate: '', stateOfRegistration: '', rechargeAmount: '0', securityDeposit: '0', tagCost: '0' })
    setMakeList([]); setModelList([])
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New FASTag Registration</h1>
        <p className="text-gray-500 text-sm mt-1">Activate a new FASTag for your customer's vehicle</p>
      </motion.div>

      <div className="card">
        <StepIndicator steps={STEPS} current={step} />

        <AnimatePresence mode="wait">
          {/* ── Step 1: Vehicle ── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vehicle Details</h2>
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1 mb-5 w-fit">
                {[{ id: 'chassis', label: '🔩 Chassis Number' }, { id: 'vrn', label: '🚗 Vehicle Number' }].map(m => (
                  <button key={m.id} onClick={() => setMode(m.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${mode === m.id ? 'bg-red-600 text-white shadow' : 'text-gray-500 hover:text-gray-800'}`}>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Verify OTP</h2>
              <p className="text-gray-500 text-sm mb-6">Enter the 6-digit OTP sent to <span className="text-gray-900 font-medium">{vehicleForm.mobileNo}</span></p>
              <div className="flex gap-3 justify-center mb-6">
                {otpDigits.map((d, i) => (
                  <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                    value={d}
                    onChange={e => handleOtpDigit(e.target.value, i)}
                    onKeyDown={e => e.key === 'Backspace' && !d && i > 0 && document.getElementById(`otp-${i - 1}`)?.focus()}
                    className="w-11 h-14 text-center text-xl font-bold rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all" />
                ))}
              </div>
              {loading && <div className="flex justify-center mb-4"><Loader2 size={24} className="animate-spin text-red-500" /></div>}
              <div className="flex gap-3">
                <button className="btn-secondary flex-1" onClick={back}>Back</button>
                <button className="btn-primary flex-1" onClick={handleValidateOtp} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
              <button onClick={handleSendOtp} className="w-full text-center text-xs text-gray-500 hover:text-red-500 mt-3 transition-colors">
                Resend OTP
              </button>
            </motion.div>
          )}

          {/* ── Step 3: KYC ── */}
          {step === 3 && needsWallet && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Customer KYC</h2>
              <p className="text-gray-500 text-sm mb-5">New customer – create wallet before activation</p>
              {vehicleDetails && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 text-sm flex items-center gap-3">
                  <span className="text-red-600 font-semibold">{vehicleDetails.vehicleNo || vehicleForm.chassisNo}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{vehicleDetails.vehicleManuf} {vehicleDetails.model}</span>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Upload Documents</h2>
              <p className="text-gray-500 text-sm mb-3">{requiredDocs.length === 1 ? 'Upload vehicle photo to proceed' : `Upload all ${requiredDocs.length} documents before activation`}</p>
              {vahanSuccess && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-sm">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-green-700">Vahan verified</span>
                  <span className="text-gray-500">— fewer documents needed</span>
                </div>
              )}
              {!needsWallet && custDetails && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-sm">
                  <CheckCircle size={14} className="text-red-500" />
                  <span className="text-red-600">Wallet exists</span>
                  <span className="text-gray-500">— KYC step skipped</span>
                </div>
              )}
              {vehicleDetails && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-sm">
                  <p className="text-red-600 font-semibold mb-2">{vehicleDetails.vehicleNo || vehicleForm.chassisNo}</p>
                  <div className="grid grid-cols-2 gap-2 text-gray-500">
                    <span>Make: <span className="text-gray-800">{vehicleDetails.vehicleManuf}</span></span>
                    <span>Model: <span className="text-gray-800">{vehicleDetails.model}</span></span>
                    <span>Type: <span className="text-gray-800">{vehicleDetails.type}</span></span>
                    <span>RTO: <span className={vehicleDetails.rtoStatus === 'ACTIVE' ? 'text-green-600' : 'text-amber-600'}>{vehicleDetails.rtoStatus}</span></span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {requiredDocs.map(imgType => {
                  const status = uploadProgress[imgType]
                  const done = uploads[imgType] !== undefined
                  return (
                    <label key={imgType} className={`relative flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200
                      ${done ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50 hover:border-red-300'}`}>
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleUploadFile(imgType, e.target.files[0])} />
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                        ${done ? 'bg-green-100' : 'bg-gray-200'}`}>
                        {status === 'uploading' ? <Loader2 size={16} className="animate-spin text-red-500" />
                          : done ? <CheckCircle size={16} className="text-green-600" />
                          : status === 'error' ? <AlertCircle size={16} className="text-red-500" />
                          : <Upload size={16} className="text-gray-400" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${done ? 'text-green-700' : 'text-gray-800'}`}>{UPLOAD_LABELS[imgType] || imgType}</p>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Assign FASTag</h2>
              <p className="text-gray-500 text-sm mb-5">Review vehicle details, select a tag, and activate</p>

              {/* ── Vehicle Details Review / Edit ── */}
              {hasIncompleteVehicleDetails() && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm">
                  <AlertCircle size={14} className="text-amber-600" />
                  <span className="text-amber-700">Vehicle details incomplete — please fill the missing fields below</span>
                </div>
              )}
              <details open={hasIncompleteVehicleDetails()} className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
                <summary className="px-4 py-3 bg-gray-50 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                  <Car size={14} /> Vehicle Details {hasIncompleteVehicleDetails() ? <span className="text-red-500 text-xs">(* required fields missing)</span> : <span className="text-green-600 text-xs">(✓ complete)</span>}
                </summary>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Manufacturer — searchable, from Bajaj API or typed */}
                    <SearchableSelect
                      label="Manufacturer" required allowCustom
                      placeholder="Search or type manufacturer..."
                      options={makeList.map(m => { const v = typeof m === 'string' ? m : m.vehicleMake || m.name; return { value: v, label: v } })}
                      value={vehEdit.vehicleManuf}
                      onChange={v => { setVehEdit(f => ({ ...f, vehicleManuf: v, model: '' })); setModelList([]); if (v) fetchModels(v) }}
                    />
                    {/* Model — searchable, from Bajaj API or typed */}
                    <SearchableSelect
                      label="Model" required allowCustom
                      placeholder="Search or type model..."
                      options={modelList.map(m => { const v = typeof m === 'string' ? m : m.model || m.name; return { value: v, label: v } })}
                      value={vehEdit.model}
                      onChange={v => setVehEdit(f => ({ ...f, model: v }))}
                    />
                    {/* Colour — searchable with common colours, agent can type custom */}
                    <SearchableSelect
                      label="Colour" required allowCustom
                      placeholder="Search colour..."
                      options={VEHICLE_COLOURS}
                      value={vehEdit.vehicleColour}
                      onChange={v => setVehEdit(f => ({ ...f, vehicleColour: v }))}
                    />
                    {/* Fuel Type — searchable, no default, agent must pick */}
                    <SearchableSelect
                      label="Fuel Type" required
                      placeholder="Select fuel type..."
                      options={FUEL_TYPES}
                      value={vehEdit.vehicleDescriptor}
                      onChange={v => setVehEdit(f => ({ ...f, vehicleDescriptor: v }))}
                    />
                    {/* State of Registration — searchable with all Indian states (code sent) */}
                    <SearchableSelect
                      label="State of Registration" required
                      placeholder="Search state..."
                      options={INDIAN_STATES}
                      value={vehEdit.stateOfRegistration}
                      onChange={v => setVehEdit(f => ({ ...f, stateOfRegistration: v }))}
                    />
                    {/* Vehicle Type — searchable */}
                    <SearchableSelect
                      label="Vehicle Type" required
                      placeholder="Select vehicle type..."
                      options={VEHICLE_TYPES}
                      value={vehEdit.vehicleType}
                      onChange={v => setVehEdit(f => ({ ...f, vehicleType: v }))}
                    />
                    {/* Is Commercial */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Commercial Vehicle</label>
                      <select className="input-field text-sm" value={vehEdit.isCommercial ? 'true' : 'false'}
                        onChange={e => setVehEdit(f => ({ ...f, isCommercial: e.target.value === 'true' }))}>
                        <option value="false">No (Private)</option>
                        <option value="true">Yes (Commercial)</option>
                      </select>
                    </div>
                    {/* National Permit */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">National Permit</label>
                      <select className="input-field text-sm" value={vehEdit.isNationalPermit}
                        onChange={e => setVehEdit(f => ({ ...f, isNationalPermit: e.target.value }))}>
                        <option value="2">No</option>
                        <option value="1">Yes</option>
                      </select>
                    </div>
                    {vehEdit.isNationalPermit === '1' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Permit Expiry (DD/MM/YYYY)</label>
                        <input className="input-field text-sm" placeholder="DD/MM/YYYY" value={vehEdit.permitExpiryDate}
                          onChange={e => setVehEdit(f => ({ ...f, permitExpiryDate: e.target.value }))} />
                      </div>
                    )}
                  </div>
                </div>
              </details>

              {/* ── Tag Selection ── */}
              {agentTags.length === 0
                ? <div className="text-center py-12 text-gray-400">
                    <Tag size={40} className="mx-auto mb-3 text-gray-300" />
                    <p>No tags in inventory</p>
                    <p className="text-xs mt-1">Contact admin to assign tags</p>
                  </div>
                : <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {agentTags.map(tag => (
                      <button key={tag._id} onClick={() => setSelectedTag(tag)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left
                          ${selectedTag?._id === tag._id ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                        <div>
                          <p className="font-mono text-sm text-gray-800 font-semibold">{tag.kitNo || tag.serialNo}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Bajaj • {tag.tagClass || 'Standard'}</p>
                        </div>
                        {selectedTag?._id === tag._id && <CheckCircle size={18} className="text-red-500" />}
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
                  className="w-20 h-20 bg-green-50 border-2 border-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle size={40} className="text-green-500" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">FASTag Activated!</h2>
                <p className="text-gray-500 mb-6">The FASTag has been successfully registered</p>
                {tagResult && (
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-left space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Vehicle Number</span>
                      <span className="text-gray-800 font-mono font-semibold">{tagResult.vrn || vehicleDetails?.vehicleNo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tag Serial No</span>
                      <span className="text-gray-800 font-mono">{tagResult.serialNo}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className="text-green-600 font-medium">{tagResult.npciStatus || 'Active'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Agent Balance</span>
                      <span className="text-gray-800">₹{tagResult.agentBalance || '0'}</span>
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
