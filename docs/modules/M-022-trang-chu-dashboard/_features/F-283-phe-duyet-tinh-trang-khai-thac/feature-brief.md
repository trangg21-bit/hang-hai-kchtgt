---
id: F-283
name: Phê duyệt & Tình trạng khai thác
slug: phe-duyet-tinh-trang-khai-thac
module-id: M-022
status: done
priority: high
created: 2026-07-09T00:00:00Z
last-updated: 2026-07-13T00:00:00Z
stage: closed
---
# Feature: Phê duyệt & Tình trạng khai thác

## Description

Ba khối thông tin: 2 ApprovalCard (Phê duyệt tài sản, Phê duyệt KCHT) + Bảng tình trạng khai thác 10 dòng KCHT.

ApprovalCard: thanh stacked bar (approved/pending/rejected) với token màu approvalApproved/approvalPending/approvalRejected. Legend + pending pill badge. Dữ liệu từ API /api/v1/dashboard/approval-asset và approval-kcht.

Bảng khai thác: 10 dòng KCHT, 6 cột (Loại KCHT - bỏ tiêu đề, Tổng số lượng, Chưa khai thác/vận hành 2 dòng, Đang khai thác/vận hành 2 dòng, Dừng khai thác/vận hành 2 dòng, action). Pill badge dùng sea-blue palette (dataSea0/dataSea2/dataSea3). KHÔNG dùng green/yellow/red. Bỏ chấm tròn trạng thái ở header.

H-bar phê duyệt hiển thị dữ liệu approval (Đã duyệt/Chờ duyệt/Từ chối), không phải exploitation status.

## Acceptance Criteria

1. 2 ApprovalCard: stacked status bar token màu + legend + pending pill
2. Pending pill: activeBg/activeColor khi count>0, zeroBg/zeroColor khi count=0
3. Bảng khai thác 10 dòng KCHT, 6 cột (cột 1 bỏ tiêu đề)
4. Cột 3-5: header 2 dòng "Chưa/Đang/Dừng khai thác/vận hành", bỏ chấm tròn
5. Pill badge sea-blue palette (dataSea0/dataSea2/dataSea3) — BA decision confirmed
6. H-bar hiển thị approval data (Đã duyệt/Chờ duyệt/Từ chối) per category
7. Loading/Empty/Error states

## Dependencies

- F-280 (FilterBar)
- tokens-dashboard.ts: approvalApproved/Pending/Rejected, pendingActiveBg/Color, dataSea0/2/3
