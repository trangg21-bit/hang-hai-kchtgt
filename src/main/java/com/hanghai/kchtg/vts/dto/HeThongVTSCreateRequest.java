package com.hanghai.kchtg.vts.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeThongVTSCreateRequest {
    @NotBlank(message = "Tên hệ thống không được để trống")
    private String tenHeThong;

    @NotBlank(message = "Vị trí không được để trống")
    private String viTri;

    private com.hanghai.kchtg.vts.entity.TinhTrangVTS tinhTrang;
    private String mucDoPhuTrach;
    private String nguonGoc;
    private String doiTac;
    private java.util.UUID orgUnitId;
    private String phamViApDung;

    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;
}
