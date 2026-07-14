package com.hanghai.kchtg.vts.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TinhTrangVTSConverter implements AttributeConverter<TinhTrangVTS, Integer> {

    @Override
    public Integer convertToDatabaseColumn(TinhTrangVTS attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public TinhTrangVTS convertToEntityAttribute(Integer dbData) {
        return dbData != null ? TinhTrangVTS.fromString(String.valueOf(dbData)) : null;
    }
}
