package com.hanghai.kchtg.assetmovement;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.assetmovement.converter.StringToInfraAssetTypeConverter;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class InfraAssetTypeDeserializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final StringToInfraAssetTypeConverter converter = new StringToInfraAssetTypeConverter();

    @Test
    void testJacksonDeserializeFromStringName() throws Exception {
        String json = "{\"assetName\":\"Bến số 1\",\"assetType\":\"PORT_TERMINAL\"}";
        InfraAssetRequest request = objectMapper.readValue(json, InfraAssetRequest.class);
        assertNotNull(request);
        assertEquals(InfraAssetType.PORT_TERMINAL, request.getAssetType());
    }

    @Test
    void testJacksonDeserializeFromInteger() throws Exception {
        String json = "{\"assetName\":\"Bến số 1\",\"assetType\":4}";
        InfraAssetRequest request = objectMapper.readValue(json, InfraAssetRequest.class);
        assertNotNull(request);
        assertEquals(InfraAssetType.PORT_TERMINAL, request.getAssetType());
    }

    @Test
    void testJacksonDeserializeFromStringNumber() throws Exception {
        String json = "{\"assetName\":\"Bến số 1\",\"assetType\":\"4\"}";
        InfraAssetRequest request = objectMapper.readValue(json, InfraAssetRequest.class);
        assertNotNull(request);
        assertEquals(InfraAssetType.PORT_TERMINAL, request.getAssetType());
    }

    @Test
    void testConverter() {
        assertEquals(InfraAssetType.PORT_TERMINAL, converter.convert("PORT_TERMINAL"));
        assertEquals(InfraAssetType.PORT_TERMINAL, converter.convert("port_terminal"));
        assertEquals(InfraAssetType.PORT_TERMINAL, converter.convert("4"));
    }
}
