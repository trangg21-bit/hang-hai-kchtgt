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

    @NotBlank(message = "TĂªn Ä‘Æ¡n vá»‹ khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    @Size(max = 200, message = "TĂªn Ä‘Æ¡n vá»‹ tá»‘i Ä‘a 200 kĂ½ tá»±")
    private String name;

    @NotBlank(message = "MĂ£ Ä‘Æ¡n vá»‹ khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    @Size(max = 50, message = "MĂ£ Ä‘Æ¡n vá»‹ tá»‘i Ä‘a 50 kĂ½ tá»±")
    private String code;

    /**
     * Parent unit ID (nullable â€” root unit if omitted).
     */
    private UUID parentId;

    @NotNull(message = "Loáº¡i Ä‘Æ¡n vá»‹ khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    private OrgUnitType type;

    @Size(max = 500, message = "Äá»‹a chá»‰ tá»‘i Ä‘a 500 kĂ½ tá»±")
    private String address;

    @Size(max = 20, message = "Sá»‘ Ä‘iá»‡n thoáº¡i tá»‘i Ä‘a 20 kĂ½ tá»±")
    private String phone;

    /**
     * Status â€” defaults to {@code ACTIVE} on the service layer if not provided.
     */
    private OrgUnitStatus status;
}
