package com.hanghai.kchtg.gis.spatial.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GisSpatialObjectTypeConverterTest {

    private final GisSpatialObjectTypeConverter converter = new GisSpatialObjectTypeConverter();

    @Test
    @DisplayName("Should convert 5 to POINT_OTHER for legacy backward compatibility")
    void testConvertLegacyFiveToPointOther() {
        assertEquals(GisSpatialObjectType.POINT_OTHER, converter.convertToEntityAttribute(5));
    }

    @Test
    @DisplayName("Should convert standard values 10..38")
    void testConvertStandardValues() {
        assertEquals(GisSpatialObjectType.POINT_PORT, converter.convertToEntityAttribute(10));
        assertEquals(GisSpatialObjectType.POINT_LIGHTHOUSE, converter.convertToEntityAttribute(11));
        assertEquals(GisSpatialObjectType.POINT_BUOY, converter.convertToEntityAttribute(12));
        assertEquals(GisSpatialObjectType.POINT_BEACON, converter.convertToEntityAttribute(13));
        assertEquals(GisSpatialObjectType.POINT_OTHER, converter.convertToEntityAttribute(14));
        assertEquals(GisSpatialObjectType.POINT_DAI_TTDH, converter.convertToEntityAttribute(15));
        assertEquals(GisSpatialObjectType.LINE_COASTLINE, converter.convertToEntityAttribute(20));
        assertEquals(GisSpatialObjectType.POLYGON_WATER_ZONE, converter.convertToEntityAttribute(30));
    }

    @Test
    @DisplayName("Should convert unknown value to POINT_OTHER safely without exception")
    void testConvertUnknownValue() {
        assertEquals(GisSpatialObjectType.POINT_OTHER, converter.convertToEntityAttribute(9999));
    }

    @Test
    @DisplayName("Should convert null to null")
    void testConvertNull() {
        assertNull(converter.convertToEntityAttribute(null));
        assertNull(converter.convertToDatabaseColumn(null));
    }

    @Test
    @DisplayName("Should convert entity attribute to database column")
    void testConvertToDatabaseColumn() {
        assertEquals(10, converter.convertToDatabaseColumn(GisSpatialObjectType.POINT_PORT));
        assertEquals(14, converter.convertToDatabaseColumn(GisSpatialObjectType.POINT_OTHER));
    }
}

