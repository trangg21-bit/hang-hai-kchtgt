package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Yeu Cau Tang Tai San.
 */
@Data
@Builder
public class YeuCauTangTaiSanResponse {

    private UUID id;
    private UUID taiSanId;
    private String tenTaiSan;
    private int soLuong;
    private String donViTinh;
    private String lyDo;
    private String trangThai;
    private String maSoTang;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
