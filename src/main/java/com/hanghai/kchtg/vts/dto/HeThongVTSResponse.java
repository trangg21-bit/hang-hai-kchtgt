package com.hanghai.kchtg.vts.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeThongVTSResponse {
    private java.util.UUID id;
    private String tenHeThong;
    private String viTri;
    private com.hanghai.kchtg.vts.entity.TinhTrangVTS tinhTrang;
    private String mucDoPhuTrach;
    private String nguonGoc;
    private String doiTac;
    private java.util.UUID orgUnitId;
    private String phamViApDung;
    private com.hanghai.kchtg.vts.entity.HeThongVTSApprovalStatus trangThai;
    private Boolean pheDuyetC1;
    private String nguoiPheDuyetC1;
    private LocalDateTime ngayPheDuyetC1;
    private Boolean pheDuyetC2;
    private String nguoiPheDuyetC2;
    private LocalDateTime ngayPheDuyetC2;
    private String lyDoTuChoi;
    private String nguoiTao;
    private LocalDateTime ngayTao;
    private String nguoiSuaDoi;
    private LocalDateTime ngaySuaDoi;
    private List<HeThongVTSAttachmentResponse> attachments;

    private java.util.UUID khongGianId;
    private com.hanghai.kchtg.gis.spatial.entity.GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;
}
