package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;
import lombok.Data;

/**
 * Request DTO cho Bao Cao Kiem Ke (create/update).
 */
@Data
public class BaoCaoKiemKeRequest {

    private UUID keHoachId;
    private String tenBaoCao;
    private int tongSoLuong;
    private int soLuongChenhLech;
    private String ketQua;
    private String moTa;
}
