---
id: F-095
name: Phê duyệt Đài TTDH
slug: phe-duyet-dai-ttdh
module-id: M-004
status: proposed
classification: local
priority: high
created: 2026-07-07T03:32:57Z
last-updated: 2026-08-11
locked-fields: []
consumed_by_modules: []
---
# Đặc tả nghiệp vụ: Phê duyệt Đài TTDH

**Tài liệu:** BA Feature Brief | **Feature:** F-095 | **Mã chức năng:** PDKC-079 | **Ngày:** 2026-08-11

---

## 1. Tổng quan

### 1.1. Tính năng này làm gì?

Luồng phê duyệt 2 cấp cho Đài TTDH:

```
Lưu tạm → Chờ duyệt CC → Chờ duyệt Cục → Đã phê duyệt
                ↘ Từ chối CC       ↘ Từ chối Cục
                   (sửa & gửi lại → Chờ duyệt CC)
```

**Cấp 1 — Cảng vụ/Chi cục:** Duyệt/Từ chối bản ghi "Chờ duyệt cấp Cảng vụ/Chi cục".
**Cấp 2 — Cục:** Duyệt/Từ chối bản ghi "Chờ duyệt cấp Cục". Cục cũng có quyền **phê duyệt trực tiếp** từ Lưu tạm (R14).

**Bắt buộc:** Cả duyệt và từ chối đều phải nhập **nội dung phê duyệt** (lý do).

**Từ chối không phải lịch sử** (R16) — bản ghi bị từ chối vẫn là trạng thái hiện tại, được phép sửa và gửi lại. Khi gửi lại, luôn về "Chờ duyệt cấp Cảng vụ/Chi cục" (bắt đầu lại từ đầu — R17).

**Lịch sử (trạng thái thứ 7):** bản ghi ở trạng thái "Lịch sử" không thể duyệt hoặc từ chối (read-only, đến từ DRAFT delete — F-094).

### 1.2. Luồng chính

**Duyệt Cấp 1 (Cảng vụ/Chi cục):** Chọn "Phê duyệt" → Nhập nội dung → Xác nhận → Status: Chờ duyệt CC → Chờ duyệt Cục → HTTP 200.

**Từ chối Cấp 1:** Chọn "Từ chối" → Nhập lý do (≥ 10 ký tự) → Status: Chờ duyệt CC → Từ chối CC → HTTP 200.

**Duyệt Cấp 2 (Cục):** Tương tự → Status: Chờ duyệt Cục → Đã phê duyệt.

**Từ chối Cấp 2:** Tương tự → Status: Chờ duyệt Cục → Từ chối Cục.

**Phê duyệt trực tiếp (Cục):** Từ Lưu tạm → nhập nội dung → Đã phê duyệt (R14).

---

## 2. Ai dùng?

| Thao tác | Cảng vụ/Chi cục | Cục |
|----------|:---:|:---:|
| Duyệt cấp 1 | ✅ | — |
| Từ chối cấp 1 | ✅ | — |
| Duyệt cấp 2 | — | ✅ |
| Từ chối cấp 2 | — | ✅ |
| Phê duyệt trực tiếp | — | ✅ (R14) |

Admin Cục: xem full lịch sử phê duyệt, nội dung phê duyệt.

---

## 3. User Stories

- **US-095-01:** Là Cảng vụ/Chi cục, tôi muốn duyệt hoặc từ chối đài đang Chờ duyệt cấp CC.
- **US-095-02:** Là Cục, tôi muốn duyệt hoặc từ chối đài đang Chờ duyệt cấp Cục.
- **US-095-03:** Là Cục, tôi muốn phê duyệt trực tiếp từ Lưu tạm (R14).
- **US-095-04:** Là người duyệt, tôi muốn nhập nội dung/lý do khi duyệt hoặc từ chối.
- **US-095-05:** Là Cán bộ, tôi muốn sửa và gửi lại sau khi bị từ chối (R15, R17).

---

## 4. Acceptance Criteria

**AC-095-01 — Duyệt C1 thành công:** Chờ duyệt CC → nhập nội dung → Chờ duyệt Cục, ghi lịch sử APPROVE_L1.

**AC-095-02 — Từ chối C1:** Chờ duyệt CC → nhập lý do ≥ 10 ký tự → Từ chối CC, ghi REJECT.

**AC-095-03 — Duyệt C2 thành công:** Chờ duyệt Cục → nhập nội dung → Đã phê duyệt, ghi APPROVE_L2.

**AC-095-04 — Phê duyệt trực tiếp:** Lưu tạm → nhập nội dung → Đã phê duyệt (chỉ Cục — R14).

**AC-095-05 — Self-approval prevention:** Người gửi không thể duyệt chính bản ghi mình gửi.

**AC-095-06 — Gửi lại từ Từ chối:** Sửa + gửi duyệt → luôn về Chờ duyệt CC (R17).

**AC-095-07 — Từ chối duyệt Lịch sử:** Bản ghi trạng thái Lịch sử → không thể duyệt/từ chối, HTTP 400 "Đài TTDH ở trạng thái Lịch sử không thể phê duyệt".

---

## 5. Business Rules

| ID | Rule | Source |
|----|------|--------|
| BR-095-01 | Duyệt/Từ chối phải nhập nội dung | Handoff 4.2 |
| BR-095-02 | Từ chối: lý do ≥ 10 ký tự | |
| BR-095-03 | Phê duyệt trực tiếp chỉ Cấp Cục | R14 |
| BR-095-04 | Từ chối không phải lịch sử | R16 |
| BR-095-07 | Lịch sử không thể duyệt/từ chối | F-094 |
| BR-095-05 | Gửi lại từ Từ chối → về Chờ duyệt CC | R17 |
| BR-095-06 | Self-approval prevention | |

---

## 6. Mô hình dữ liệu

Status flow: Lưu tạm → Chờ duyệt CC → Chờ duyệt Cục → Đã phê duyệt (↘ Từ chối CC, Từ chối Cục).

Các trường: approvalLevel, approvedBy, approvedDate, rejectionReason, approvalContent (nội dung phê duyệt).

---

## 7. API

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/stations/coastal/{id}/approve` | Duyệt (C1/C2/trực tiếp) |
| POST | `/api/v1/stations/coastal/{id}/reject` | Từ chối |

---

## 8. Chi tiết

Modal phê duyệt: textarea nhập nội dung (required), nút Duyệt (primary) / Từ chối (danger). Ghi lịch sử APPROVE_L1/APPROVE_L2/REJECT.

---

## 9. NFRs

Performance < 500ms. Transaction atomic. Self-approval check. Audit log.

---

## 10. UI

Modal phê duyệt: textarea "Nội dung phê duyệt" (required). Nút Duyệt (`statusOperational`) / Từ chối (`statusCritical`), `radiusPill`, `height: 40`. Nút "Phê duyệt trực tiếp" chỉ hiện cho Cục khi status = Lưu tạm.
