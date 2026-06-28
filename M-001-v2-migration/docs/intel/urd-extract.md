# URD Extract - Layer 2 Intel
> Source: URD_MTIS_VMD_v3.0_PHCV.pdf (1.3M tokens, 1370 chunks)
> Extracted: 2026-06-16

## 1. Document Overview

| Attribute | Value |
|-----------|-------|
| Title | Tài liệu yêu cầu người sử dụng |
| Version | V3.0 |
| Contractor | CÔNG TY CỔ PHẦN HỆ THỐNG CÔNG NGHỆ ETC |
| Project | Xây dựng Hệ thống thông tin quản lý kết cấu hạ tầng giao thông hàng hải |
| Contract | 09/2024/HĐKT/CHHVN-ETC (hiệu lực 30/12/2024) |

## 2. Use Case Summary (285 UCs)

### 2.1 Phân hệ breakdown

| # | Phân hệ | UC Count | Complexity |
|---|---------|----------|------------|
| I | Quản lý người dùng | 2 | Trung bình |
| II | Quản trị hệ thống | 5 | Trung bình |
| III | Quản lý thông số kỹ thuật KCHTGT HH | 82 | Phức tạp |
| IV | Quản lý thông tin vận hành khai thác, bảo trì | 3 | Phức tạp |
| V | Quản lý quy hoạch KCHTGT HH | 3 | Phức tạp |
| VI | Quản lý thông tin tài sản | 55 | Phức tạp |
| VII | Quản lý thông tin KCHT trên bản đồ (GIS) | 5 | Trung bình |
| VIII | Báo cáo thống kê | 49 | Phức tạp |
| IX | Liên thông chia sẻ dữ liệu | 81 | Phức tạp |

### 2.2 Complexity Distribution

| Complexity | Count | Percentage |
|------------|-------|------------|
| Đơn giản | ~20 | 7% |
| Trung bình | ~130 | 46% |
| Phức tạp | ~135 | 47% |

## 3. Business Rules Extracted

### 3.1 Data Input Conditions Legend

| Symbol | Meaning |
|--------|---------|
| **M** | Bắt buộc (Mandatory) |
| **X** | Không cho phép nhận (Disabled/Auto) |
| **C** | Bắt buộc có điều kiện (Conditional) |
| **-** | Không bắt buộc (Optional) |

### 3.2 Common Validation Rules

1. **Default Sorting**: Mặc định sắp xếp từ ngày gần nhất đến ngày xa nhất theo Ngày cập nhật
2. **Approval Workflow**: 2-level approval (Cảng vụ/Chi cục → Cục)
3. **History Tracking**: Mọi thay đổi được ghi vào lịch sử hình thành
4. **File Attachment**: Cho phép đính kèm file, xóa file đính kèm
5. **Excel Import**: Cho phép nhập từ file Excel với validation

### 3.3 Approval Workflow Rules

- **Cấp 1 (Cảng vụ/Chi cục)**: Lãnh đạo phê duyệt
- **Cấp 2 (Cục)**: Lãnh đạo Cục phê duyệt
- **Trạng thái**: Chờ duyệt → Đã duyệt / Từ chối

### 3.4 Data Sharing Rules (LGSP/HTTT-ĐV)

- **Authentication**: IP đã đăng ký + Đăng nhập thành công
- **Authorization**: Được phân quyền truy vấn dữ liệu
- **Logging**: Hệ thống ghi nhật ký chia sẻ dữ liệu vào DB
- **Schedule**: Thời điểm quét để chia sẻ dữ liệu: 18h hàng ngày

## 4. Non-Functional Requirements

### 4.1 Performance

- **Concurrent Users**: >500 cán bộ truy cập đồng thời
- **Transaction Time**: 10 giây/giao dịch
- **Success Rate**: Tối thiểu 80% số giao dịch thực hiện thành công/phút

### 4.2 Security

- **SSL**: Đường truyền được cấu hình SSL
- **Multi-layer Security**: OS, DB, Application levels
- **IPv6**: Sẵn sàng hoặc có giải pháp nâng cấp

### 4.3 UI/UX Constraints

- Dữ liệu được kiểm tra ngay thời điểm nhập
- Hiển thị thông báo lỗi ngay khi dữ liệu không hợp lệ
- Ô nhập hiển thị dấu bắt buộc/tùy chọn
- Định dạng chuyên biệt: Ngày tháng, Số
- Thứ tự ô nhập theo logic văn bản
- Hỗ trợ keyboard navigation (không cần chuột)
- Danh sách dropdown cho dữ liệu cố định

## 5. Actor Matrix (from URD)

