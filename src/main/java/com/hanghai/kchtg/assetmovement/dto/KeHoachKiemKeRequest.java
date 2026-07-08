package com.hanghai.kchtg.assetmovement.dto;

import com.hanghai.kchtg.assetmovement.entity.LoaiKiemKe;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.Instant;

/**
 * Request DTO cho Ke Hoach Kiem Ke (create/update).
 */
@Data
public class KeHoachKiemKeRequest {

    @NotBlank(message = "Tên kế hoạch không được để trống")
    private String tenKeHoach;

    private String phamVi;

    @NotNull(message = "Loại kiểm kê không được để trống")
    private LoaiKiemKe loaiKiemKe;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private Instant ngayBatDau;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private Instant ngayKetThuc;

    @NotBlank(message = "Tổ trưởng kiểm kê không được để trống")
    private String toTruongKiemKe;

    private String moTa;

    public String getPhamVi() {
        return phamVi != null ? phamVi : tenKeHoach;
    }
}
