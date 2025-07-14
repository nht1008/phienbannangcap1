"use client";

import { Button } from "@/components/ui/button";
import { useToast, smartToast } from "@/hooks/use-toast";

export function ToastDemo() {
  const { toast } = useToast();

  return (
    <div className="space-y-4 p-4">
      <h3 className="text-lg font-semibold">Demo Hệ Thống Thông Báo Thông Minh</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => {
            smartToast.success("Đã lưu thành công!");
          }}
          variant="default"
          className="bg-green-600 hover:bg-green-700"
        >
          Thành Công (2s)
        </Button>

        <Button
          onClick={() => {
            smartToast.error("Không thể kết nối đến server!");
          }}
          variant="destructive"
        >
          Lỗi (3s)
        </Button>

        <Button
          onClick={() => {
            smartToast.warning("Hãy kiểm tra thông tin trước khi tiếp tục!");
          }}
          variant="outline"
          className="border-orange-500 text-orange-600 hover:bg-orange-50"
        >
          Cảnh Báo (2.5s)
        </Button>

        <Button
          onClick={() => {
            smartToast.info("Có 3 tin nhắn mới!");
          }}
          variant="outline"
          className="border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          Thông Tin (2s)
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Auto Smart Detection",
              description: "Thành công cập nhật dữ liệu!", // Auto detects as success
            });
          }}
          variant="secondary"
        >
          Smart Auto (Thành công)
        </Button>

        <Button
          onClick={() => {
            toast({
              title: "Auto Smart Detection", 
              description: "Lỗi kết nối mạng!", // Auto detects as error
            });
          }}
          variant="secondary"
        >
          Smart Auto (Lỗi)
        </Button>
      </div>

      <div className="text-sm text-muted-foreground">
        <p><strong>Tính năng thông minh:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Tự động phát hiện loại thông báo từ nội dung</li>
          <li>Thông báo thành công: 2 giây (màu xanh)</li>
          <li>Thông báo lỗi: 3 giây (màu đỏ)</li>
          <li>Thông báo cảnh báo: 2.5 giây (màu cam)</li>
          <li>Icon tự động phù hợp với nội dung</li>
          <li>Hiệu ứng smooth và backdrop blur</li>
        </ul>
      </div>
    </div>
  );
}
