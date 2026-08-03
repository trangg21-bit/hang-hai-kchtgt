package com.hanghai.kchtg.group.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hanghai.kchtg.group.entity.GroupStatus;
import com.hanghai.kchtg.group.entity.GroupType;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request body cho việc cập nhật UserGroup (BR-012: groupType).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateUserGroupRequest {

    @Size(max = 100, message = "Tên nhóm tối đa 100 ký tự")
    private String name;

    @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
    private String description;

    private GroupType groupType;

    private GroupStatus status;
}
