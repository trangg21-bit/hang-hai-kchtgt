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
public class TraCuuLogResponse {

    private Long id;
    private String nguoiTraCuu;
    private String tuKhoa;
    private String boLoc;
    private Integer soLuongKetQua;
    private LocalDateTime ngayTraCuu;
}
