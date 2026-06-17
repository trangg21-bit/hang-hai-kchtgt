package com.hanghai.kchtg.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO yĂªu cáº§u Ä‘áº·t láº¡i máº­t kháº©u ngÆ°á»i dĂ¹ng.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Máº­t kháº©u má»›i khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    @Size(min = 8, message = "Máº­t kháº©u má»›i pháº£i cĂ³ Ă­t nháº¥t 8 kĂ½ tá»±")
    private String newPassword;
}
