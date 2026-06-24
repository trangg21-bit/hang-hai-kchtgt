package com.hanghai.kchtg.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for rate limit configuration display.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RateLimitConfigDTO {

    private int maxRequests;
    private long windowMinutes;
}