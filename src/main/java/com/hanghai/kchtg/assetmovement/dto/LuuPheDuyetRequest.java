package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;
import lombok.Data;

/**
 * Request DTO cho Luu Phe Duyet (create/update).
 */
@Data
public class LuuPheDuyetRequest {

    private UUID yeuCauId;
    private String loaiYeuCau;
    private String ketQua;
    private String nguoiPheDuyet;
    private String ghiChu;
}
