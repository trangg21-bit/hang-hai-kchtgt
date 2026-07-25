package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class InventoryStatusConverter implements AttributeConverter<InventoryStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(InventoryStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public InventoryStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (InventoryStatus e : InventoryStatus.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("GiÃ¡ trá»‹ database khÃ´ng há»£p lá»‡ cho InventoryStatus: " + dbData);
    }
}
