package com.hanghai.kchtg.navigationchannel.dto;

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
    private String filePath;
    private Long fileSize;
    private AttachmentFileType fileType;
}
