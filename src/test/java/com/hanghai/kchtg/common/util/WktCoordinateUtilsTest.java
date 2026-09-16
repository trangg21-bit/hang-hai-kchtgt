package com.hanghai.kchtg.common.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class WktCoordinateUtilsTest {

    @Test
    void treatsEquivalentWktSerializationsAsEqual() {
        assertTrue(WktCoordinateUtils.coordinatesEqual(
                "SRID=4326;linestring (108.0 15.00, 109.500 16.250)",
                "LINESTRING(108 15,109.5 16.25)"));
    }

    @Test
    void detectsAnActualCoordinateChange() {
        assertFalse(WktCoordinateUtils.coordinatesEqual(
                "POINT(108 15)",
                "POINT(108.1 15)"));
    }
}
