package com.hanghai.kchtg.vts.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeThongVTSResponse {
    private Long id;
    private String tenHeThong;
    private String viTri;
    private String tinhTrang;
    private String mucDoPhuTrach;
    private String nguonGoc;
    private String doiTac;
    private String trangThai;
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
}
