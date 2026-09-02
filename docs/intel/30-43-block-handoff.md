# Handoff — Lô tài liệu 14 sheet "30→43" (Excel 2.9)

> Trạng thái tính tới 2026-09-02. Nguồn sự thật: `HH_Tính năng & danh sách các trường thông tin_2.9.xlsx`, sheet **"30->43"** (cụm #30..#43).

## ĐÃ LÀM (tài liệu — không code, không seal, không git commit)

| Module | Việc | Nơi lưu |
|---|---|---|
| M-001 | Refresh F-006 "Biểu tượng bản đồ": thêm trường "Mã biểu tượng" (Excel #43) | `docs/modules/M-001-quan-tri-he-thong/_features/F-006-quan-ly-bieu-tuong-ban-do/feature-brief.md` |
| M-005 | Refresh F-124 (xử lý TS, Excel #32) + F-125 (kiểm kê TS, Excel #34) | `docs/modules/M-005-.../_features/F-124-xu-ly-tai-san-kcht/feature-brief.md` + `F-125-kiem-ke-tai-san-kcht/feature-brief.md` |
| M-006 | Viết lại 6 brief 7-section: F-129 (vận hành #35), F-130 (bảo trì #36), F-131 (sự cố #37), F-132/133/134 (quy hoạch bến cảng #38) | `docs/modules/M-006-.../_features/F-12{9,0,1,2,3,4}-*/feature-brief.md` |
| M-007 | Verify-report: 5 brief F-136→140 là template legacy (thiếu 7-section), module sealed → chỉ báo cáo | `docs/_drafts/30-43-block/M-007/verify-report.md` |
| M-025 **(MỚI)** | Module "Quản lý tàu biển": module-brief + ba/00-lean-spec (52 trường Excel #30) + feature-brief F-300 "Tàu biển ra vào cảng biển" | `docs/modules/M-025-quan-ly-tau-bien/` |
| M-017 **(MỚI)** | Feature "Sản lượng cảng biển" F-301 (27 trường Excel #33) | `docs/modules/M-017-thong-ke-chuyen-de/_features/F-301-san-luong-cang-bien/feature-brief.md` |

## CÒN THIẾU (chờ bật pipeline mới làm được)

1. **Đăng ký SDLC cho M-025**: file `_state.md` là CLI-owned (`ai-kit-state-update`/`ai-kit-scaffold`), không viết tay được → M-025 chưa có trong projection/bảng SDLC.
2. **Reconcile F-ID**: F-300 (tàu biển) và F-301 (sản lượng) là **id tạm thủ công**, chưa được ai-kit mint chính thức.
3. **M-007**: 5 brief legacy nên viết lại 7-section (ngoài phạm vi lần này).

## VÌ SAO "Pipeline routing is disabled"

Workspace thiếu lane registry `.ai-studio/agent/build-lanes.json` (thư mục `.ai-studio/` không tồn tại) → runtime từ chối mọi dispatch `pmo-*`. Không phải công tắc trong Settings (config-manage chỉ có `sdlc_fail_closed`, đã set false, không phải nguyên nhân). Cần operator/người vận hành AI Studio khôi phục lane registry.

## KHI BẬT ĐƯỢC PIPELINE → LÀM GÌ

1. `ai-kit scaffold` module M-025-quan-ly-tau-bien + feature (reconcile F-300).
2. `ai-kit scaffold` feature "Sản lượng cảng biển" trong M-017 (reconcile F-301).
3. Rebuild projection → module/feature hiện lên bảng SDLC.
