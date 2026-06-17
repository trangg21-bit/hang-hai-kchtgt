package com.hanghai.kchtg.orgunit.dto;

import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

/**
 * Request body for creating a new organisational unit.
 */
@Data
public class CreateOrgUnitRequest {

    @NotBlank(message = "Tên đơn vị không được để trống")
    @Size(max = 200, message = "Tên đơn vị tối đa 200 ký tự")
    private String name;

    @NotBlank(message = "Mã đơn vị không được để trống")
    @Size(max = 50, message = "Mã đơn vị tối đa 50 ký tự")
    private String code;

    /**
     * Parent unit ID (nullable — root unit if omitted).
     */
    private UUID parentId;

    @NotNull(message = "Loại đơn vị không được để trống")
    private OrgUnitType type;

    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    private String address;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    /**
     * Status — defaults to {@code ACTIVE} on the service layer if not provided.
     */
    private OrgUnitStatus status;
}
