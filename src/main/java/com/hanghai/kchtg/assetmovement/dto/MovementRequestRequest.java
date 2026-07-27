package com.hanghai.kchtg.assetmovement.dto;

import lombok.Data;

/**
 * Request DTO cho Yeu Cau Bien Dong (create/update).
 */
@Data
public class MovementRequestRequest {

    private String movementType;
    private String assetName;
    private int quantity;
    private String description;
}
