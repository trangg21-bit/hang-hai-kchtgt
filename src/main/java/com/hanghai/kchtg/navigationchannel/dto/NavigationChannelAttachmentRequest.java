package com.hanghai.kchtg.navigationchannel.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.hanghai.kchtg.common.enums.AttachmentFileType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

/**
 * Create/update payload for an attachment (#46) of NavigationChannel (F-038).
 * Stored in infrastructure_attachments with refType = NAVIGATION_CHANNEL.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class NavigationChannelAttachmentRequest {

    private String fileName;

    @JsonAlias({"fileUrl", "url", "path"})
    private String filePath;

    private Long fileSize;

    @JsonAlias({"contentType", "type"})
    private AttachmentFileType fileType;

    public void setFileUrl(String fileUrl) {
        if (this.filePath == null || this.filePath.isBlank()) {
            this.filePath = fileUrl;
        }
    }

    public void setContentType(Object contentType) {
        if (this.fileType == null && contentType != null) {
            this.fileType = AttachmentFileType.fromValue(contentType);
        }
    }
}
