# 🌸 Hướng Dẫn Kiểm Thử UI và Responsive Design

## Cửa Hàng Hoa Công Nguyệt

### 📋 Tổng Quan

Tài liệu này hướng dẫn chi tiết cách kiểm thử giao diện người dùng (UI) và thiết kế đáp ứng (responsive design) cho ứng dụng web của cửa hàng hoa.

---

## 🚀 Bắt Đầu Nhanh

### 1. Cài Đặt Dependencies

```bash
# Cài đặt Playwright cho cross-browser testing
npm install --save-dev @playwright/test

# Cài đặt Lighthouse cho performance testing
npm install --save-dev lighthouse

# Cài đặt browsers cho Playwright
npx playwright install
```

### 2. Chạy Kiểm Thử Tự Động

**Windows PowerShell:**

```powershell
# Chạy toàn bộ test suite
.\ui-test-runner.ps1

# Chỉ chạy Playwright tests
.\ui-test-runner.ps1 -PlaywrightOnly

# Chỉ chạy Lighthouse performance tests
.\ui-test-runner.ps1 -LighthouseOnly
```

**Linux/macOS:**

```bash
# Chạy toàn bộ test suite
node ui-test-runner.js

# Chỉ chạy Playwright tests
node ui-test-runner.js --playwright-only

# Chỉ chạy Lighthouse tests
node ui-test-runner.js --lighthouse-only
```

---

## 🛠️ Công Cụ Kiểm Thử

### 1. Responsive Testing Tool (Manual)

**File:** `responsive-testing-tool.html`

**Cách sử dụng:**

1. Mở file trong trình duyệt
2. Nhập URL: `http://localhost:3000`
3. Chọn thiết bị từ danh sách có sẵn
4. Hoặc nhập kích thước tùy chỉnh
5. Chạy kiểm thử đầy đủ

**Thiết bị được hỗ trợ:**

- iPhone SE (320×568)
- iPhone 14 (390×844)
- iPhone 14 Plus (414×896)
- Samsung Galaxy S20 (360×800)
- iPad (768×1024)
- iPad Pro (1024×1366)
- Desktop (1280×720)
- Full HD (1920×1080)

### 2. Responsive Debugger (Developer Tool)

**Cách kích hoạt:**

- Nhấn `Ctrl+Shift+R` trong trình duyệt
- Hoặc click nút debug ở góc dưới phải

**Thông tin hiển thị:**

- Kích thước viewport hiện tại
- Breakpoint đang active
- Loại thiết bị (Mobile/Tablet/Desktop)
- Thông tin trình duyệt
- Performance metrics (FCP, LCP, FID, CLS)
- Kết quả test breakpoints

### 3. Mobile Navigation Component

**Component:** `src/components/layout/MobileNavigation.tsx`

**Tính năng:**

- Header thu gọn với logo
- Menu slide từ bên phải
- Bottom navigation cho quick access
- Touch-friendly buttons (44px minimum)
- Responsive overlay

---

## 📱 Kiểm Thử Mobile

### Breakpoints Chính

| Breakpoint | Kích thước | Thiết bị                 |
| ---------- | ---------- | ------------------------ |
| xs         | 320px+     | Mobile portrait          |
| sm         | 640px+     | Mobile landscape         |
| md         | 768px+     | Tablet portrait          |
| lg         | 1024px+    | Tablet landscape/Desktop |
| xl         | 1280px+    | Desktop                  |
| 2xl        | 1536px+    | Large desktop            |

### Checklist Mobile

#### ✅ Navigation

- [ ] Hamburger menu hoạt động
- [ ] Bottom navigation hiển thị
- [ ] Touch targets ≥ 44px
- [ ] Menu overlay đúng

#### ✅ Forms

- [ ] Input không zoom trên iOS (font-size: 16px)
- [ ] Buttons dễ nhấn
- [ ] Select dropdowns hoạt động
- [ ] Focus states rõ ràng

#### ✅ Content

- [ ] Text readable (font ≥ 14px)
- [ ] Images responsive
- [ ] Tables scroll ngang
- [ ] Cards stack đúng

#### ✅ Performance

- [ ] Load time < 3s trên 3G
- [ ] No horizontal scroll
- [ ] Smooth animations
- [ ] Touch gestures responsive

---

## 🖥️ Kiểm Thử Desktop

### Checklist Desktop

#### ✅ Layout

- [ ] Sidebar hiển thị đầy đủ
- [ ] Content không bị cắt
- [ ] Spacing hợp lý
- [ ] Multi-column layouts

#### ✅ Interactions

- [ ] Hover states hoạt động
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] Context menus

#### ✅ Performance

- [ ] Bundle size optimized
- [ ] Images lazy loading
- [ ] Code splitting effective
- [ ] Cache strategies

---

## 🔄 Cross-Browser Testing

### Trình Duyệt Được Kiểm Thử

| Trình duyệt | Desktop | Mobile | Notes          |
| ----------- | ------- | ------ | -------------- |
| Chrome      | ✅      | ✅     | Primary target |
| Firefox     | ✅      | ✅     | Gecko engine   |
| Safari      | ✅      | ✅     | WebKit engine  |
| Edge        | ✅      | ❌     | Chromium-based |

### Playwright Test Commands

```bash
# Chạy trên tất cả browsers
npx playwright test

# Chạy trên browser cụ thể
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Chạy với UI (headed mode)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Update screenshots
npx playwright test --update-snapshots
```

---

## 📊 Performance Testing

### Core Web Vitals Targets

