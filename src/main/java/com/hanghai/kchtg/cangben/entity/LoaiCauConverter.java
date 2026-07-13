package com.hanghai.kchtg.cangben.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist LoaiCau enum as integer in the database.
 */
@Converter(autoApply = true)
public class LoaiCauConverter implements AttributeConverter<LoaiCau, Integer> {

    @Override
    public Integer convertToDatabaseColumn(LoaiCau attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public LoaiCau convertToEntityAttribute(Integer dbData) {
        return dbData != null ? LoaiCau.fromValue(dbData) : null;
    }
}
