package com.hanghai.kchtg.vts.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeThongVTSUpdateRequest {
    private String tenHeThong;
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
