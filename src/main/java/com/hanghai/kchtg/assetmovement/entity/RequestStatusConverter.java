package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class RequestStatusConverter implements AttributeConverter<RequestStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(RequestStatus attribute) {
        return attribute != null ? attribute.getValue() : null;
    }

    @Override
    public RequestStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (RequestStatus e : RequestStatus.values()) {
            if (e.getValue() == dbData) {
                return e;
            }
        }
        throw new IllegalArgumentException("GiÃ¡ trá»‹ database khÃ´ng há»£p lá»‡ cho RequestStatus: " + dbData);
    }
}
