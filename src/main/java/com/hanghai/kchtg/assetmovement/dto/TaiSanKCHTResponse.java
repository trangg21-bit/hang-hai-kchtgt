package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response DTO cho Tai San KCHT.
 */
@Data
@Builder
public class TaiSanKCHTResponse {

    private UUID id;
    private String maTaiSan;
    private UUID loaiTaiSanId;
    private String loaiTaiSan;
    private String tenTaiSan;
    private String moTa;
    private BigDecimal giaTri;
    private String trangThai;
    private String viTri;
    private String thongSoKyThuat;
    private String nguonKinhPhi;
    private BigDecimal nguyenGia;
    private BigDecimal haoMonLucKe;
    private BigDecimal giaTriConLai;
    private UUID createdBy;
    private String createdByName;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}
