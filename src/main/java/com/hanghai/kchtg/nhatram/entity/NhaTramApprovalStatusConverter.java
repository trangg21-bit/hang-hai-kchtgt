package com.hanghai.kchtg.nhatram.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class NhaTramApprovalStatusConverter implements AttributeConverter<NhaTramApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(NhaTramApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public NhaTramApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (NhaTramApprovalStatus status : NhaTramApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for NhaTramApprovalStatus: " + dbData);
    }
}
