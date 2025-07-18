# Hướng Dẫn Thay Đổi Hình Ảnh Hoa Bay (Floating Flowers)

## 📁 Thư Mục Hình Ảnh

Để thay đổi hình ảnh hoa bay trên trang đăng nhập, bạn cần tải hình ảnh vào thư mục:

```
public/floating-flowers/
```

## 🖼️ Tên File Được Hỗ Trợ

Hệ thống hiện tại hỗ trợ các file sau trong thư mục floating-flowers:

1. `flower1.png` - Hình hoa thứ 1
2. `flower2.png` - Hình hoa thứ 2
3. `flower3.png` - Hình hoa thứ 3
4. `flower4.png` - Hình hoa thứ 4
5. `flower5.png` - Hình hoa thứ 5
6. `flower6.png` - Hình hoa thứ 6
7. `flower7.png` - Hình hoa thứ 7
8. `flower8.png` - Hình hoa thứ 8

## 📋 Yêu Cầu Kỹ Thuật

**Kích thước khuyến nghị:**

- 48x48px đến 96x96px
- Tỷ lệ 1:1 (vuông)

**Định dạng file:**

- PNG (khuyến nghị) - hỗ trợ background trong suốt
- SVG - vector, có thể scale tốt
- JPG/WEBP - nếu không cần background trong suốt

**Dung lượng:**

- < 50KB mỗi file để tối ưu performance

**Background:**

- Nên sử dụng background trong suốt (transparent)
- Tránh background trắng hoặc có màu

## 🎨 Mẹo Thiết Kế

1. **Style phù hợp:**

   - Vector graphics hoặc line art
   - Màu sắc nhẹ nhàng, pastel
   - Thiết kế đơn giản, không quá chi tiết

2. **Tối ưu cho animation:**

   - Hình ảnh có thể xoay mà vẫn đẹp
   - Không có text hoặc chi tiết định hướng
   - Cân bằng về visual weight

3. **Brand consistency:**
   - Phù hợp với tone màu của website
   - Thể hiện được tính chất hoa tươi
   - Tạo cảm giác nhẹ nhàng, thư giãn

## 🔄 Fallback System

Nếu không có file hình ảnh hoặc file bị lỗi, hệ thống sẽ tự động fallback về emoji:

- flower1.png → 🌸
- flower2.png → 🌺
- flower3.png → 🌻
- flower4.png → 🌷
- flower5.png → 🌹
- flower6.png → 💐
- flower7.png → 🌼
- flower8.png → 🌿

## 🚀 Hiệu Ứng Animation

Hình ảnh sẽ có các hiệu ứng:

- **Float:** Bay lên xuống nhẹ nhàng
- **Rotate:** Xoay nhẹ qua lại
- **Opacity:** Độ mờ 20% để không làm rối background
- **Random timing:** Mỗi hoa có tốc độ khác nhau
- **Random position:** Vị trí ngẫu nhiên trên toàn màn hình

## 📱 Responsive

- **Desktop:** 48x48px
- **Mobile:** 32x32px
- Tự động scale theo màn hình

## ⚙️ Tùy Chỉnh Nâng Cao

Nếu muốn thay đổi số lượng hoa bay hoặc tốc độ animation, chỉnh sửa trong file:

```
src/components/animations/FloatingFlowers.tsx
```

- Số lượng hoa: Thay đổi `Array(20)` thành số khác
- Tốc độ: Thay đổi `animationDuration`
- Vị trí: Thay đổi `Math.random() * 100`
