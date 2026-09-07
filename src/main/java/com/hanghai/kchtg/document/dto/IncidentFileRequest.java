package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

/**
 * Tệp sự cố payload (F-131 child incident_file).
 * fileCategory: 'INFO' (thông tin sự cố) | 'RESULT' (kết quả xử lý).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class IncidentFileRequest {

    private String fileName;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private String fileCategory;
}
