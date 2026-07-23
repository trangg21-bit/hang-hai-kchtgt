package com.hanghai.kchtg.navigationchannel.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class NavigationChannelApprovalStatusConverter implements AttributeConverter<NavigationChannelApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(NavigationChannelApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public NavigationChannelApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (NavigationChannelApprovalStatus status : NavigationChannelApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for NavigationChannelApprovalStatus: " + dbData);
    }
}
