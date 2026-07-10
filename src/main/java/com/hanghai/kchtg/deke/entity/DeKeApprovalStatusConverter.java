package com.hanghai.kchtg.deke.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class DeKeApprovalStatusConverter implements AttributeConverter<DeKeApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(DeKeApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public DeKeApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (DeKeApprovalStatus status : DeKeApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for DeKeApprovalStatus: " + dbData);
    }
}
