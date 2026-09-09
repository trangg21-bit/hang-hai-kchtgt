package com.hanghai.kchtg.assetmovement.converter;

import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class StringToInfraAssetTypeConverter implements Converter<String, InfraAssetType> {

    @Override
    public InfraAssetType convert(String source) {
        if (source == null || source.isBlank()) {
            return null;
        }
        return InfraAssetType.fromValue(source);
    }
}
