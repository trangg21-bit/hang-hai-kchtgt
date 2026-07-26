package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ApprovalResultConverter implements AttributeConverter<ApprovalResult, Integer> {

    @Override
    public Integer convertToDatabaseColumn(ApprovalResult attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public ApprovalResult convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (ApprovalResult e : ApprovalResult.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("Giá trị database không hợp lệ cho ApprovalResult: " + dbData);
    }
}
