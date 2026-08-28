package com.hanghai.kchtg.common.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request body tùy chọn cho endpoint gửi phê duyệt (POST /{id}/submit):
 * cho phép người gửi kèm nội dung/ý kiến (lưu vào approvalContentLevel1 — #54).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubmitContentRequest {
    private String content;
}
