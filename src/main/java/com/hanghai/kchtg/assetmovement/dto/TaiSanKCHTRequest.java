package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;

import com.hanghai.kchtg.assetmovement.entity.LoaiTaiSanKCHT;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request DTO cho Tai San KCHT (create/update).
 */
@Data
public class TaiSanKCHTRequest {

    private String maTaiSan;
    private LoaiTaiSanKCHT loaiTaiSan;
    private UUID loaiTaiSanId;
    private String tenTaiSan;
    private String moTa;
    private BigDecimal giaTri;
    private String trangThai;
    private String viTri;
    private String thongSoKyThuat;
    private String nguonKinhPhi;
    private BigDecimal nguyenGia;
}
