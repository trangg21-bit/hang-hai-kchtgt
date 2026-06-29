package com.hanghai.kchtg.luonghanghai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LuongHangHaiAttachmentResponse {

    private Long id;
    private String tenTaiLieu;
    private String duongDan;
    private Long kichThuoc;
    private LocalDate ngayTaiLen;
}
