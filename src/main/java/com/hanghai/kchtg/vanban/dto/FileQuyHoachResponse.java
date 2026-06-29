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
public class FileQuyHoachResponse {

    private Long id;
    private Long quyHoachId;
    private String tenFile;
    private String loaiFile;
    private String duongDan;
    private Long kichThuoc;
    private LocalDateTime ngayTaiLen;
    private String nguoiTaiLen;
}
