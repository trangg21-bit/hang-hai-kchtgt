package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;
import lombok.Data;

/**
 * Request DTO cho Yeu Cau Tang Tai San (create/update).
 */
@Data
public class YeuCauTangTaiSanRequest {

    private UUID taiSanId;
    private String tenTaiSan;
    private int soLuong;
    private String donViTinh;
    private String lyDo;
    private String maSoTang;
}
