package com.hanghai.kchtg.shiprepairfacility.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ShipRepairApprovalStatusConverter implements AttributeConverter<ShipRepairApprovalStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(ShipRepairApprovalStatus attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public ShipRepairApprovalStatus convertToEntityAttribute(Integer dbData) {
        if (dbData == null) {
            return null;
        }
        for (ShipRepairApprovalStatus status : ShipRepairApprovalStatus.values()) {
            if (status.getValue() == dbData) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown database value for ShipRepairApprovalStatus: " + dbData);
    }
}
