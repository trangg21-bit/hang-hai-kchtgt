package com.hanghai.kchtg.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request body cho viá»‡c thĂªm thĂ nh viĂªn vĂ o nhĂ³m.
 */
public class AddGroupMemberRequest {

    @NotNull(message = "ID ngÆ°á»i dĂ¹ng khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    private UUID userId;

    private String role = "member";

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
