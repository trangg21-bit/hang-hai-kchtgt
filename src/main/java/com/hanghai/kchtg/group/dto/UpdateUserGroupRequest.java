package com.hanghai.kchtg.group.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.hanghai.kchtg.group.entity.GroupStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * Request body cho việc cập nhật UserGroup.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateUserGroupRequest {

    @Size(min = 2, max = 100, message = "Tên nhóm phải từ 2 đến 100 ký tự")
    private String name;

    @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
    private String description;

    private GroupStatus status;

}
