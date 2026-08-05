package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Danh sách đầy đủ role được chọn cho nhóm. */
@Getter
@Setter
@NoArgsConstructor
public class UpdateGroupRolesRequest {

    @NotNull(message = "Danh sách vai trò không được để trống")
    private List<UUID> roleIds = new ArrayList<>();
}
