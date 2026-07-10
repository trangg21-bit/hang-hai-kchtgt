package com.hanghai.kchtg.cosuachua.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class CoSuaChuaApprovalStatusConverter implements AttributeConverter<CoSuaChuaApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(CoSuaChuaApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public CoSuaChuaApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (CoSuaChuaApprovalStatus status : CoSuaChuaApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for CoSuaChuaApprovalStatus: " + dbData);
    }
}
