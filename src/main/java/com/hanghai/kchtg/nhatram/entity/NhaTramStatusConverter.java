package com.hanghai.kchtg.nhatram.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class NhaTramStatusConverter implements AttributeConverter<NhaTramStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(NhaTramStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public NhaTramStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (NhaTramStatus status : NhaTramStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for NhaTramStatus: " + dbData);
    }
}
