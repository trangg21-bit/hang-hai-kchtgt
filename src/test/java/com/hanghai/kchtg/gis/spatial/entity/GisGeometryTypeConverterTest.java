package com.hanghai.kchtg.gis.spatial.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GisGeometryTypeConverterTest {

    private final GisGeometryTypeConverter converter = new GisGeometryTypeConverter();

    @Test
    @DisplayName("Should convert 0 to POINT for legacy backward compatibility")
    void testConvertZeroToPoint() {
        assertEquals(GisGeometryType.POINT, converter.convertToEntityAttribute(0));
    }

    @Test
    @DisplayName("Should convert standard values 1, 2, 3")
    void testConvertStandardValues() {
        assertEquals(GisGeometryType.POINT, converter.convertToEntityAttribute(1));
        assertEquals(GisGeometryType.LINE, converter.convertToEntityAttribute(2));
        assertEquals(GisGeometryType.POLYGON, converter.convertToEntityAttribute(3));
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
        assertEquals(1, converter.convertToDatabaseColumn(GisGeometryType.POINT));
        assertEquals(2, converter.convertToDatabaseColumn(GisGeometryType.LINE));
        assertEquals(3, converter.convertToDatabaseColumn(GisGeometryType.POLYGON));
    }
}
