package com.hanghai.kchtg.orgunit.dto;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
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

    private UUID parentId;

    /** Optional description of the unit. */
    private String description;

    /** Province/city ID from the shared provinces catalogue. */
    private Integer provinceId;

    /** Detailed street address (optional). */
    @Size(max = 500, message = "Địa chỉ chi tiết tối đa 500 ký tự")
    private String detailAddress;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    /** Operational availability of the unit. */
    private OperationalStatus operationalStatus;

    /** Cấp đơn vị (rank). Optional — only applied when non-null (BR-003-13). */
    private OrgUnitRank rank;
}
