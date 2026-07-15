package com.hanghai.kchtg.gis.spatial.entity;

import com.hanghai.kchtg.gis.search.dto.KchtType;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class KchtTypeConverter implements AttributeConverter<KchtType, Integer> {

    @Override
    public Integer convertToDatabaseColumn(KchtType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.ordinal();
    }

    @Override
    public KchtType convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (KchtType type : KchtType.values()) {
            if (type.ordinal() == dbData) {
                return type;
            }
        }
        return null;
    }
}
