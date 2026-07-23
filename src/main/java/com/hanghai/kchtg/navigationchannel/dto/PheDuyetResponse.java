package com.hanghai.kchtg.navigationchannel.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * Response DTO for a single approval action (F-039, F-040).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetResponse {

    private String id;
    private java.util.UUID navigationChannelId;
    private Integer capPheDuyet;
    private String trangThai;
    private String nguoiPheDuyet;
    private LocalDate ngayPheDuyet;
    private String lyDo;
}
