package com.hanghai.kchtg.cangben.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist LoaiVungNuoc enum as integer in the database.
 */
@Converter(autoApply = true)
public class LoaiVungNuocConverter implements AttributeConverter<LoaiVungNuoc, Integer> {

    @Override
    public Integer convertToDatabaseColumn(LoaiVungNuoc attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public LoaiVungNuoc convertToEntityAttribute(Integer dbData) {
        return dbData != null ? LoaiVungNuoc.fromValue(dbData) : null;
    }
}
