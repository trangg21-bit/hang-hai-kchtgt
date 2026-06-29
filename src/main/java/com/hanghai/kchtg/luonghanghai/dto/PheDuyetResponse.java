package com.hanghai.kchtg.luonghanghai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetResponse {

    private Long luongHangHaiId;
    private Integer capPheDuyet;
    private String trangThai;
    private String nguoiPheDuyet;
    private LocalDateTime ngayPheDuyet;
    private String lyDo;
}
