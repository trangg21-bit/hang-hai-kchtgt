package com.hanghai.kchtg.vtssystem.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VtsSystemAttachmentResponse {
    private UUID id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String documentType;
    private UUID uploadedBy;
    private LocalDateTime uploadedDate;
}
