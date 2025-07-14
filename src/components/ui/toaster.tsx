"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  const getToastIcon = (variant?: string | null, title?: any, description?: any) => {
    const textToAnalyze = (title || description || '').toString().toLowerCase();
    
    if (variant === 'destructive' || 
        textToAnalyze.includes('lỗi') || 
        textToAnalyze.includes('thất bại') || 
        textToAnalyze.includes('cảnh báo')) {
      return <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
    } else if (textToAnalyze.includes('thành công') || 
               textToAnalyze.includes('đã') || 
               textToAnalyze.includes('hoàn thành')) {
      return <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
    } else {
      return <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
    }
  }

  return (
    <ToastProvider duration={2000}>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = getToastIcon(variant, title, description)
        
        return (
          <Toast key={id} variant={variant} {...props} className={cn(
            "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all duration-300 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
            "backdrop-blur-sm bg-background/95 border-border/20"
          )}>
            {icon}
            <div className="grid gap-1 flex-1">
              {title && (
                <ToastTitle className={cn(
                  "text-sm font-semibold",
                  variant === 'destructive' ? "text-destructive" : 
                  title?.toString().toLowerCase().includes('thành công') ? "text-green-600" : 
                  "text-foreground"
                )}>{title}</ToastTitle>
              )}
              {description && (
                <ToastDescription className="text-sm text-muted-foreground">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
              <X className="h-4 w-4" />
            </ToastClose>
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
