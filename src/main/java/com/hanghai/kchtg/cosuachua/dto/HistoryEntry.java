package com.hanghai.kchtg.cosuachua.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryEntry {

    private Long id;
    private Integer capPheDuyet;
    private String trangThai;
    private String nguoiPheDuyet;
    private LocalDateTime ngayPheDuyet;
    private String lyDo;
}
