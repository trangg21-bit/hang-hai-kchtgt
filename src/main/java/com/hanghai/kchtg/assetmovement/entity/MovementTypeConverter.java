package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class MovementTypeConverter implements AttributeConverter<MovementType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(MovementType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public MovementType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (MovementType e : MovementType.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("Giá trị database không hợp lệ cho MovementType: " + dbData);
    }
}
