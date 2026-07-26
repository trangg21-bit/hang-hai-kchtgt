package com.hanghai.kchtg.common.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class OperationalStatusConverter implements AttributeConverter<OperationalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(OperationalStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public OperationalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (OperationalStatus st : OperationalStatus.values()) {
            if (st.getValue() == dbData) {
                return st;
            }
        }
        throw new IllegalArgumentException("Unknown database value for OperationalStatus: " + dbData);
    }
}
