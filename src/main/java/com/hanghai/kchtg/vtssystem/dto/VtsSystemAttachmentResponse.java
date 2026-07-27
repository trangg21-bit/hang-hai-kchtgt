package com.hanghai.kchtg.vtssystem.dto;

import java.util.UUID;

import lombok.*;

import java.time.LocalDateTime;

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
    private String uploadedBy;
    private LocalDateTime uploadedDate;
}
