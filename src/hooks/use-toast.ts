"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 2000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

// Smart toast function that auto-determines variant and duration
function toast({ duration, variant, title, description, ...props }: Toast) {
  // Smart variant detection if not provided
  let smartVariant = variant;
  let smartDuration = duration;
  
  if (!variant) {
    const textToAnalyze = (title || description || '').toString().toLowerCase();
    
    if (textToAnalyze.includes('thành công') || 
        textToAnalyze.includes('đã') || 
        textToAnalyze.includes('hoàn thành') ||
        textToAnalyze.includes('success')) {
      smartVariant = 'default'; // Success style
      smartDuration = smartDuration || 2000; // Shorter for success
    } else if (textToAnalyze.includes('lỗi') || 
               textToAnalyze.includes('thất bại') || 
               textToAnalyze.includes('error') ||
               textToAnalyze.includes('cảnh báo') ||
               textToAnalyze.includes('warning')) {
      smartVariant = 'destructive'; // Error style
      smartDuration = smartDuration || 3000; // Longer for errors
    } else {
      smartVariant = 'default';
      smartDuration = smartDuration || 2000; // Default 2 seconds
    }
  } else {
    // Set smart duration based on variant if not provided
    if (!smartDuration) {
      smartDuration = variant === 'destructive' ? 3000 : 2000;
    }
  }

  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      title,
      description,
      variant: smartVariant,
      open: true,
      duration: smartDuration,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }

// Smart toast helper functions for better UX
export const smartToast = {
  success: (message: string, options?: Partial<Toast>) => {
    return toast({
      title: "Thành công",
      description: message,
      variant: "default",
      duration: 2000,
      ...options
    });
  },
  
  error: (message: string, options?: Partial<Toast>) => {
    return toast({
      title: "Lỗi",
      description: message,
      variant: "destructive",
      duration: 3000,
      ...options
    });
  },
  
  warning: (message: string, options?: Partial<Toast>) => {
    return toast({
      title: "Cảnh báo",
      description: message,
      variant: "destructive",
      duration: 2500,
      ...options
    });
  },
  
  info: (message: string, options?: Partial<Toast>) => {
    return toast({
      title: "Thông tin",
      description: message,
      variant: "default",
      duration: 2000,
      ...options
    });
  }
}
