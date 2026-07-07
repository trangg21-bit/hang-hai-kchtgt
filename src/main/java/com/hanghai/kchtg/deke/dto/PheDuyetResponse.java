package com.hanghai.kchtg.deke.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * Response DTO for a single approval action (F-045, F-046).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetResponse {

    private Long id;
    private Long deKeId;
    private Integer capPheDuyet;
    private String trangThai;
    private String nguoiPheDuyet;
    private LocalDate ngayPheDuyet;
    private String lyDo;
}
