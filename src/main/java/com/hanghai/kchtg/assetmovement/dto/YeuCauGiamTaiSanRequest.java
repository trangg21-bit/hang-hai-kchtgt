package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;
import lombok.Data;

/**
 * Request DTO cho Yeu Cau Giam Tai San (create/update).
 */
@Data
public class YeuCauGiamTaiSanRequest {

    private UUID taiSanId;
    private String tenTaiSan;
    private int soLuong;
    private String donViTinh;
    private String lyDo;
    private String nguyenNhanGiam;
}
