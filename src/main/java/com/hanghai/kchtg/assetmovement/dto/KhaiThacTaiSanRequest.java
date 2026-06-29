package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request DTO cho Khai Thac Tai San (create/update).
 */
@Data
public class KhaiThacTaiSanRequest {

    private UUID taiSanId;
    private String tenTaiSan;
    private Integer namKhaiThac;
    private BigDecimal doanhThu;
    private BigDecimal haoMon;
    private String moTa;
}
