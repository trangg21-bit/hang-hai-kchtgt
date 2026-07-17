package com.hanghai.kchtg.beacon.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist BeaconApprovalStatus enum as integer in the database.
 */
@Converter(autoApply = true)
public class BeaconApprovalStatusConverter implements AttributeConverter<BeaconApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(BeaconApprovalStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public BeaconApprovalStatus convertToEntityAttribute(Integer dbData) {
        return dbData != null ? BeaconApprovalStatus.fromValue(dbData) : null;
    }
}
