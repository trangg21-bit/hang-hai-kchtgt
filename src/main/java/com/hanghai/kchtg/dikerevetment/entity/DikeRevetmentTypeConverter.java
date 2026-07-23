package com.hanghai.kchtg.dikerevetment.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist DikeRevetmentType enum as integer in the database.
 */
@Converter(autoApply = true)
public class DikeRevetmentTypeConverter implements AttributeConverter<DikeRevetmentType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(DikeRevetmentType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public DikeRevetmentType convertToEntityAttribute(Integer dbData) {
        return dbData != null ? DikeRevetmentType.fromValue(dbData) : null;
    }
}
