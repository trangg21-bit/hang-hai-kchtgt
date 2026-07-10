package com.hanghai.kchtg.tai.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TaiApprovalStatusConverter implements AttributeConverter<TaiApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(TaiApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public TaiApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (TaiApprovalStatus status : TaiApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for TaiApprovalStatus: " + dbData);
    }
}
