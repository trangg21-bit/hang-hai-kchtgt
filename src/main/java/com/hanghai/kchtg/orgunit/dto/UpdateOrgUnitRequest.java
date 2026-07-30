package com.hanghai.kchtg.orgunit.dto;

import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitOperationalStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import jakarta.validation.constraints.Size;
import lombok.Data;

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

    /** Detailed street address (optional). */
    @Size(max = 500, message = "Địa chỉ chi tiết tối đa 500 ký tự")
    private String detailAddress;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    @Size(max = 200, message = "Trưởng đơn vị tối đa 200 ký tự")
    private String contactPerson;

    /** Status — can be used to submit for approval (PENDING). */
    private OrgUnitStatus status;

    /** Operational availability of the unit. */
    private OrgUnitOperationalStatus operationalStatus;
}
