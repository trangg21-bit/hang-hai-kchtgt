---
id: AM-32fbac8d19e80da7
kind: decision
topic: port-dryport-2-trang-thai-2026-08-26
tags: []
importance: 0.85
agent: 
created: 2026-08-26T05:34:49.453Z
updated: 2026-08-26T05:34:49.453Z
---

Cảng biển + Cảng cạn chuyển mô hình 2 TRẠNG THÁI (2026-08-26, user yêu cầu): chỉ còn Lưu tạm (DRAFT) và Đã phê duyệt (APPROVED). PortListPage + DryPortListPage: tabs = Tất cả/Lưu tạm/Đã phê duyệt; form Thêm mới chỉ 2 nút Lưu tạm + Lưu và phê duyệt (bỏ nút 'Lưu và gửi phê duyệt' → PENDING); form Chỉnh sửa nút 'Cập nhật' → 'Lưu và phê duyệt', lưu sửa luôn set APPROVED (bỏ logic cũ APPROVED→PENDING). Xóa toàn bộ luồng submit modal + row action 'Gửi phê duyệt' (handleSubmitDraft/handleConfirmSubmit/openSubmitModal/submitModalOpen/submittingRecord + modal JSX + import submitCangBien/SendOutlined). Port filter options còn DRAFT+APPROVED; badge APPROVED='Đã phê duyệt'. Row action Phê duyệt/Từ chối vẫn giữ (chỉ khớp status PENDING legacy — không xuất hiện với dữ liệu mới). Backend KHÔNG đổi (FE không còn gửi SUBMIT/PENDING). Gate: npx tsc --noEmit + npm run build exit 0 (PortListPage 125.3kB, DryPort 72.2kB).
