package com.hanghai.kchtg.orgunit.dto;

import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.UUID;

/**
 * Request body for creating a new organisational unit.
 *
 * <p>
 * Validates BR-013 (unique code), BR-017 (coefficient > 0, max 2 decimals),
 * BR-003-08 (name required, max 200).
 * </p>
 */
@Data
public class CreateOrgUnitRequest {

    @NotBlank(message = "Tên đơn vị không được để trống")
    @Size(max = 200, message = "Tên đơn vị tối đa 200 ký tự")
    private String name;

    @NotBlank(message = "Mã đơn vị không được để trống")
    @Size(max = 50, message = "Mã đơn vị tối đa 50 ký tự")
    private String code;

    /** Parent unit ID (nullable — root unit if omitted). */
    private UUID parentId;

    @NotNull(message = "Loại đơn vị không được để trống")
    private OrgUnitType type;

    /** Optional description of the unit. */
    private String description;

    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    private String address;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    /** Coefficient for calculations/reports. Must be > 0, max 2 decimal places. BR-017 */
    @DecimalMin(value = "0.01", message = "Hệ số phải lớn hơn 0")
    private java.math.BigDecimal coefficient;

    /** Status — defaults to DRAFT on the service layer if not provided. */
    private OrgUnitStatus status;
}
