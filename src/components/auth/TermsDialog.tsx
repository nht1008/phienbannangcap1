import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TermsDialogProps {
  children: React.ReactNode;
}

export function TermsDialog({ children }: TermsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Điều khoản và Điều kiện</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 text-sm max-h-[60vh] overflow-y-auto pr-4">
          <p><strong>Ngày có hiệu lực: 27 tháng 6 năm 2025</strong></p>
          <p>Vui lòng đọc kỹ các Điều khoản và Điều kiện ("Điều khoản") này trước khi sử dụng dịch vụ của chúng tôi. Việc bạn truy cập và sử dụng Dịch vụ phụ thuộc vào việc bạn chấp nhận và tuân thủ các Điều khoản này. Các Điều khoản này áp dụng cho tất cả khách truy cập, người dùng và những người khác truy cập hoặc sử dụng Dịch vụ.</p>
          
          <h2 className="text-lg font-semibold">1. Định nghĩa</h2>
          <p><strong>"Dịch vụ"</strong> có nghĩa là trang web, ứng dụng di động và các dịch vụ liên quan do chúng tôi cung cấp.<br/>
          <strong>"Người dùng"</strong>, <strong>"Bạn"</strong> có nghĩa là cá nhân hoặc tổ chức truy cập hoặc sử dụng Dịch vụ.</p>

          <h2 className="text-lg font-semibold">2. Tài khoản Người dùng</h2>
          <p>Khi tạo tài khoản, bạn đảm bảo rằng thông tin bạn cung cấp là chính xác, đầy đủ và cập nhật. Bạn chịu trách nhiệm bảo mật mật khẩu của mình và cho bất kỳ hoạt động nào xảy ra dưới tài khoản của bạn. Bạn phải thông báo cho chúng tôi ngay lập tức khi phát hiện bất kỳ vi phạm bảo mật hoặc sử dụng trái phép tài khoản của bạn.</p>

          <h2 className="text-lg font-semibold">3. Quyền sở hữu trí tuệ</h2>
          <p>Dịch vụ và nội dung gốc, các tính năng và chức năng của nó là và sẽ vẫn là tài sản độc quyền của chúng tôi và các nhà cấp phép của chúng tôi. Dịch vụ được bảo vệ bởi bản quyền, nhãn hiệu và các luật khác của cả Việt Nam và các quốc gia nước ngoài.</p>

          <h2 className="text-lg font-semibold">4. Hành vi bị cấm</h2>
          <p>Bạn đồng ý không sử dụng Dịch vụ để:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Vi phạm bất kỳ luật hoặc quy định hiện hành nào.</li>
            <li>Gửi hoặc truyền bá bất kỳ tài liệu nào có tính chất lừa đảo, phỉ báng, tục tĩu hoặc gây khó chịu.</li>
            <li>Tham gia vào bất kỳ hành vi nào hạn chế hoặc cản trở việc sử dụng hoặc hưởng thụ Dịch vụ của bất kỳ ai.</li>
            <li>Sử dụng bất kỳ robot, spider hoặc thiết bị, quy trình hoặc phương tiện tự động nào khác để truy cập Dịch vụ cho bất kỳ mục đích nào.</li>
          </ul>

          <h2 className="text-lg font-semibold">5. Chấm dứt tài khoản</h2>
          <p>Chúng tôi có thể chấm dứt hoặc đình chỉ tài khoản của bạn ngay lập tức, không cần thông báo trước hoặc chịu trách nhiệm pháp lý, vì bất kỳ lý do gì, bao gồm nhưng không giới hạn nếu bạn vi phạm các Điều khoản. Khi chấm dứt, quyền sử dụng Dịch vụ của bạn sẽ ngay lập tức chấm dứt.</p>

          <h2 className="text-lg font-semibold">6. Giới hạn trách nhiệm</h2>
          <p>Trong mọi trường hợp, chúng tôi, cũng như các giám đốc, nhân viên, đối tác, đại lý, nhà cung cấp hoặc chi nhánh của chúng tôi, sẽ không chịu trách nhiệm cho bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, do hậu quả hoặc trừng phạt nào, bao gồm nhưng không giới hạn ở việc mất lợi nhuận, dữ liệu, việc sử dụng, thiện chí, hoặc các tổn thất vô hình khác.</p>

          <h2 className="text-lg font-semibold">7. Sửa đổi Điều khoản</h2>
          <p>Chúng tôi có quyền, theo quyết định riêng của mình, sửa đổi hoặc thay thế các Điều khoản này bất cứ lúc nào. Bằng cách tiếp tục truy cập hoặc sử dụng Dịch vụ của chúng tôi sau khi các sửa đổi đó có hiệu lực, bạn đồng ý bị ràng buộc bởi các điều khoản đã sửa đổi.</p>

          <h2 className="text-lg font-semibold">8. Luật pháp điều chỉnh</h2>
          <p>Các Điều khoản này sẽ được điều chỉnh và giải thích theo luật pháp của Việt Nam, không tính đến các xung đột về quy định pháp luật.</p>

          <h2 className="text-lg font-semibold">9. Chính sách Bảo mật</h2>
          <p>Việc bạn sử dụng Dịch vụ cũng tuân theo Chính sách Bảo mật của chúng tôi. Vui lòng xem lại Chính sách Bảo mật của chúng tôi để biết thông tin về cách chúng tôi thu thập, sử dụng và tiết lộ thông tin.</p>

        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Đóng</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}