import { toast as hotToast, ToastOptions } from 'react-hot-toast'

const baseToastStyle = {
  border: '3px solid #0B1D33',
  boxShadow: '6px 6px 0 #0B1D33',
  borderRadius: '0px',
  fontFamily: "'Space Grotesk', sans-serif",
  fontWeight: '700',
  fontSize: '14px',
  padding: '12px 18px',
  color: '#0B1D33',
}

export const toast = {
  success: (message: string, options?: ToastOptions) =>
    hotToast.success(message, {
      ...options,
      style: {
        ...baseToastStyle,
        backgroundColor: '#7EE3C9', // aurora-mint
        color: '#0B1D33',
        ...options?.style,
      },
      iconTheme: {
        primary: '#0B1D33',
        secondary: '#7EE3C9',
      },
    }),

  error: (message: string, options?: ToastOptions) =>
    hotToast.error(message, {
      ...options,
      style: {
        ...baseToastStyle,
        backgroundColor: '#FF7A8A', // soft-coral
        color: '#0B1D33',
        ...options?.style,
      },
      iconTheme: {
        primary: '#0B1D33',
        secondary: '#FF7A8A',
      },
    }),

  info: (message: string, options?: ToastOptions) =>
    hotToast(message, {
      ...options,
      style: {
        ...baseToastStyle,
        backgroundColor: '#8EC9F5', // aurora-blue
        color: '#0B1D33',
        ...options?.style,
      },
    }),

  loading: (message: string, options?: ToastOptions) =>
    hotToast.loading(message, {
      ...options,
      style: {
        ...baseToastStyle,
        backgroundColor: '#F2F8FD', // frost
        color: '#0B1D33',
        ...options?.style,
      },
    }),

  dismiss: (toastId?: string) => hotToast.dismiss(toastId),
}
