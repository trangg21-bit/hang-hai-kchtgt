package com.hanghai.kchtg.tramradar.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TramRadarAttachmentResponse {
    private Long id;
    private String tenTaiLieu;
    private String duongDan;
    private Long kichThuoc;
    private String loaiTaiLieu;
    private String nguoiTaiLen;
    private LocalDateTime ngayTaiLen;
}
