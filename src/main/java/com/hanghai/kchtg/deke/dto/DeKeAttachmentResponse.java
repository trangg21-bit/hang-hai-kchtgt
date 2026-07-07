package com.hanghai.kchtg.deke.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for DeKe attachments (F-042).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeKeAttachmentResponse {

    private Long id;
    private String tenTaiLieu;
    private String duongDan;
    private Long kichThuoc;
    private String loaiTaiLieu;
    private String nguoiTaiLen;
    private LocalDate ngayTaiLen;
}
