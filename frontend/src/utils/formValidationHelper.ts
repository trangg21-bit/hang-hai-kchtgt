import toast from '../components/ToastNotification';

/**
 * Tự động chuyển tab khi Form Ant Design gặp lỗi validation ở tab bị ẩn.
 * 
 * @param errorInfo Đối tượng lỗi trả về từ onFinishFailed (Form) hoặc catch block của validateFields
 * @param tabMapping Bản đồ map giữa key của Tab và danh sách tên các trường (Form.Item name) thuộc tab đó
 * @param setTabActiveKey Hàm cập nhật state activeKey của component Tabs (ví dụ: setTabKey hoặc setActiveTab)
 */
export const focusErrorTab = (
  errorInfo: any,
  tabMapping: Record<string, string[]>,
  setTabActiveKey: (key: string) => void
) => {
  const errorFields = errorInfo?.errorFields;
  if (errorFields && errorFields.length > 0) {
    const firstErrorFieldName = errorFields[0]?.name?.[0];
    if (firstErrorFieldName) {
      const fieldNameStr = String(firstErrorFieldName);
      
      // Tìm kiếm xem trường lỗi đầu tiên thuộc tab nào để tự động chuyển tab
      for (const [tabKey, fields] of Object.entries(tabMapping)) {
        if (fields.includes(fieldNameStr)) {
          setTabActiveKey(tabKey);
          break;
        }
      }

      // Tự động cuộn đến trường lỗi đầu tiên sau khi tab được chuyển
      setTimeout(() => {
        try {
          const el = document.getElementById(fieldNameStr) ||
            document.querySelector(`[name="${fieldNameStr}"]`) ||
            document.querySelector(`.ant-form-item-has-error`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (typeof (el as HTMLElement).focus === 'function') {
              (el as HTMLElement).focus();
            }
          }
        } catch {
          // ignore scroll errors
        }
      }, 80);
    }

    // Hiển thị cảnh báo toast nhắc nhở
    const firstErrorMsg = errorFields[0]?.errors?.[0];
    toast.warning(firstErrorMsg || 'Vui lòng nhập đầy đủ các thông tin bắt buộc (*)');
  }
};
