package com.hanghai.kchtg.orgunit.dto;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import jakarta.validation.constraints.NotBlank;
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

    /** Unit code — auto-generated if not provided. */
    @Size(max = 50, message = "Mã đơn vị tối đa 50 ký tự")
    private String code;

    /** Parent unit ID (nullable — root unit if omitted). */
    private UUID parentId;

    /** Optional description of the unit. */
    private String description;

    @NotBlank(message = "Địa điểm (Tỉnh/Thành phố) không được để trống")
    @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
    private String address;

    /** Detailed street address (optional). */
    @Size(max = 500, message = "Địa chỉ chi tiết tối đa 500 ký tự")
    private String detailAddress;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    @Size(max = 200, message = "Trưởng đơn vị tối đa 200 ký tự")
    private String contactPerson;

    /** Status — defaults to DRAFT on the service layer if not provided. */
    private OrgUnitStatus status;

    /** Operational availability. Defaults to ACTIVE when omitted. */
    private OperationalStatus operationalStatus;
}
