package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

/**
 * DTO táº¡o má»›i tĂ i khoáº£n ngÆ°á»i dĂ¹ng.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {

    @NotBlank(message = "Username khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    @Size(min = 3, max = 100, message = "Username pháº£i tá»« 3 Ä‘áº¿n 100 kĂ½ tá»±")
    private String username;

    @NotBlank(message = "Máº­t kháº©u khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    @Size(min = 6, max = 100, message = "Máº­t kháº©u pháº£i tá»« 6 Ä‘áº¿n 100 kĂ½ tá»±")
    private String password;

    @NotBlank(message = "Email khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    @Email(message = "Email khĂ´ng Ä‘Ăºng Ä‘á»‹nh dáº¡ng")
    @Size(max = 150, message = "Email khĂ´ng Ä‘Æ°á»£c vÆ°á»£t quĂ¡ 150 kĂ½ tá»±")
    private String email;

    @Size(max = 200, message = "Há» tĂªn khĂ´ng Ä‘Æ°á»£c vÆ°á»£t quĂ¡ 200 kĂ½ tá»±")
    private String fullName;

    @Size(max = 20, message = "Sá»‘ Ä‘iá»‡n thoáº¡i khĂ´ng Ä‘Æ°á»£c vÆ°á»£t quĂ¡ 20 kĂ½ tá»±")
    private String phone;

    /** Vai trĂ² (e.g. ROLE_USER, ROLE_ADMIN). Máº·c Ä‘á»‹nh lĂ  ROLE_USER. */
    @Size(max = 50, message = "Role khĂ´ng Ä‘Æ°á»£c vÆ°á»£t quĂ¡ 50 kĂ½ tá»±")
    private String role;

    private UUID orgUnitId;

    private List<UUID> groupIds;
}
