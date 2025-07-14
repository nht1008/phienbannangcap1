# Kế hoạch Tái thiết kế Tab Doanh thu

Mục tiêu: Cải thiện giao diện người dùng cho tab "Doanh thu" bằng cách tổ chức lại các mục con thành dạng Tabs để dễ nhìn và điều hướng hơn, đồng thời bổ sung mục hiển thị "Phân Tích Hàng Bán Chậm".

## 1. Bổ sung Mục "Phân Tích Hàng Bán Chậm (Trong Kỳ)"

*   **Nguồn dữ liệu:** Sử dụng biến `sortedSlowMovingProductAnalysisData` đã có trong component [`appquanlycuahanghoa/src/components/tabs/RevenueTab.tsx`](appquanlycuahanghoa/src/components/tabs/RevenueTab.tsx).
*   **Hiển thị:** Dưới dạng một bảng (Table) chi tiết.
*   **Các cột dự kiến cho bảng:**
    *   STT
    *   Ảnh
    *   Tên Sản Phẩm
    *   Chi tiết SP (Màu, Chất lượng, K.Thước, ĐV)
    *   Tồn kho hiện tại (`currentStock`)
    *   Giá trị tồn kho (`stockValue`)
    *   Ngày bán cuối (`lastSaleDate`)
    *   Số ngày chưa bán (`daysSinceLastSale`)
    *   SL bán 30 ngày (`salesInLast30Days`)
    *   SL bán 60 ngày (`salesInLast60Days`)
    *   SL bán 90 ngày (`salesInLast90Days`)
    *   Gợi ý (`statusSuggestion`, nếu có)
*   **Chức năng:** Giữ lại và triển khai chức năng sắp xếp cho các cột của bảng này.

## 2. Tái cấu trúc các Mục thành Tabs

*   **Component sử dụng:** Dùng `<Tabs>`, `<TabsList>`, `<TabsTrigger>`, `<TabsContent>` từ [`appquanlycuahanghoa/src/components/ui/tabs.tsx`](appquanlycuahanghoa/src/components/ui/tabs.tsx).
*   **Các Tabs sẽ được tạo:**
    1.  **Top Sản Phẩm:** Nội dung từ Card "Top sản phẩm" hiện tại.
    2.  **Nhật Ký Loại Bỏ:** Nội dung từ Card "Nhật Ký Loại Bỏ Sản Phẩm (Trong Kỳ)" hiện tại.
    3.  **Phân Tích Hàng Chậm:** Nội dung là bảng "Phân Tích Hàng Bán Chậm" mới được tạo ở bước 1.
    4.  **Xử Lý Hàng Chậm:** Nội dung từ Card "Nhật Ký Xử Lý Hàng Bán Chậm (Đã gộp)" hiện tại.
*   **Vị trí:** Cụm Tabs này sẽ được đặt bên dưới phần bộ lọc ngày tháng, các thẻ tổng hợp doanh thu và biểu đồ doanh thu. Chi tiết hóa đơn sẽ vẫn nằm ngoài cụm Tabs.

## 3. Các thay đổi cụ thể trong `appquanlycuahanghoa/src/components/tabs/RevenueTab.tsx`

*   **Import các component Tabs:**
    ```typescript
    import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
    ```
*   **Tạo component/khối mã cho bảng "Phân Tích Hàng Bán Chậm":**
    *   Render một `<Table>` với các cột đã xác định.
    *   Lặp qua `sortedSlowMovingProductAnalysisData` để hiển thị dữ liệu.
    *   Đảm bảo định dạng dữ liệu phù hợp.
    *   Triển khai logic sắp xếp.
*   **Triển khai cấu trúc `<Tabs>`:**
    ```tsx
    <Tabs defaultValue="top-products" className="w-full">
      <TabsList className="grid w-full grid-cols-4"> {/* Hoặc số lượng tab tương ứng */}
        <TabsTrigger value="top-products">Top Sản Phẩm</TabsTrigger>
        <TabsTrigger value="disposal-log">Nhật Ký Loại Bỏ</TabsTrigger>
        <TabsTrigger value="slow-moving-analysis">Phân Tích Hàng Chậm</TabsTrigger>
        <TabsTrigger value="processed-slow-moving">Xử Lý Hàng Chậm</TabsTrigger>
      </TabsList>

      <TabsContent value="top-products">
        {/* Nội dung Card "Top sản phẩm" hiện tại */}
      </TabsContent>
      <TabsContent value="disposal-log">
        {/* Nội dung Card "Nhật Ký Loại Bỏ Sản Phẩm" hiện tại */}
      </TabsContent>
      <TabsContent value="slow-moving-analysis">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">Phân Tích Hàng Bán Chậm (Trong Kỳ)</CardTitle>
            <CardDescription>Phân tích chi tiết các sản phẩm bán chậm dựa trên dữ liệu bán hàng và tồn kho.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Component/Nội dung bảng "Phân Tích Hàng Bán Chậm" mới */}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="processed-slow-moving">
        {/* Nội dung Card "Nhật Ký Xử Lý Hàng Bán Chậm" hiện tại */}
      </TabsContent>
    </Tabs>
    ```
    *   Di chuyển nội dung của từng `<Card>` hiện tại vào bên trong `<TabsContent>` tương ứng, có thể giữ lại cấu trúc `<Card>`, `<CardHeader>`, `<CardContent>` bên trong mỗi `<TabsContent>` để duy trì giao diện thống nhất.

## 4. Sơ đồ Mermaid minh họa cấu trúc mới (đơn giản hóa)

```mermaid
graph TD
    A[RevenueTab Component] --> B{Bộ lọc Ngày tháng & Tổng hợp Doanh thu & Biểu đồ}
    B --> C{Tabs Container}
    C --> C1[TabsList: Danh sách các Tab]
    C1 --> T1(Tab: Top Sản Phẩm)
    C1 --> T2(Tab: Nhật Ký Loại Bỏ)
    C1 --> T3(Tab: Phân Tích Hàng Chậm)
    C1 --> T4(Tab: Xử Lý Hàng Chậm)

    C --> TC1[TabsContent: Top Sản Phẩm]
    TC1 --> CardTopSP[Card: Top Sản Phẩm Bán Chạy]
    CardTopSP --> TableTopSP[Bảng Top Sản Phẩm]

    C --> TC2[TabsContent: Nhật Ký Loại Bỏ]
    TC2 --> CardDisposal[Card: Nhật Ký Loại Bỏ SP]
    CardDisposal --> TableDisposal[Bảng Nhật Ký Loại Bỏ]

    C --> TC3[TabsContent: Phân Tích Hàng Chậm]
    TC3 --> CardSlowMoving[Card: Phân Tích Hàng Bán Chậm]
    CardSlowMoving --> TableSlowMoving[Bảng Phân Tích Hàng Bán Chậm (Mới)]

    C --> TC4[TabsContent: Xử Lý Hàng Chậm]
    TC4 --> CardProcessedSlow[Card: Nhật Ký Xử Lý Hàng Chậm]
    CardProcessedSlow --> TableProcessedSlow[Bảng Xử Lý Hàng Chậm]

    A --> D{Dialog Chi tiết Hóa đơn}
    A --> E{Dialog Xác nhận Xóa (Nhật ký loại bỏ)}