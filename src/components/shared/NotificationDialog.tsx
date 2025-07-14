
"use client";

import React, { useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface NotificationDialogProps {
  message: string | null;
  type?: "success" | "error";
  onClose: () => void;
}

export function NotificationDialog({ message, type = "error", onClose }: NotificationDialogProps) {
  const isSuccess = type === "success";

  // Auto-close success notifications after 2 seconds
  useEffect(() => {
    if (message && isSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message, isSuccess, onClose]);

  if (!message) return null;

  return (
    <AlertDialog open={!!message} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className={cn(
        "border-l-4 max-w-md",
        isSuccess ? "border-green-500 bg-green-50/50" : "border-destructive bg-red-50/50"
      )}>
        <AlertDialogHeader className="flex flex-row items-center space-x-3 space-y-0">
          {isSuccess ? (
            <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-destructive flex-shrink-0" />
          )}
          <div className="flex-1">
            <AlertDialogTitle className={cn(
              "text-lg font-semibold",
              isSuccess ? "text-green-700" : "text-destructive"
            )}>
              {isSuccess ? "Thành công!" : "Cảnh Báo"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-foreground mt-1">
              {message}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        {!isSuccess && (
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={onClose}
              className={cn(
                "w-full transition-colors",
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              )}
            >
              Đã hiểu
            </AlertDialogAction>
          </AlertDialogFooter>
        )}
        {isSuccess && (
          <AlertDialogFooter>
            <div className="text-sm text-green-600/80 text-center w-full">
              Tự động đóng sau 2 giây...
            </div>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

