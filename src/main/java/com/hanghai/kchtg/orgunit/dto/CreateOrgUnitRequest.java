package com.hanghai.kchtg.orgunit.dto;

import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
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

    /** Parent unit ID (nullable — root unit if omitted). */
    private UUID parentId;

    /** Optional description of the unit. */
    private String description;

    /** Province/city ID from the shared provinces catalogue. */
    @NotNull(message = "Địa điểm (Tỉnh/Thành phố) không được để trống")
    private Integer provinceId;

    /** Detailed street address (optional). */
    @Size(max = 500, message = "Địa chỉ chi tiết tối đa 500 ký tự")
    private String detailAddress;

    @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
    private String phone;

    /** Operational availability. Defaults to ACTIVE when omitted. */
    private OperationalStatus operationalStatus;

    /** Cấp đơn vị (rank). Optional — inferred from parent when omitted (BR-003-12). */
    private OrgUnitRank rank;
}
