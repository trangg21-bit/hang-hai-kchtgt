package com.hanghai.kchtg.beacon.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist BeaconStatus enum as integer in the database.
 */
@Converter(autoApply = true)
public class BeaconStatusConverter implements AttributeConverter<BeaconStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(BeaconStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public BeaconStatus convertToEntityAttribute(Integer dbData) {
        return dbData != null ? BeaconStatus.fromValue(dbData) : null;
    }
}
