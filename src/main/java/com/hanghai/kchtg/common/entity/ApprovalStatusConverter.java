package com.hanghai.kchtg.common.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ApprovalStatusConverter implements AttributeConverter<ApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(ApprovalStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public ApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (ApprovalStatus st : ApprovalStatus.values()) {
            if (st.getValue() == dbData) {
                return st;
            }
        }
        throw new IllegalArgumentException("Unknown database value for ApprovalStatus: " + dbData);
    }
}
