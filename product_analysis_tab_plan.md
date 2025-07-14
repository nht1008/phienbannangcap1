# Kế hoạch Thêm Tab "Phân tích Sản phẩm"

**Tên tab:** Phân tích Sản phẩm
**Biểu tượng:** `BarChartBig` (từ Lucide React)
**Nội dung:** Hiển thị sản phẩm bán chạy và xu hướng bán hàng.
**Quyền truy cập:** Chỉ dành cho vai trò "Quản lý" và "ADMIN".

---

### **Kế hoạch Chi tiết**

Sẽ có hai giai đoạn chính:

**Giai đoạn 1: Chỉnh sửa logic điều hướng cốt lõi trong `page.tsx`**

1.  **Cập nhật kiểu `TabName`:**
    *   Trong tệp `appquanlycuahanghoa/src/app/page.tsx` (khoảng dòng 115), cập nhật định nghĩa kiểu `TabName` để bao gồm "Phân tích Sản phẩm".
        ```typescript
        type TabName = 'Bán hàng' | 'Kho hàng' | 'Đơn hàng' | 'Nhập hàng' | 'Hóa đơn' | 'Công nợ' | 'Doanh thu' | 'Khách hàng' | 'Nhân viên' | 'Phân tích Sản phẩm';
        ```

2.  **Import Biểu tượng Mới:**
    *   Trong tệp `appquanlycuahanghoa/src/app/page.tsx` (khoảng dòng 83), import biểu tượng `BarChartBig` từ `lucide-react`.
        ```typescript
        import { PanelLeft, ChevronsLeft, ChevronsRight, LogOut, UserCircle, Settings, Lock, ShoppingCart, HelpCircle, Store, Pencil, Trash2, PlusCircle, BarChartBig } from 'lucide-react';
        ```

3.  **Thêm vào `baseNavItems`:**
    *   Trong tệp `appquanlycuahanghoa/src/app/page.tsx` (khoảng dòng 291), thêm tab "Phân tích Sản phẩm" mới vào mảng `baseNavItems`. Bạn có thể quyết định vị trí của nó, ví dụ, gần "Doanh thu".
        ```typescript
        const baseNavItems = useMemo(() => [
          // ... các mục hiện có ...
          { name: 'Doanh thu' as TabName, icon: <RevenueIcon /> },
          { name: 'Phân tích Sản phẩm' as TabName, icon: <BarChartBig /> }, // Mục mới
          { name: 'Khách hàng' as TabName, icon: <CustomerIcon /> },
          // ... các mục còn lại ...
        ], []);
        ```

4.  **Cập nhật Logic Quyền Truy cập `navItems`:**
    *   Logic hiện tại trong `navItems` (khoảng dòng 303) đã phù hợp:
        ```typescript
        const navItems = useMemo(() => {
          if (currentUserEmployeeData?.position === 'Nhân viên') {
            return baseNavItems.filter(item => item.name !== 'Nhân viên' && item.name !== 'Doanh thu');
          }
          return baseNavItems;
        }, [baseNavItems, currentUserEmployeeData]);
        ```
    *   Khi "Phân tích Sản phẩm" được thêm vào `baseNavItems`, nó sẽ tự động hiển thị cho các vai trò không phải là 'Nhân viên' (bao gồm 'Quản lý' và 'ADMIN'), điều này khớp với yêu cầu.

5.  **Thêm vào Đối tượng `tabs` và Import Component Mới:**
    *   Trong tệp `appquanlycuahanghoa/src/app/page.tsx`:
        *   Import component tab mới (sẽ được tạo ở Giai đoạn 2):
            ```typescript
            import { ProductAnalysisTab } from '@/components/tabs/ProductAnalysisTab';
            ```
        *   Thêm một mục mới vào đối tượng `tabs` (khoảng dòng 310), truyền các props cần thiết như `productSalesDetails` và `inventory`:
            ```typescript
            const tabs: Record<TabName, ReactNode> = useMemo(() => ({
              // ... các tab hiện có ...
              'Phân tích Sản phẩm': <ProductAnalysisTab
                                      productSalesDetails={productSalesDetails}
                                      inventory={inventory}
                                      // Các props khác nếu cần
                                    />,
            }), [
                // ... các dependencies hiện có ...
                productSalesDetails, inventory // Thêm dependencies mới
            ]);
            ```

**Giai đoạn 2: Tạo Component Tab Mới**

1.  **Tạo Tệp:**
    *   Tạo một tệp mới tại đường dẫn: `appquanlycuahanghoa/src/components/tabs/ProductAnalysisTab.tsx`.

2.  **Triển khai Component Placeholder (Ban đầu):**
    *   Thêm nội dung placeholder cơ bản cho component này.
    ```typescript
    // appquanlycuahanghoa/src/components/tabs/ProductAnalysisTab.tsx
    import React from 'react';
    import type { Product, ProductSalesDetail } from '@/types';

    interface ProductAnalysisTabProps {
      productSalesDetails: ProductSalesDetail[];
      inventory: Product[];
      // Thêm các props khác nếu cần
    }

    export function ProductAnalysisTab({ productSalesDetails, inventory }: ProductAnalysisTabProps) {
      // TODO: Triển khai logic và UI phân tích sản phẩm chi tiết
      
      const bestSellingProducts = [...productSalesDetails]
        .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
        .slice(0, 5);

      return (
        <div className="p-4 md:p-6">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">Phân tích Sản phẩm</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-medium mb-3 text-card-foreground">Sản phẩm bán chạy nhất</h3>
              {bestSellingProducts.length > 0 ? (
                <ul className="space-y-2">
                  {bestSellingProducts.map(product => (
                    <li key={product.productId} className="text-sm text-muted-foreground">
                      {product.name} ({product.color}, {product.size}) - Đã bán: 
                      <span className="font-semibold text-foreground"> {product.totalQuantitySold} {product.unit}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu bán hàng.</p>
              )}
            </div>

            <div className="bg-card p-6 rounded-xl shadow-lg">
              <h3 className="text-xl font-medium mb-3 text-card-foreground">Xu hướng bán hàng (Placeholder)</h3>
              <p className="text-sm text-muted-foreground">
                Biểu đồ và phân tích xu hướng bán hàng sẽ được hiển thị ở đây.
              </p>
            </div>
          </div>
          
          <p className="mt-8 text-xs text-muted-foreground italic">
            Lưu ý: Chức năng phân tích sản phẩm chi tiết hơn đang trong quá trình phát triển.
          </p>
        </div>
      );
    }
    ```

---

### **Sơ đồ Luồng (Mermaid)**

```mermaid
graph TD
    A[Người dùng nhấp vào "Phân tích Sản phẩm" trên Sidebar] --> B{page.tsx: activeTab được đặt thành "Phân tích Sản phẩm"};
    B --> C{page.tsx: Hiển thị nội dung từ đối tượng `tabs`};
    C --> D[page.tsx: `tabs['Phân tích Sản phẩm']`];
    D --> E[Khởi tạo `<ProductAnalysisTab />` với các props];
    E --> F[ProductAnalysisTab.tsx: Xử lý dữ liệu (ví dụ: productSalesDetails, inventory)];
    F --> G[ProductAnalysisTab.tsx: Hiển thị UI (sản phẩm bán chạy, xu hướng)];