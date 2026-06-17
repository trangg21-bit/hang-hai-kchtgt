package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body cho viá»‡c cáº­p nháº­t Role.
 * Táº¥t cáº£ cĂ¡c trÆ°á»ng Ä‘á»u optional â€” chá»‰ nhá»¯ng trÆ°á»ng khĂ¡c null sáº½ Ä‘Æ°á»£c cáº­p nháº­t.
 */
public class UpdateRoleRequest {

    @Size(max = 100, message = "TĂªn vai trĂ² tá»‘i Ä‘a 100 kĂ½ tá»±")
    private String name;

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
