package com.hanghai.kchtg.vanban.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoiYTimKiemResponse {

    private Long id;
    private String tuKhoa;
    private Integer soLuongTim;
}
