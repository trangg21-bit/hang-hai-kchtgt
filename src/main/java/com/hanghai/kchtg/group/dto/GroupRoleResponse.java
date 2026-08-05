package com.hanghai.kchtg.group.dto;

import com.hanghai.kchtg.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/** Vai trò hiện đang được gán cho một nhóm. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupRoleResponse {

    private UUID id;
    private String name;
    private String code;
    private String description;
    private Integer level;
    private Integer hierarchyDepth;

    public static GroupRoleResponse from(Role role) {
        return new GroupRoleResponse(
                role.getId(),
                role.getName(),
                role.getCode(),
                role.getDescription(),
                role.getLevel(),
                role.getHierarchyDepth());
    }
}
