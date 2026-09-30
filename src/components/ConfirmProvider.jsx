import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'

const ConfirmContext = createContext(null)

// Platform-styled replacement for window.confirm().
// Usage: const confirm = useConfirm(); if (!(await confirm('Delete this?'))) return
// Options: confirm({ title, message, confirmText, cancelText, tone: 'primary' | 'danger' })
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)
  const resolver = useRef(null)

  const confirm = useCallback((opts = {}) => {
    const options = typeof opts === 'string' ? { title: opts } : opts
    return new Promise((resolve) => {
      resolver.current = resolve
      setState({
        title: options.title || 'Are you sure?',
        message: options.message || '',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        tone: options.tone || 'danger',
      })
    })
  }, [])

  const close = (result) => {
    setState(null)
    if (resolver.current) {
      resolver.current(result)
      resolver.current = null
    }
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    state.tone === 'danger' ? 'bg-red-50 text-red-500' : 'bg-primary/10 text-primary'
                  }`}
                >
                  <FiAlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-gray-900">{state.title}</h3>
                  {state.message && (
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{state.message}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => close(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                {state.cancelText}
              </button>
              <button
                onClick={() => close(true)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors ${
                  state.tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'
                }`}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider')
  return ctx
}
