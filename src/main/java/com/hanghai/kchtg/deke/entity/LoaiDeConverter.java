package com.hanghai.kchtg.deke.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist LoaiDe enum as integer in the database.
 */
@Converter(autoApply = true)
public class LoaiDeConverter implements AttributeConverter<LoaiDe, Integer> {

    @Override
    public Integer convertToDatabaseColumn(LoaiDe attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public LoaiDe convertToEntityAttribute(Integer dbData) {
        return dbData != null ? LoaiDe.fromValue(dbData) : null;
    }
}
