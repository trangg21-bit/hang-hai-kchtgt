package com.hanghai.kchtg.orgunit.dto;

import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

/**
 * Request body for partial update of an existing organisational unit.
 * All fields are optional â€” only non-null fields are applied.
 */
@Data
public class UpdateOrgUnitRequest {

    @Size(max = 200, message = "TĂªn Ä‘Æ¡n vá»‹ tá»‘i Ä‘a 200 kĂ½ tá»±")
    private String name;

    @Size(max = 50, message = "MĂ£ Ä‘Æ¡n vá»‹ tá»‘i Ä‘a 50 kĂ½ tá»±")
    private String code;

    private UUID parentId;

    private OrgUnitType type;

    @Size(max = 500, message = "Äá»‹a chá»‰ tá»‘i Ä‘a 500 kĂ½ tá»±")
    private String address;

    @Size(max = 20, message = "Sá»‘ Ä‘iá»‡n thoáº¡i tá»‘i Ä‘a 20 kĂ½ tá»±")
    private String phone;

    private OrgUnitStatus status;
}
