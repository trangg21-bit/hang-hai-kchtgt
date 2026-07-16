package com.hanghai.kchtg.nhatram.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist BeaconLightType enum as integer in the database.
 */
@Converter(autoApply = true)
public class BeaconLightTypeConverter implements AttributeConverter<BeaconLightType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(BeaconLightType attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public BeaconLightType convertToEntityAttribute(Integer dbData) {
        return dbData != null ? BeaconLightType.fromValue(dbData) : null;
    }
}
