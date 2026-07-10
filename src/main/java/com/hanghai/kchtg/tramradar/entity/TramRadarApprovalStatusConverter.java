package com.hanghai.kchtg.tramradar.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TramRadarApprovalStatusConverter implements AttributeConverter<TramRadarApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(TramRadarApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public TramRadarApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (TramRadarApprovalStatus status : TramRadarApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for TramRadarApprovalStatus: " + dbData);
    }
}
