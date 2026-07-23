package com.hanghai.kchtg.dikerevetment.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class DikeRevetmentApprovalStatusConverter implements AttributeConverter<DikeRevetmentApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(DikeRevetmentApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public DikeRevetmentApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (DikeRevetmentApprovalStatus status : DikeRevetmentApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for DikeRevetmentApprovalStatus: " + dbData);
    }
}
