package com.hanghai.kchtg.port.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist WaterZoneType enum as integer in the database.
 */
@Converter(autoApply = true)
public class WaterZoneTypeConverter implements AttributeConverter<WaterZoneType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(WaterZoneType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public WaterZoneType convertToEntityAttribute(Integer dbData) {
        return dbData != null ? WaterZoneType.fromValue(dbData) : null;
    }
}
