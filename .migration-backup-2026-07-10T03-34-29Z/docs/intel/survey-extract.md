# Survey Extract - Layer 3 Intel
> Source: VMD_MTIS_TaiLieuKhaoSat_PM_NoiBo_v1.0_Phụ lục_PHCV.pdf (452K tokens, 506 chunks)
> Extracted: 2026-06-16

## 1. Document Overview

| Attribute | Value |
|-----------|-------|
| Title | PHỤ LỤC KẾT QUẢ KHẢO SÁT |
| Project | Hệ thống thông tin quản lý kết cấu hạ tầng giao thông hàng hải |
| Contractor | CÔNG TY CỔ PHẦN HỆ THỐNG CÔNG NGHỆ ETC |
| Survey Type | Phỏng vấn trực tiếp các đơn vị sử dụng |

## 2. Surveyed Organizations

| # | Đơn vị | Địa điểm | Cán bộ phỏng vấn |
|---|--------|----------|------------------|
| 1 | Phòng Khoa học-Công nghệ và Môi trường | Số 8 Phạm Hùng, Hà Nội | Thi (0374596606) |
| 2 | Phòng Kết cấu hạ tầng hàng hải | Số 8 Phạm Hùng, Hà Nội | Phạm Đức Quân (0946600248) |
| 3 | Cảng vụ Hàng hải Hải Phòng | Hải Phòng | Anh Hiệp (0983813112) |
| 4 | Chi cục Hàng hải Hồ Chí Minh | HCM | Anh Cương (0976515888) |

## 3. Actor Matrix (Confirmed from Survey)

| STT | Đối tượng | Mô tả | Quyền |
|-----|-----------|-------|-------|
| 1 | Quản trị hệ thống | Thực hiện quản trị hệ thống và CSDL | Full admin |
| 2 | Lãnh đạo Cục | Duyệt dữ liệu cấp Cục | Approve L2 |
| 3 | Lãnh đạo Chi cục | Duyệt dữ liệu cấp Chi cục | Approve L1 |
| 4 | Lãnh đạo Cảng vụ | Duyệt dữ liệu cấp Cảng vụ | Approve L1 |
| 5 | Chuyên viên Cục | Thêm/Sửa/Xóa/Tra cứu | CRUD |
| 6 | Chuyên viên Chi cục | Thêm/Sửa/Xóa/Tra cứu | CRUD |
| 7 | Chuyên viên Cảng vụ | Thêm/Sửa/Xóa/Tra cứu | CRUD |
| 8 | Doanh nghiệp cảng (bên ngoài) | Tra cứu dữ liệu | Read-only |
| 9 | Người dùng tại cảng | Tra cứu dữ liệu | Read-only |

## 4. Authentication Requirements (From Survey)

| Item | Requirement |
|------|-------------|
| **Login method** | Email (không dùng mã cán bộ) |
| **Password recovery** | Via Email |
| **Role change** | Khi chuyển đơn vị công tác → phân quyền lại |

## 5. Data Fields Enrichment

### 5.1 Bến phao (Buoy Berth)

| STT | Chỉ tiêu | Bắt buộc | Format/Values |
|-----|----------|----------|---------------|
| 1 | Đơn vị quản lý | Có | - |
| 2 | Cảng biển | Có | - |
| 3 | Mã bến phao | Có | Auto: `{Mã cảng biển}-BP-{2 số tự tăng}` |
| 4 | Tên bến phao | Có | - |
| 5 | Địa điểm | Có | - |
| 6 | Vị trí | - | GIS coordinates |
| 7 | Thời điểm công bố mở | Có | - |
| 8 | Cỡ tàu khai thác (DWT) | Có | - |
| 9 | Tình trạng | Có | - |
| 10 | Độ sâu (m) | Có | - |
| 11 | Thời điểm đăng kiểm gần nhất | Có | - |
| 12 | Thời hạn đăng kiểm tiếp theo | Không | - |
| 13 | Năng lực thiết kế | Có | - |
| 14 | Đơn vị khai thác | Có | - |
| 15 | File đính kèm | Không | Multiple files |

### 5.2 Cầu cảng (Wharf) - Additional Fields Requested

| Field | Description | Source |
|-------|-------------|--------|
| Số lượng cầu cảng đang khai thác | Count of operational wharves | Survey feedback |
| Số lượng đã công bố | Count of announced wharves | Survey feedback |
| Số lượng đang thỏa thuận đầu tư | Count under investment agreement | Survey feedback |
| Quyết định công bố | Legal document | Survey feedback |
| Văn bản cho phép khai thác | Operation permit | Survey feedback |
| Lượng hàng thông qua | Cargo throughput | Survey feedback |
| Phạm vi khu nước neo buộc tàu | Mooring water area | Survey feedback |
| Cao độ đáy bến thiết kế | Design bottom elevation | Survey feedback |
| Điều kiện khai thác (file) | Operating conditions | Survey feedback |

## 6. Approval Workflow (Confirmed)

```
Chuyên viên đề xuất
       ↓
Lãnh đạo Chi cục/Cảng vụ phê duyệt (L1)
       ↓
Lãnh đạo Cục phê duyệt (L2)
       ↓
Trạng thái: Phê duyệt / Từ chối
```

