package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body cho viá»‡c táº¡o má»›i Role.
 */
public class CreateRoleRequest {

    @NotBlank(message = "TĂªn vai trĂ² khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    @Size(max = 100, message = "TĂªn vai trĂ² tá»‘i Ä‘a 100 kĂ½ tá»±")
    private String name;

    @NotBlank(message = "Code vai trĂ² khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    @Size(max = 50, message = "Code vai trĂ² tá»‘i Ä‘a 50 kĂ½ tá»±")
    private String code;

    @Size(max = 500, message = "MĂ´ táº£ tá»‘i Ä‘a 500 kĂ½ tá»±")
    private String description;

    private List<String> permissions;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
}
