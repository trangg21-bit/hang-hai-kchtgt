package com.hanghai.kchtg.dikerevetment.dto;

import java.util.UUID;

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

    private UUID id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String documentType;
    private String uploadedBy;
    private LocalDate uploadDate;
}
