package com.hanghai.kchtg.orgunit.dto;

import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.UUID;

/**
 * Request body for partial update of an existing organisational unit.
 * All fields are optional — only non-null fields are applied.
 */
@Data
public class UpdateOrgUnitRequest {

    @Size(max = 200, message = "Tên đơn vị tối đa 200 ký tự")
    private String name;

    @Size(max = 50, message = "Mã đơn vị tối đa 50 ký tự")
    private String code;

    private UUID parentId;

    private OrgUnitType type;

    /** Optional description of the unit. */
    private String description;

    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    private String address;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    @Size(max = 200, message = "Trưởng đơn vị tối đa 200 ký tự")
    private String contactPerson;

    /** Coefficient: > 0, max 2 decimal places. BR-017 */
    @DecimalMin(value = "0.01", message = "Hệ số phải lớn hơn 0")
    private java.math.BigDecimal coefficient;

    /** Status — can be used to submit for approval (PENDING). */
    private OrgUnitStatus status;
}
