package com.hanghai.kchtg.shiprepairfacility.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class LoaiCoSoConverter implements AttributeConverter<LoaiCoSo, Integer> {

    @Override
    public Integer convertToDatabaseColumn(LoaiCoSo attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public LoaiCoSo convertToEntityAttribute(Integer dbData) {
        return dbData == null ? null : LoaiCoSo.fromValue(dbData);
    }
}
