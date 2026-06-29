package com.hanghai.kchtg.assetmovement.dto;

import com.hanghai.kchtg.assetmovement.entity.LoaiKiemKe;
import lombok.Data;
import java.time.Instant;

/**
 * Request DTO cho Ke Hoach Kiem Ke (create/update).
 */
@Data
public class KeHoachKiemKeRequest {

    private String tenKeHoach;
    private String phamVi;
    private LoaiKiemKe loaiKiemKe;
    private Instant ngayBatDau;
    private Instant ngayKetThuc;
    private String toTruongKiemKe;
    private String moTa;

    public String getPhamVi() {
        return phamVi != null ? phamVi : tenKeHoach;
    }
}
