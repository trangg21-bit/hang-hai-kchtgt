package com.hanghai.kchtg.dikerevetment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for DikeRevetment attachments (F-042).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DikeRevetmentAttachmentResponse {

    private Long id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String loaiTaiLieu;
    private String nguoiTaiLen;
    private LocalDate uploadDate;
}
