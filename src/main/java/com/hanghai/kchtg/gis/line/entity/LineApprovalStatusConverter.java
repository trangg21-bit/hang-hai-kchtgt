package com.hanghai.kchtg.gis.line.entity;

import com.hanghai.kchtg.gis.line.entity.LineObject.ApprovalStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class LineApprovalStatusConverter implements AttributeConverter<ApprovalStatus, Integer> {
    @Override
    public Integer convertToDatabaseColumn(ApprovalStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public ApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (ApprovalStatus status : ApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for LineObject.ApprovalStatus: " + dbData);
    }
}
