package com.hanghai.kchtg.vts.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class HeThongVTSApprovalStatusConverter implements AttributeConverter<HeThongVTSApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(HeThongVTSApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public HeThongVTSApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (HeThongVTSApprovalStatus status : HeThongVTSApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for HeThongVTSApprovalStatus: " + dbData);
    }
}
