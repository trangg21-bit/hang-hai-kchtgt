package com.hanghai.kchtg.cosuachua.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoSuaChuaDongTauAttachmentResponse {

    private Long id;
    private String tenTaiLieu;
    private String duongDan;
    private Long kichThuoc;
    private String loaiTaiLieu;
    private String nguoiTaiLen;
    private LocalDateTime ngayTaiLen;
}
