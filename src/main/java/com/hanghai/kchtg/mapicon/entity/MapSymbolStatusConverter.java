package com.hanghai.kchtg.mapicon.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class MapSymbolStatusConverter implements AttributeConverter<MapSymbolStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(MapSymbolStatus attribute) {
        if (attribute == null) return null;
        return attribute.getValue();
    }

    @Override
    public MapSymbolStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) return null;
        for (MapSymbolStatus status : MapSymbolStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Giá trị trạng thái ký hiệu không hợp lệ: " + dbData);
    }
}
