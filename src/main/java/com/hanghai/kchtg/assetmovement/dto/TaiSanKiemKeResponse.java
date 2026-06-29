package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Tai San Kiem Ke.
 */
@Data
@Builder
public class TaiSanKiemKeResponse {

    private UUID id;
    private UUID keHoachId;
    private UUID taiSanId;
    private String tenTaiSan;
    private String trangThaiKiemKe;
    private int soLuongKyHienTai;
    private int soLuongKyThucTe;
    private String moTa;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
