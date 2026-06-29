package com.hanghai.kchtg.assetmovement.dto;

import lombok.Data;

import java.util.UUID;

/**
 * Request DTO cho Ho So Xu Ly Tai San (create/update).
 */
@Data
public class HoSoXuLyTaiSanRequest {

    private UUID taiSanId;
    private String tenTaiSan;
    private String loaiXuLy;
    private String benNhan;
    private String lyDoXuLy;
    private String moTa;
}
