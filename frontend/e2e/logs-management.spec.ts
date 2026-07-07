import { test, expect } from '@playwright/test';

test.describe('Quản lý Nhật ký & Sao lưu (Module 011)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Đăng nhập hệ thống
    await page.goto('/login');
    await page.getByPlaceholder('Tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    // Navigate to logs page
    await page.getByText('Nhật ký hệ thống').click();
    await page.waitForURL(/\/logs/);
  });

  test('Hiển thị đầy đủ 3 tab của module nhật ký & sao lưu', async ({ page }) => {
    // Verify tiêu đề và mô tả
    await expect(page.locator('h2', { hasText: 'Nhật ký hệ thống & Sao lưu' })).toBeVisible();

    // Verify các Tab — Ant Design Tabs with card type use label text in <span>
    await expect(page.locator('.ant-tabs-tab', { hasText: 'Nhật ký truy cập' })).toBeVisible();
    await expect(page.locator('.ant-tabs-tab', { hasText: 'Sao lưu & Phục hồi' })).toBeVisible();
    await expect(page.locator('.ant-tabs-tab', { hasText: 'Giám sát SIEM' })).toBeVisible();
  });

  test('Tab Nhật ký truy cập hoạt động bình thường', async ({ page }) => {
    // Select Tab 1
    await page.locator('.ant-tabs-tab', { hasText: 'Nhật ký truy cập' }).click();
    await page.waitForTimeout(500);

    // Verify có input tìm kiếm tài khoản, phân hệ, hành động
    await expect(page.getByPlaceholder('Tài khoản')).toBeVisible();
    await expect(page.getByPlaceholder('Phân hệ')).toBeVisible();
    await expect(page.getByPlaceholder('Hành động')).toBeVisible();

    // Verify table
    await expect(page.locator('.ant-table')).toBeVisible();

    // Verify nút Xuất CSV
    await expect(page.getByRole('button', { name: /Xuất CSV/i })).toBeVisible();
  });

  test('Tab Sao lưu & Phục hồi hiển thị nút Tạo bản sao lưu', async ({ page }) => {
    // Select Tab 2
    await page.locator('.ant-tabs-tab', { hasText: 'Sao lưu & Phục hồi' }).click();
    await page.waitForTimeout(500);

    // Verify Alert cảnh báo
    await expect(page.locator('.ant-alert')).toBeVisible();

    // Verify nút Tạo bản sao lưu — actual button text
    await expect(page.getByRole('button', { name: /Tạo bản sao lưu mới/i })).toBeVisible();
  });

  test('Tab Giám sát SIEM hiển thị các chỉ số và nút tải báo cáo', async ({ page }) => {
    // Select Tab 3
    await page.locator('.ant-tabs-tab', { hasText: 'Giám sát SIEM' }).click();
    await page.waitForTimeout(500);

    // Verify các chỉ số — exact text from Ant Design Statistic title
    await expect(page.getByText('Tốc độ sự kiện (EPS)')).toBeVisible();
    await expect(page.getByText('Tỷ lệ truy cập lỗi')).toBeVisible();
    await expect(page.getByText('Tài khoản đang bị khóa')).toBeVisible();

    // Verify các nút xuất báo cáo — actual button text labels
    await expect(page.getByRole('button', { name: /Word \(.docx\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Excel \(.xlsx\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /PDF/ })).toBeVisible();
  });
});
