package com.hanghai.kchtg.gis.search.dto;

import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class StringToKchtTypeConverter implements Converter<String, KchtType> {

    @Override
    public KchtType convert(String source) {
        if (source == null || source.trim().isEmpty()) {
            return null;
        }
        String val = source.trim().toUpperCase();
        switch (val) {
            case "PORT":
            case "CANGBIEN":
                return KchtType.CANGBIEN;
            case "BERTH":
            case "BENCANG":
                return KchtType.BENCANG;
            case "PIER":
            case "CAUCANG":
                return KchtType.CAUCANG;
            case "DRYPORT":
            case "CANGCAN":
                return KchtType.CANGCAN;
            case "WATERZONE":
            case "VUNGNUOC":
                return KchtType.VUNGNUOC;
            case "SHIPYARD":
            case "COSO_SUACHUA":
                return KchtType.COSO_SUACHUA;
            case "LIGHTHOUSE":
            case "DENBIEN":
                return KchtType.DENBIEN;
            case "BUOY":
            case "PHAOTIEU":
                return KchtType.PHAOTIEU;
            case "VTS":
            case "HE_THONG_VTS":
                return KchtType.HE_THONG_VTS;
            case "RADAR":
            case "TRAM_RADAR":
                return KchtType.TRAM_RADAR;
            default:
                try {
                    return KchtType.valueOf(val);
                } catch (IllegalArgumentException e) {
                    for (KchtType type : KchtType.values()) {
                        if (type.name().equalsIgnoreCase(val)) {
                            return type;
                        }
                    }
                    throw e;
                }
        }
    }
}
