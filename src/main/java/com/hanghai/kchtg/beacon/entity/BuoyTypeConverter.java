package com.hanghai.kchtg.beacon.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist BuoyType enum as integer in the database.
 */
@Converter(autoApply = true)
public class BuoyTypeConverter implements AttributeConverter<BuoyType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(BuoyType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public BuoyType convertToEntityAttribute(Integer dbData) {
        return dbData != null ? BuoyType.fromValue(dbData) : null;
    }
}
