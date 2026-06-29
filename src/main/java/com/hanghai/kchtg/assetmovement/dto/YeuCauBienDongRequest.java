package com.hanghai.kchtg.assetmovement.dto;

import lombok.Data;

/**
 * Request DTO cho Yeu Cau Bien Dong (create/update).
 */
@Data
public class YeuCauBienDongRequest {

    private String loaiBienDong;
    private String tenTaiSan;
    private int soLuong;
    private String moTa;
}
