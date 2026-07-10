package com.hanghai.kchtg.tai.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TaiStatusConverter implements AttributeConverter<TaiStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(TaiStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public TaiStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (TaiStatus status : TaiStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for TaiStatus: " + dbData);
    }
}
