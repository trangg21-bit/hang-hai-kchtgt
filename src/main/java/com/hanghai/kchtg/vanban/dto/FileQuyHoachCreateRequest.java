package com.hanghai.kchtg.vanban.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileQuyHoachCreateRequest {

    @NotNull
    private Long quyHoachId;

    @NotNull
    private String tenFile;

    private String loaiFile;

    @NotNull
    private String duongDan;

    private Long kichThuoc;
}
