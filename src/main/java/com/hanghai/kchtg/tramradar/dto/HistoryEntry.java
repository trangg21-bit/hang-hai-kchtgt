package com.hanghai.kchtg.tramradar.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEntry {
    private Long id;
    private Integer capPheDuyet;
    private String trangThai;
    private String nguoiPheDuyet;
    private LocalDateTime ngayPheDuyet;
    private String lyDo;
}
