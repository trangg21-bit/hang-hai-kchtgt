import { test, expect } from '@playwright/test';

test.describe('Quản lý Nhật ký & Sao lưu (Module 011)', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Đăng nhập hệ thống
    await page.goto('/login');
    await page.getByLabel('Tài khoản').fill('admin');
    await page.getByLabel('Mật khẩu').fill('admin123');
    await page.getByRole('button', { name: /đăng nhập/i }).click();
    await page.waitForURL(/\/users/);

    // 2. Click menu "Nhật ký hệ thống"
    await page.getByText('Nhật ký hệ thống').click();
    await page.waitForURL(/\/logs/);
  });

  test('Hiển thị đầy đủ 3 tab của module nhật ký & sao lưu', async ({ page }) => {
    // Verify tiêu đề và mô tả
    await expect(page.locator('h2', { hasText: 'Nhật ký hệ thống & Sao lưu' })).toBeVisible();

    // Verify các Tab
    await expect(page.getByRole('tab', { name: /nhật ký truy cập/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /sao lưu & phục hồi/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /giám sát siem/i })).toBeVisible();
  });

  test('Tab Nhật ký truy cập hoạt động bình thường', async ({ page }) => {
    // Select Tab 1
    await page.getByRole('tab', { name: /nhật ký truy cập/i }).click();

    // Verify có input tìm kiếm phân hệ, hành động
    await expect(page.getByPlaceholder('Phân hệ')).toBeVisible();
    await expect(page.getByPlaceholder('Hành động')).toBeVisible();

    // Verify table và nút Xuất CSV
    await expect(page.getByRole('button', { name: /xuất csv/i })).toBeVisible();
  });

  test('Tab Sao lưu & Phục hồi hiển thị nút Tạo bản sao lưu', async ({ page }) => {
    // Select Tab 2
    await page.getByRole('tab', { name: /sao lưu & phục hồi/i }).click();

    // Verify Alert cảnh báo
    await expect(page.locator('.ant-alert')).toBeVisible();

    // Verify nút Tạo bản sao lưu
    await expect(page.getByRole('button', { name: /tạo bản sao lưu mới/i })).toBeVisible();
  });

  test('Tab Giám sát SIEM hiển thị các chỉ số và nút tải báo cáo', async ({ page }) => {
    // Select Tab 3
    await page.getByRole('tab', { name: /giám sát siem/i }).click();

    // Verify các chỉ số
    await expect(page.getByText('Tốc độ sự kiện (EPS)')).toBeVisible();
    await expect(page.getByText('Tỷ lệ truy cập lỗi')).toBeVisible();
    await expect(page.getByText('Tài khoản đang bị khóa')).toBeVisible();

    // Verify các nút xuất báo cáo
    await expect(page.getByRole('button', { name: /word \(.docx\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /excel \(.xlsx\)/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pdf/i })).toBeVisible();
  });
});
