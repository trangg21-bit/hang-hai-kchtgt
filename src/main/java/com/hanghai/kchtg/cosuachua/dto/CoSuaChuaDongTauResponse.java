package com.hanghai.kchtg.cosuachua.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoSuaChuaDongTauResponse {

    private Long id;
    private String tenCoSo;
    private String diaChi;
    private String tinhThanh;
    private String soDienThoai;
    private String email;
    private String loaiCoSo;
    private String khaNang;
    private String chuQuan;
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
    private Boolean isDeleted;
    private List<CoSuaChuaDongTauAttachmentResponse> attachments;
}
