package com.hanghai.kchtg.assetmovement.dto;

import com.hanghai.kchtg.assetmovement.entity.TrangThaiKiemKe;
import lombok.Data;

import java.util.UUID;

/**
 * Request DTO cho Tai San Kiem Ke (create/update).
 */
@Data
public class TaiSanKiemKeRequest {

    private UUID keHoachId;
    private UUID taiSanId;
    private String tenTaiSan;
    private String trangThaiKiemKe;
    private int soLuongKyHienTai;
    private int soLuongKyThucTe;
    private java.math.BigDecimal giaTriSach;
    private java.math.BigDecimal giaTriThucTe;
    private String moTa;
    private String ghiChu;

    public java.math.BigDecimal getGiaTriSach() {
        return giaTriSach != null ? giaTriSach : java.math.BigDecimal.valueOf(soLuongKyHienTai);
    }

    public java.math.BigDecimal getGiaTriThucTe() {
        return giaTriThucTe != null ? giaTriThucTe : java.math.BigDecimal.valueOf(soLuongKyThucTe);
    }

    public String getGhiChu() {
        return ghiChu != null ? ghiChu : moTa;
    }
}
