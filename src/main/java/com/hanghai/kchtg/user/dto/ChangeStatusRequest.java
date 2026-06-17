package com.hanghai.kchtg.user.dto;

import com.hanghai.kchtg.user.entity.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO yĂªu cáº§u thay Ä‘á»•i tráº¡ng thĂ¡i tĂ i khoáº£n.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChangeStatusRequest {

    @NotNull(message = "Tráº¡ng thĂ¡i khĂ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng")
    private UserStatus status;
}
