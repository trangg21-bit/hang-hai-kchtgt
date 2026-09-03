-- Nhật ký thao tác tệp đính kèm trước đây được ghi với status = 'UPDATED' chung
-- chung, nên giao diện tô nhãn/màu của "Cập nhật" cho cả dòng tải lên và xóa tệp.
-- Bảng infrastructure_history đã có sẵn hai trạng thái riêng; chuẩn hóa lại dữ
-- liệu cũ theo đúng nội dung đã ghi trong reason/changedField.
--
-- Chỉ đụng đúng các dòng thao tác tệp: điều kiện đòi hỏi cả changedField là
-- 'Tài liệu đính kèm' lẫn reason bắt đầu bằng câu mô tả tương ứng.

UPDATE public.infrastructure_history
SET status = 'ATTACHMENT_UPLOADED'
WHERE status = 'UPDATED'
  AND changed_field = 'Tài liệu đính kèm'
  AND reason LIKE 'Tải lên tài liệu đính kèm:%';

UPDATE public.infrastructure_history
SET status = 'ATTACHMENT_DELETED'
WHERE status = 'UPDATED'
  AND changed_field = 'Tài liệu đính kèm'
  AND reason LIKE 'Xóa tài liệu đính kèm:%';
