package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ReportStatusConverter implements AttributeConverter<ReportStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(ReportStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public ReportStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (ReportStatus e : ReportStatus.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("Giá trị database không hợp lệ cho ReportStatus: " + dbData);
    }
}
