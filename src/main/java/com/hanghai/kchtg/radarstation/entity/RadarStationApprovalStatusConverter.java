package com.hanghai.kchtg.radarstation.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RadarStationApprovalStatusConverter implements AttributeConverter<RadarStationApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(RadarStationApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public RadarStationApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (RadarStationApprovalStatus status : RadarStationApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for RadarStationApprovalStatus: " + dbData);
    }
}
