package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class DecreaseReasonConverter implements AttributeConverter<DecreaseReason, Integer> {

    @Override
    public Integer convertToDatabaseColumn(DecreaseReason attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public DecreaseReason convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (DecreaseReason e : DecreaseReason.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("Giá trị database không hợp lệ cho DecreaseReason: " + dbData);
    }
}
