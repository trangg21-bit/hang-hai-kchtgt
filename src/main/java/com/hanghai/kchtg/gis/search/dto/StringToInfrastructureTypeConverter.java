package com.hanghai.kchtg.gis.search.dto;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class StringToInfrastructureTypeConverter implements Converter<String, InfrastructureType> {

    @Override
    public InfrastructureType convert(String source) {
        if (source == null || source.trim().isEmpty()) {
            return null;
        }
        String val = source.trim().toUpperCase();
        switch (val) {
            case "PORT":
            case "SEAPORT":
                return InfrastructureType.SEAPORT;
            case "BERTH":
            case "PORT_TERMINAL":
                return InfrastructureType.PORT_TERMINAL;
            case "PIER":
                return InfrastructureType.PIER;
            case "DRYPORT":
            case "DRY_PORT":
                return InfrastructureType.DRY_PORT;
            case "WATERZONE":
            case "WATER_AREA":
                return InfrastructureType.WATER_AREA;
            case "SHIPYARD":
            case "SHIP_REPAIR_FACILITY":
                return InfrastructureType.SHIP_REPAIR_FACILITY;
            case "LIGHTHOUSE":
                return InfrastructureType.LIGHTHOUSE;
            case "BUOY":
                return InfrastructureType.BUOY;
            case "VTS":
            case "VTS_SYSTEM":
                return InfrastructureType.VTS_SYSTEM;
            case "RADAR":
            case "RADAR_STATION_LEGACY":
                return InfrastructureType.RADAR_STATION_LEGACY;
            default:
                try {
                    return InfrastructureType.valueOf(val);
                } catch (IllegalArgumentException e) {
                    for (InfrastructureType type : InfrastructureType.values()) {
                        if (type.name().equalsIgnoreCase(val)) {
                            return type;
                        }
                    }
                    throw e;
                }
        }
    }
}
