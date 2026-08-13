package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

/** Danh sách mã quyền chức năng được gán trực tiếp cho nhóm. */
@Getter
@Setter
@NoArgsConstructor
public class UpdateGroupPermissionsRequest {

    /** Có thể là danh sách rỗng để thu hồi toàn bộ quyền của nhóm. */
    @NotNull(message = "Danh sách quyền không được để trống")
    private List<String> permissions = new ArrayList<>();
}
