package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoiYTimKiemResponse {

    private Long id;
    private String tuKhoa;
    private Integer soLuongTim;
    private LocalDateTime lanCuoiTim;
}