**Date format:** `DD/MM/YYYY HH:MM:SS`

## 7. Report Templates (19 Biểu mẫu)

| STT | Biểu mẫu | Nguồn dữ liệu |
|-----|----------|---------------|
| 1 | Biểu 01-N: Năng lực thông qua bến cảng, cầu cảng | Tổng hợp từ hệ thống |
| 2 | Biểu 01B-N: Năng lực cảng biển | Tổng hợp từ hệ thống |
| 3 | Biểu 02-N: Thống kê cầu cảng | Nhập thủ công từ hồ sơ |
| 4 | Biểu 03-Q/N: Thống kê luồng hàng hải | Nhập thủ công từ hồ sơ |
| 5 | Biểu 04-6T/N: Thống kê vùng đỗ | Nhập thủ công từ hồ sơ |
| 6 | Biểu 04B-N: Thống kê khu chuyển tải | Nhập thủ công từ hồ sơ |
| 7 | Biểu 05-N: Thống kê bến phao, khu neo đậu | Nhập thủ công từ hồ sơ |
| 8 | Biểu 06-N: Thống kê hệ thống đèn biển | Nhập thủ công từ hồ sơ |
| 9 | Biểu 07-6T/N: Thống kê phao tiêu, báo hiệu trên luồng | Nhập thủ công từ hồ sơ |
| 10 | Biểu 07B-6T/N: Thống kê phao tiêu báo hiệu trên luồng | Nhập thủ công từ hồ sơ |
| 11 | Biểu Tổng hợp thông tin chung | Nhập thủ công từ hồ sơ |
| 12 | Biểu Tổng hợp thông tin KCHTGT hàng hải | Nhập thủ công từ hồ sơ |
| 13 | Biểu Tổng hợp bảo trì KCHTGT | Nhập thủ công từ hồ sơ |
| 14 | Biểu Tổng hợp bảo trì - Cầu cảng | Nhập thủ công từ hồ sơ |
| 15 | Biểu Tổng hợp bảo trì - Luồng hàng hải | Nhập thủ công từ hồ sơ |
| 16 | Biểu Tổng hợp bảo trì - Phao tiêu báo hiệu | Nhập thủ công từ hồ sơ |
| 17 | Biểu Tổng hợp bảo trì - Đèn biển và nhà trạm | Nhập thủ công từ hồ sơ |
| 18 | Biểu Tổng hợp bảo trì - Đê, kè | Nhập thủ công từ hồ sơ |
| 19 | Báo cáo tình hình hoạt động báo hiệu hàng hải | Nhập thủ công từ hồ sơ |

## 8. Legacy System Integration

| System | Owner | Usage |
|--------|-------|-------|
| Phần mềm Elcom | Cục HHVN | Dữ liệu đầu vào cho thống kê |
| CHHVN Statistics | Cục HHVN | Tự động tính toán từ dữ liệu Elcom |

**Note:** CHHVN đã xây dựng công thức tính toán trên cơ sở dữ liệu trích xuất từ phần mềm Elcom. Đơn vị chỉ cần cung cấp dữ liệu đầu vào.

## 9. Pain Points (From Survey)

| Issue | Description |
|-------|-------------|
| **Không có CSDL tập trung** | "Chưa có hệ thống cơ sở dữ liệu để theo dõi, quản lý, điều chỉnh cập nhật thông tin kịp thời" |
| **Manual data entry** | Hầu hết báo cáo được "Nhập thủ công từ hồ sơ" |
| **Disconnected systems** | Phần mềm Elcom riêng biệt, không tích hợp |

## 10. Legal Document Updates (From Survey)

| Old Document | New Document | Effective |
|--------------|--------------|-----------|
| Mẫu B03/CCTT (TT 133/2018/TT-BTC) | Mẫu B04a/BCTC (TT 24/2024/TT-BTC) | 17/4/2024 |
| Biểu 01-N (QĐ101) | Biểu 01-N (QĐ dự thảo mới) | Pending |

---

## Summary

**Survey enriches Layer 1 + 2 with:**
1. ✅ **Actor confirmation** - 9 actors with specific roles and permissions
2. ✅ **Authentication requirements** - Email login, password recovery
3. ✅ **Data field specifications** - Mandatory/optional, formats, auto-generated codes
4. ✅ **Additional field requests** - 10+ new fields for Cầu cảng/Bến phao
5. ✅ **Approval workflow confirmation** - 2-level (Chi cục/Cảng vụ → Cục)
6. ✅ **19 report templates** with data sources
7. ✅ **Legacy system integration** - Elcom software data extraction
8. ✅ **Pain points** - No centralized DB, manual entry, disconnected systems
9. ✅ **Legal document updates** - TT 24/2024 replaces TT 133/2018

**Impact on features:**
- M-002 (Bến cảng): Add 10+ new fields
- M-008 (Báo cáo): Confirm 19 report templates, data sources
- M-010 (Xác thực): Email-based login confirmed
- All modules: 2-level approval workflow confirmed

**Next:** Apply enrichments to feature-brief.md files OR `/resume-module M-001`
