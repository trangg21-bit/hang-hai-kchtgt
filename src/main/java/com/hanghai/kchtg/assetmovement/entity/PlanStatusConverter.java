package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PlanStatusConverter implements AttributeConverter<PlanStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(PlanStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public PlanStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (PlanStatus e : PlanStatus.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("GiÃ¡ trá»‹ database khÃ´ng há»£p lá»‡ cho PlanStatus: " + dbData);
    }
}
