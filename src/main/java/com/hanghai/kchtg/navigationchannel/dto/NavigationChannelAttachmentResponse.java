package com.hanghai.kchtg.navigationchannel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for NavigationChannel attachments (F-038, F-042).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NavigationChannelAttachmentResponse {

    private Long id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private LocalDate uploadDate;
}
