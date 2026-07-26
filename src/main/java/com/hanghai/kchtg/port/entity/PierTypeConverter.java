package com.hanghai.kchtg.port.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist PierType enum as integer in the database.
 */
@Converter(autoApply = true)
public class PierTypeConverter implements AttributeConverter<PierType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(PierType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public PierType convertToEntityAttribute(Integer dbData) {
        return dbData != null ? PierType.fromValue(dbData) : null;
    }
}