| Metric | Good    | Needs Improvement | Poor    |
| ------ | ------- | ----------------- | ------- |
| FCP    | < 1.5s  | 1.5s - 2.5s       | > 2.5s  |
| LCP    | < 2.5s  | 2.5s - 4.0s       | > 4.0s  |
| FID    | < 100ms | 100ms - 300ms     | > 300ms |
| CLS    | < 0.1   | 0.1 - 0.25        | > 0.25  |

### Lighthouse Commands

```bash
# Basic audit
npx lighthouse http://localhost:3000

# Mobile audit
npx lighthouse http://localhost:3000 --emulated-form-factor=mobile

# Desktop audit
npx lighthouse http://localhost:3000 --emulated-form-factor=desktop

# Custom output
npx lighthouse http://localhost:3000 --output=html --output-path=report.html
```

---

## 🧪 Custom Testing Hooks

### useResponsive Hook

```tsx
import { useResponsive } from "@/hooks/use-responsive";

function MyComponent() {
  const { isMobile, isTablet, isDesktop, breakpoint, width, height } =
    useResponsive();

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

### useDeviceInfo Hook

```tsx
import { useDeviceInfo } from "@/hooks/use-responsive";

function MyComponent() {
  const { isMobile, isIOS, isAndroid, isChrome, isSafari } = useDeviceInfo();

  // Device-specific logic
  if (isIOS) {
    // iOS-specific handling
  }
}
```

---

## 🎨 CSS Utilities

### Responsive Classes

```css
/* Hide/show based on screen size */
.mobile-only     /* block md:hidden */
/* block md:hidden */
.desktop-only    /* hidden md:block */
.tablet-up       /* hidden md:block */

/* Touch-friendly elements */
.touch-target    /* min-h-[44px] min-w-[44px] */
.touch-button    /* touch-target + padding + transitions */

/* Responsive text */
.text-responsive         /* text-sm md:text-base lg:text-lg */
.text-responsive-heading /* text-lg md:text-xl lg:text-2xl */

/* Responsive containers */
.container-responsive    /* max-width responsive */
.grid-responsive        /* grid with responsive columns */
.flex-responsive; /* flex-col sm:flex-row */
```

### Form Utilities

```css
/* Mobile-optimized inputs */
.input-responsive   /* Prevents zoom on iOS, responsive sizing */
/* Prevents zoom on iOS, responsive sizing */
.select-responsive; /* Custom dropdown with touch-friendly size */
```

---

## 📋 Test Cases Tự Động

### UI Test Structure

```typescript
// tests/ui-responsive.spec.ts
test.describe("Responsive Design", () => {
  test("Mobile layout renders correctly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Test mobile-specific elements
    await expect(
      page.locator('[data-testid="mobile-menu-button"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="main-sidebar"]')).toBeHidden();
  });

  test("Touch targets meet accessibility standards", async ({ page }) => {
    // Test minimum 44px touch targets
  });
});
```

### Custom Test Cases

1. **Layout Breakpoints**: Kiểm tra layout tại mỗi breakpoint
2. **Touch Interactions**: Verify touch targets ≥ 44px
3. **Typography Scale**: Font sizes readable trên mọi device
4. **Image Optimization**: Images load và scale đúng
5. **Performance Budget**: Load times trong limits
6. **Accessibility**: WCAG compliance

---

## 🚨 Troubleshooting

### Common Issues

#### 1. Tests Failed on Specific Browser

```bash
# Reinstall browsers
npx playwright install

# Clear cache
npx playwright install --force
```

#### 2. Mobile Layout Issues

- Check CSS media queries
- Verify viewport meta tag
- Test on actual devices
- Use browser dev tools

#### 3. Performance Issues

- Optimize images
- Enable lazy loading
- Check bundle size
- Review network requests

#### 4. Touch Target Issues

- Ensure minimum 44px size
- Add proper spacing
- Test with finger simulation

### Debug Commands

```bash
# View test results
npx playwright show-report

# Open test artifacts
start test-results/html-report/index.html

# Debug specific test
npx playwright test --debug tests/ui-responsive.spec.ts
```

---

## 📈 Continuous Integration

### GitHub Actions Setup

```yaml
name: UI Testing
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:ui
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:ui:quick"
    }
  }
}
```

---

## 📚 Resources

### Documentation

- [Playwright Testing](https://playwright.dev/)
- [Lighthouse Performance](https://developers.google.com/web/tools/lighthouse)
- [Web.dev Guidelines](https://web.dev/)
- [WCAG Accessibility](https://www.w3.org/WAI/WCAG21/quickref/)

### Tools

- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Firefox DevTools](https://developer.mozilla.org/en-US/docs/Tools)
- [Safari Web Inspector](https://developer.apple.com/safari/tools/)

### Testing Resources

- [Can I Use](https://caniuse.com/) - Browser compatibility
- [BrowserStack](https://www.browserstack.com/) - Real device testing
- [PageSpeed Insights](https://pagespeed.web.dev/) - Performance analysis

---

## 💡 Best Practices

### 1. Mobile-First Design

- Start với mobile layout
- Progressive enhancement cho larger screens
- Touch-first interactions

### 2. Performance

- Optimize critical rendering path
- Lazy load non-critical resources
- Monitor Core Web Vitals

### 3. Accessibility

- Semantic HTML structure
- Proper ARIA labels
- Keyboard navigation support
- Color contrast compliance

### 4. Testing Strategy

- Test early và often
- Automate regression tests
- Manual testing trên real devices
- Monitor production metrics

---

**💬 Liên hệ hỗ trợ:** Nếu gặp vấn đề, vui lòng tạo issue hoặc liên hệ team development.

**🔄 Cập nhật:** Tài liệu này được cập nhật thường xuyên. Check back để có thông tin mới nhất.
