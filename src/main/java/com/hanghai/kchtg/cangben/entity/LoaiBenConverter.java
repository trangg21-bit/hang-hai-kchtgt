package com.hanghai.kchtg.cangben.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converter to persist LoaiBen enum as integer in the database.
 */
@Converter(autoApply = true)
public class LoaiBenConverter implements AttributeConverter<LoaiBen, Integer> {

    @Override
    public Integer convertToDatabaseColumn(LoaiBen attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public LoaiBen convertToEntityAttribute(Integer dbData) {
        return dbData != null ? LoaiBen.fromValue(dbData) : null;
    }
}
