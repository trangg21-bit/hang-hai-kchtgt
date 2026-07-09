package com.hanghai.kchtg.common.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TrangThaiPheDuyetConverter implements AttributeConverter<TrangThaiPheDuyet, Integer> {

    @Override
    public Integer convertToDatabaseColumn(TrangThaiPheDuyet attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public TrangThaiPheDuyet convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (TrangThaiPheDuyet st : TrangThaiPheDuyet.values()) {
            if (st.getValue() == dbData) {
                return st;
            }
        }
        throw new IllegalArgumentException("Unknown database value for TrangThaiPheDuyet: " + dbData);
    }
}