| Cấp | Actor | Read | Write | Approve | Condition |
|-----|-------|------|-------|---------|-----------|
| 1 | Cục - Lãnh đạo | ✅ | ✅ | ✅ | Đăng nhập + Phân quyền |
| 1 | Cục - Chuyên viên | ✅ | ✅ | ❌ | Đăng nhập + Phân quyền |
| 1 | Cục - Quản trị HT | ✅ | ✅ | ❌ | Đăng nhập + Phân quyền |
| 2 | Cảng vụ/Chi cục - Lãnh đạo | ✅ | ✅ | ✅ | Đăng nhập + Phân quyền |
| 2 | Cảng vụ/Chi cục - Chuyên viên | ✅ | ✅ | ❌ | Đăng nhập + Phân quyền |
| 3 | Doanh nghiệp cảng | ✅ | ✅ | ❌ | Đăng nhập + Phân quyền |
| 4 | Người dùng tại cảng | ✅ | ✅ | ❌ | Đăng nhập + Phân quyền |
| 5 | Hệ thống HH | ✅ | ❌ | ❌ | Internal |
| 6 | Trục LGSP | ✅ | ❌ | ❌ | IP đăng ký + Auth |
| 7 | HTTT-ĐV | ✅ | ❌ | ❌ | IP đăng ký + Auth |

## 6. Key Business Processes

### 6.1 Quy trình cập nhật thông tin KCHTGT HH
1. Chuyên viên cập nhật thông tin
2. Lưu tạm hoặc gửi phê duyệt
3. Lãnh đạo Cảng vụ/Chi cục phê duyệt
4. Lãnh đạo Cục phê duyệt (nếu cần)
5. Thông tin được công bố

### 6.2 Quy trình cập nhật thông tin tài sản KCHTGT HH
1. Chuyên viên nhập thông tin tài sản
2. Đính kèm tài liệu pháp lý
3. Gửi phê duyệt
4. Phê duyệt 2 cấp
5. Cập nhật vào CSDL

### 6.3 Quy trình doanh nghiệp nhập thông tin
1. Doanh nghiệp đăng nhập
2. Nhập thông tin theo form
3. Gửi cho Cảng vụ/Chi cục xem xét
4. Cảng vụ/Chi cục phê duyệt
5. Cập nhật vào hệ thống

## 7. Integration Points

### 7.1 Data Sharing APIs (LGSP)
- Chia sẻ thông tin KCHTGT: Bến cảng, Cầu cảng, Bến phao, Khu tránh trú bão, etc.
- Schedule: 18h hàng ngày
- Format: REST API with JSON

### 7.2 Integration APIs (HTTT-ĐV)
- Tích hợp thông tin: Thuyền viên, Tàu biển, Cơ sở đóng tàu, etc.
- Authentication: IP whitelist + Token

## 8. Module-Feature Mapping to URD

| Module | URD Section | UC Range |
|--------|-------------|----------|
| M-001 Quản trị hệ thống | III.2, III.3 | UC 1-7 |
| M-002 Quản lý tài sản Cảng & Bến | III.4 (partial), III.7 | UC 37-55, 96-111 |
| M-003 Quản lý tài sản Khu nước & VTS | III.4 (partial) | UC 44-75 |
| M-004 Quản lý tài sản Báo hiệu & Thông tin | III.4 (partial) | UC 52-89 |
| M-005 Quản lý biến động tài sản | III.7 | UC 146-150 |
| M-006 Quản lý văn bản & Thông tin nghiệp vụ | III.4.1, III.5 | UC 9, 89-92 |
| M-007 GIS/Bản đồ | III.8 | UC 151-155 |
| M-008 Báo cáo & Thống kê | III.9 | UC 156-204 |
| M-009 Liên thông & Tích hợp | III.10 | UC 205-285 |
| M-010 Xác thực & Phân quyền | III.2.1, III.11.11 | UC 1-2 |
| M-011 Nhật ký & Backup | III.3.5, III.11.11.3 | UC 5 |
| M-012 Hải đồ & GIS Integration | III.8, III.4.37 | UC 151-155 |

---

## Summary

**URD enriches Layer 1 (TKCT) with:**
1. ✅ **285 detailed use cases** with complexity classification
2. ✅ **Validation rules** (M/X/C/- conditions) for each data field
3. ✅ **Approval workflow** (2-level: Cảng vụ/Chi cục → Cục)
4. ✅ **Actor permissions** matrix (7 actor types, 4 permission levels)
5. ✅ **Non-functional requirements** (performance, security, UI/UX)
6. ✅ **Integration specifications** (LGSP, HTTT-ĐV APIs)
7. ✅ **Business process flows** with state transitions

**Next:** Apply these rules to feature-brief.md files via `/resume-module` pipeline.
