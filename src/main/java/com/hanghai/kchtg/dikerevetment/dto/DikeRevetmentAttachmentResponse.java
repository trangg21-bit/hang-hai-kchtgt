package com.hanghai.kchtg.dikerevetment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Response DTO for DikeRevetment attachments (F-042).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DikeRevetmentAttachmentResponse {

    private UUID id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String documentType;
    private String uploadedBy;
    private LocalDate uploadDate;
}
