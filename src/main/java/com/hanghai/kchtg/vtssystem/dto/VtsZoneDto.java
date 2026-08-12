package com.hanghai.kchtg.vtssystem.dto;

import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VtsZoneDto {
    private UUID id;
    private String code;
    private String name;
    private ConditionStatus conditionStatus;
}
