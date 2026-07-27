package com.hanghai.kchtg.port.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist BerthType enum as integer in the database.
 */
@Converter(autoApply = true)
public class BerthTypeConverter implements AttributeConverter<BerthType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(BerthType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public BerthType convertToEntityAttribute(Integer dbData) {
        return dbData != null ? BerthType.fromValue(dbData) : null;
    }
}
