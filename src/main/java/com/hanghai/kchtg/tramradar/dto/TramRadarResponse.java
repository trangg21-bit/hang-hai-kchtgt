package com.hanghai.kchtg.tramradar.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TramRadarResponse {
    private Long id;
    private String tenTram;
    private String viTri;
    private BigDecimal kinhDo;
    private BigDecimal viDo;
    private String loaiTram;
    private String coTrinh;
    private BigDecimal dienTichPhaXa;
    private String nguonGoc;
    private String tinhTrang;
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
    private List<TramRadarAttachmentResponse> attachments;
}
