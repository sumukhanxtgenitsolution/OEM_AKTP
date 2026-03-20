import axios from 'axios'
import { Production_URL } from './config'

const api = axios.create({
  baseURL: Production_URL,
  timeout: 30000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('oem_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    // Backend wraps Bajaj responses under apiResponse – flatten for frontend
    if (res.data?.apiResponse) {
      const { apiResponse, ...rest } = res.data
      res.data = { ...rest, ...apiResponse }
    }
    return res
  },
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('oem_token')
      localStorage.removeItem('oem_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============ AUTH ============
export const agentLogin = (email, password) =>
  api.post('/api/agent/agentLogin', { email, password })

// ============ BAJAJ ============
export const sendOtp = (payload) =>
  api.post('/api/bajaj/customer/send-otp', payload)

export const validateOtp = (payload) =>
  api.post('/api/bajaj/customer/validate-otp', payload)

export const createWallet = (payload) =>
  api.post('/api/bajaj/customer/create-wallet', payload)

export const getVehicleMake = (payload) =>
  api.post('/api/bajaj/customer/vehicle-make', payload)

export const getVehicleModel = (payload) =>
  api.post('/api/bajaj/customer/vehicle-model', payload)

export const uploadDocument = (formData) =>
  api.post('/api/bajaj/upload/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const registerFastag = (payload) =>
  api.post('/api/bajaj/customer/fasttag-registration', payload)

export const replaceTag = (payload) =>
  api.post('/api/bajaj/customer/replace-tag', payload)

export const checkTagStatus = (payload) =>
  api.post('/api/bajaj/customer/tag-status', payload)

export const updateVRN = (payload) =>
  api.post('/api/bajaj/customer/update-vrn', payload)

// ============ TAGS (INVENTORY) ============
export const getAgentTags = () =>
  api.post('/api/tags/agent')

export const getBajajTags = () =>
  api.post('/api/tags/bajaj-tags')

// ============ BAJAJ REPLACEMENT (uses REP agent) ============
export const sendOtpReplacement = (payload) =>
  api.post('/api/bajaj/customer/tag-rep-send-otp', payload)

export const validateOtpReplacement = (payload) =>
  api.post('/api/bajaj/customer/tag-rep-validate-otp', payload)

// ============ REPORTS ============
export const getSaleReport = (payload) =>
  api.post('/api/report/sale-report', payload)

// ============ PROFILE ============
export const getAgentProfile = () =>
  api.get('/api/agent/profile')

export const changePassword = (payload) =>
  api.post('/api/agent/change-password', payload)

export default api
