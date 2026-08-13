package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/** Request thêm nhiều thành viên trong một giao dịch nguyên tử. */
@Data
public class BatchAddGroupMembersRequest {

    @NotEmpty(message = "Vui lòng chọn ít nhất một người dùng")
    @Size(max = 100, message = "Mỗi lần chỉ được thêm tối đa 100 người dùng")
    private List<@NotNull(message = "ID người dùng không được để trống") UUID> userIds;
}
