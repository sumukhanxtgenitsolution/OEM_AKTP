import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Car, RefreshCw, Package,
  BarChart2, User, LogOut, Menu, X, ChevronRight, Zap
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/registration', icon: Car, label: 'New FASTag' },
  { to: '/replacement', icon: RefreshCw, label: 'Replacement' },
  { to: '/inventory', icon: Package, label: 'Tag Inventory' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed h-full z-30">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center red-glow">
              <Zap className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div>
              <p className="font-display font-bold text-gray-900 text-sm leading-tight">AK Toll Park</p>
              <p className="text-red-500 text-xs font-medium">OEM Portal</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 font-bold text-sm">{user?.name?.[0]?.toUpperCase() || 'A'}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-gray-900 text-sm font-medium truncate">{user?.name || 'Agent'}</p>
              <p className="text-gray-400 text-xs truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
            <p className="text-gray-500 text-xs mb-1">Wallet Balance</p>
            <p className="text-gray-900 font-bold text-lg">₹{(user?.wallet || 0).toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-700'}`} size={18} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-white/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="btn-ghost w-full text-red-500 hover:text-red-600 hover:bg-red-50">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-overlay lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 lg:hidden flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-4.5 h-4.5 text-white" size={18} fill="currentColor" />
                </div>
                <div>
                  <p className="font-display font-bold text-gray-900 text-sm">AK Toll Park</p>
                  <p className="text-red-500 text-xs">OEM Portal</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={18} />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                  <span className="text-red-600 font-bold text-sm">{user?.name?.[0]?.toUpperCase() || 'A'}</span>
                </div>
                <div>
                  <p className="text-gray-900 text-sm font-medium">{user?.name}</p>
                  <p className="text-gray-400 text-xs">₹{(user?.wallet || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-red-600 text-white'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
              <button onClick={handleLogout} className="btn-ghost w-full text-red-500 hover:text-red-600">
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
          >
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          {/* Mobile wallet */}
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl">
            <span className="text-red-600 text-xs font-medium">₹{(user?.wallet || 0).toLocaleString('en-IN')}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
