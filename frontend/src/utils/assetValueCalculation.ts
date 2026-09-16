import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

/**
 * Kiểm tra xem một năm có phải là năm nhuận theo lịch Gregory hay không.
 * Năm nhuận chia hết cho 4 và không chia hết cho 100, hoặc chia hết cho 400.
 */
export function isLeapYear(year: number): boolean {
  if (!year || isNaN(year)) return false;
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Lấy số ngày trong năm (366 ngày nếu là năm nhuận, 365 ngày nếu năm thường).
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/**
 * Tính số năm khấu hao chính xác theo ngày dựa trên số ngày trong năm của Ngày tính khấu hao.
 * Công thức:
 * soNgayTrongNam = 366 nếu năm của "Ngày tính khấu hao" là năm nhuận, ngược lại 365
 * soNamKhauHao = (Ngày hết khấu hao − Ngày tính khấu hao, tính theo ngày) / soNgayTrongNam
 */
export function calculateDepreciationYears(
  startDate?: Dayjs | string | Date | null,
  endDate?: Dayjs | string | Date | null
): number | undefined {
  if (!startDate || !endDate) return undefined;
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  if (!start.isValid() || !end.isValid() || end.isBefore(start)) return undefined;

  const soNgayTrongNam = getDaysInYear(start.year());
  const diffDays = end.diff(start, 'day');
  return diffDays / soNgayTrongNam;
}

/**
 * Tính Giá trị còn lại tại Form Thêm mới / Sửa tài sản.
 * Công thức: Giá trị còn lại = Nguyên giá − Khấu hao lũy kế
 */
export function calculateInitialRemainingValue(
  originalValue?: number | string | null,
  accumulatedDepreciation?: number | string | null
): number | undefined {
  if (originalValue == null || originalValue === '') return undefined;
  const orig = Number(originalValue);
  if (isNaN(orig)) return undefined;
  const acc = Number(accumulatedDepreciation) || 0;
  return Math.max(0, Math.round(orig - acc));
}

export interface AssetAdjustmentCalcParams {
  originalValueAfter?: number | string | null;
  depreciationRate?: number | string | null;
  depreciationStartDate?: Dayjs | string | Date | null;
  depreciationEndDate?: Dayjs | string | Date | null;
  accumulatedDepreciationManual?: number | string | null;
  depreciationMonths?: number | string | null;
}

export interface AssetAdjustmentCalcResult {
  accumulatedDepreciation?: number;
  remainingValueAfter?: number;
  monthlyDepreciation?: number;
  depreciationYears?: number;
  isAutoCalculated: boolean;
}

/**
 * Tính toán toàn diện Khấu hao và Giá trị còn lại sau khi Tăng/Giảm nguyên giá:
 * 1. soNgayTrongNam = 366 nếu năm của "Ngày tính khấu hao" là năm nhuận, ngược lại 365
 * 2. soNamKhauHao = (Ngày hết khấu hao − Ngày tính khấu hao, tính theo ngày) / soNgayTrongNam
 * 3. Khấu hao lũy kế (mới) = ROUND( NguyênGiáSau × (Tỷ lệ hao mòn/Khấu hao % / 100) × soNamKhauHao )
 * 4. Giá trị còn lại sau = ROUND( NguyênGiáSau − Khấu hao lũy kế (mới) )
 * 5. Fallback: Nếu thiếu điều kiện (thiếu ngày/tỷ lệ) nhưng người dùng tự sửa tay "Khấu hao lũy kế":
 *    Giá trị còn lại sau = ROUND( NguyênGiáSau − Khấu hao lũy kế (nhập tay) )
 * 6. Khấu hao tháng = ROUND( Khấu hao lũy kế / Số tháng tính khấu hao )
 */
export function calculateAssetAdjustmentValues(
  params: AssetAdjustmentCalcParams
): AssetAdjustmentCalcResult {
  const orig = Number(params.originalValueAfter);
  if (params.originalValueAfter == null || isNaN(orig)) {
    return { isAutoCalculated: false };
  }

  const rate = Number(params.depreciationRate);
  const years = calculateDepreciationYears(
    params.depreciationStartDate,
    params.depreciationEndDate
  );

  let finalAccDep: number | undefined;
  let isAuto = false;

  // Bước 1-3: Tính tự động theo ngày & tỷ lệ nếu đủ thông tin
  if (!isNaN(rate) && rate > 0 && years !== undefined && years >= 0) {
    finalAccDep = Math.round(orig * (rate / 100) * years);
    isAuto = true;
  } else if (
    params.accumulatedDepreciationManual != null &&
    params.accumulatedDepreciationManual !== ''
  ) {
    // Bước 5: Fallback người dùng nhập tay khấu hao lũy kế
    const manual = Number(params.accumulatedDepreciationManual);
    if (!isNaN(manual)) {
      finalAccDep = Math.round(manual);
    }
  } else {
    // Mặc định khi chưa nhập khấu hao lũy kế hoặc chưa đủ thông tin ngày/tỷ lệ:
    // Khấu hao lũy kế = 0, Giá trị còn lại sau = Nguyên giá sau
    finalAccDep = 0;
  }

  // Bước 4: Giá trị còn lại sau
  const remainingValueAfter = Math.max(0, Math.round(orig - (finalAccDep || 0)));

  // Tính kèm Khấu hao tháng
  const months = Number(params.depreciationMonths);
  let monthlyDepreciation: number | undefined;
  if (finalAccDep !== undefined && !isNaN(months) && months > 0) {
    monthlyDepreciation = Math.round(finalAccDep / months);
  }

  return {
    accumulatedDepreciation: finalAccDep,
    remainingValueAfter,
    monthlyDepreciation,
    depreciationYears: years,
    isAutoCalculated: isAuto,
  };
}

/**
 * Validate nghiệp vụ khi Lưu thông tin điều chỉnh nguyên giá:
 * - Nếu Tăng: nguyenGiaSau > nguyenGiaTruoc (bắt buộc)
 * - Nếu Giảm: nguyenGiaSau < nguyenGiaTruoc (bắt buộc)
 */
export function validateAdjustmentOriginalValue(
  mode: 'increase' | 'decrease',
  originalValueAfter?: number | string | null,
  originalValueBefore?: number | string | null
): { isValid: boolean; message?: string } {
  if (originalValueAfter == null || originalValueAfter === '') {
    return { isValid: false, message: 'Vui lòng nhập nguyên giá sau điều chỉnh.' };
  }

  const after = Number(originalValueAfter);
  const before = Number(originalValueBefore || 0);

  if (isNaN(after)) {
    return { isValid: false, message: 'Nguyên giá sau điều chỉnh không hợp lệ.' };
  }

  if (mode === 'increase' && after <= before) {
    return {
      isValid: false,
      message: 'Nguyên giá sau điều chỉnh phải lớn hơn nguyên giá hiện tại.',
    };
  }

  if (mode === 'decrease' && after >= before) {
    return {
      isValid: false,
      message: 'Nguyên giá sau điều chỉnh phải nhỏ hơn nguyên giá hiện tại.',
    };
  }

  return { isValid: true };
}
