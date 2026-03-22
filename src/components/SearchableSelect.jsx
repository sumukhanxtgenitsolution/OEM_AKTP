import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

/**
 * Searchable dropdown select component.
 * Props:
 *   options: [{ value, label }]  — list of options
 *   value: string                — currently selected value
 *   onChange: (value) => void
 *   placeholder: string
 *   label: string                — field label (optional)
 *   required: boolean
 *   disabled: boolean
 *   allowCustom: boolean         — allow typing a custom value not in list
 */
export default function SearchableSelect({
  options = [], value = '', onChange, placeholder = 'Select...', label,
  required, disabled, allowCustom = false, className = '',
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search when opened
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus() }, [open])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    o.value.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLabel = options.find(o => o.value === value)?.label || value || ''

  const handleSelect = (val) => {
    onChange(val)
    setSearch('')
    setOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <label className="text-xs text-gray-500 mb-1 block">{label}{required && ' *'}</label>}
      <button type="button" disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`input-field text-sm w-full text-left flex items-center justify-between gap-1 ${!value ? 'text-gray-400' : 'text-gray-800'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <span className="truncate flex-1">{selectedLabel || placeholder}</span>
        <span className="flex items-center gap-1 shrink-0">
          {value && !disabled && <X size={12} className="text-gray-400 hover:text-gray-600" onClick={handleClear} />}
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden" style={{ maxHeight: '260px' }}>
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg">
              <Search size={13} className="text-gray-400 shrink-0" />
              <input ref={inputRef} type="text" className="w-full bg-transparent text-sm outline-none placeholder-gray-400"
                placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && filtered.length === 1) handleSelect(filtered[0].value)
                  if (e.key === 'Enter' && allowCustom && filtered.length === 0 && search.trim()) {
                    handleSelect(search.trim().toUpperCase())
                  }
                  if (e.key === 'Escape') setOpen(false)
                }} />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto" style={{ maxHeight: '200px' }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs text-gray-400">
                {allowCustom && search.trim() ? (
                  <button type="button" className="text-red-600 font-medium hover:underline"
                    onClick={() => handleSelect(search.trim().toUpperCase())}>
                    Use "{search.trim().toUpperCase()}"
                  </button>
                ) : 'No matches found'}
              </div>
            ) : (
              filtered.map(o => (
                <button key={o.value} type="button"
                  onClick={() => handleSelect(o.value)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-red-50 transition-colors flex items-center justify-between
                    ${o.value === value ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'}`}>
                  <span>{o.label}</span>
                  {o.value !== o.label && <span className="text-xs text-gray-400 ml-2">{o.value}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
