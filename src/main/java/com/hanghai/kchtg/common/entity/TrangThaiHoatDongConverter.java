package com.hanghai.kchtg.common.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class TrangThaiHoatDongConverter implements AttributeConverter<TrangThaiHoatDong, Integer> {

    @Override
    public Integer convertToDatabaseColumn(TrangThaiHoatDong attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public TrangThaiHoatDong convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (TrangThaiHoatDong st : TrangThaiHoatDong.values()) {
            if (st.getValue() == dbData) {
                return st;
            }
        }
        throw new IllegalArgumentException("Unknown database value for TrangThaiHoatDong: " + dbData);
    }
}
