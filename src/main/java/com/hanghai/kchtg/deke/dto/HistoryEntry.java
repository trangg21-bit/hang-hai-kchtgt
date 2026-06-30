package com.hanghai.kchtg.deke.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * History entry for approval timeline (F-049).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryEntry {

    private Long id;
    private Long deKeId;
    private Integer capPheDuyet;
    private String trangThai;
    private String nguoiPheDuyet;
    private LocalDate ngayPheDuyet;
    private String lyDo;
}
