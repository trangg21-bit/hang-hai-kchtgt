package com.hanghai.kchtg.gis.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CoordinateCalibrationServiceTest {

    private final CoordinateCalibrationService calibrationService = new CoordinateCalibrationService();

    @Test
    @DisplayName("Parse DMS / DDM Coordinate strings to decimal degrees")
    void testParseCoordinateString() {
        // DMS Format 1
        double dms1 = calibrationService.parseCoordinateString("10°24'36\" N");
        assertEquals(10.41, dms1, 0.0001);

        // DMS Format 2
        double dms2 = calibrationService.parseCoordinateString("10d 24m 36s N");
        assertEquals(10.41, dms2, 0.0001);

        // DMS with seconds decimals
        double dms3 = calibrationService.parseCoordinateString("10 24 36.5 N");
        assertEquals(10.410138, dms3, 0.000001);

        // Southern hemisphere DMS (should be negative)
        double dmsSouth = calibrationService.parseCoordinateString("20°30'0\" S");
        assertEquals(-20.5, dmsSouth, 0.0001);

        // DDM format
        double ddm = calibrationService.parseCoordinateString("105 30.6' E");
        assertEquals(105.51, ddm, 0.0001);

        // Decimal Degrees directly
        double dd = calibrationService.parseCoordinateString("108.5432");
        assertEquals(108.5432, dd, 0.0001);

        // Negative decimal degree W
        double ddWest = calibrationService.parseCoordinateString("74.0060 W");
        assertEquals(-74.0060, ddWest, 0.0001);
    }

    @Test
    @DisplayName("Calibrate WGS84 coordinates with offsets")
    void testCalibrateWGS84() {
        CoordinateCalibrationService.CoordinateResult res = calibrationService.calibrate(
                "WGS84",
                "106.6297",
                "10.7769",
                null,
                0.01,
                -0.01
        );

        assertTrue(res.valid);
        assertEquals(106.6397, res.longitude, 0.0001);
        assertEquals(10.7669, res.latitude, 0.0001);
    }

    @Test
    @DisplayName("Calibrate VN-2000 coordinates to WGS84")
    void testCalibrateVN2000() {
        // Sample VN-2000 coordinates (Easting/Northing in meters) for central meridian 105.0 (Hanoi area)
        // X = 568390.0, Y = 2322890.0
        CoordinateCalibrationService.CoordinateResult res = calibrationService.calibrate(
                "VN2000",
                "568390.0",
                "2322890.0",
                "105.0",
                0.0,
                0.0
        );

        assertTrue(res.valid);
        // Should yield valid Vietnam coordinates
        assertTrue(res.longitude > 102.0 && res.longitude < 110.0);
        assertTrue(res.latitude > 8.0 && res.latitude < 24.0);
    }

    @Test
    @DisplayName("Calibrate UTM Zone coordinates to WGS84")
    void testCalibrateUTM() {
        // UTM Zone 48N coordinate
        CoordinateCalibrationService.CoordinateResult res = calibrationService.calibrate(
                "UTM",
                "677700.0",
                "2286500.0",
                "48N",
                0.0,
                0.0
        );

        assertTrue(res.valid);
        assertTrue(res.longitude > 102.0 && res.longitude < 110.0);
        assertTrue(res.latitude > 8.0 && res.latitude < 24.0);
    }

    @Test
    @DisplayName("Validate coordinates out of bounds")
    void testCoordinateBoundsValidation() {
        CoordinateCalibrationService.CoordinateResult resInvalidLon = calibrationService.calibrate(
                "WGS84",
                "185.0",
                "10.0",
                null,
                0.0,
                0.0
        );
        assertFalse(resInvalidLon.valid);
        assertNotNull(resInvalidLon.errorMessage);

        CoordinateCalibrationService.CoordinateResult resInvalidLat = calibrationService.calibrate(
                "WGS84",
                "106.0",
                "95.0",
                null,
                0.0,
                0.0
        );
        assertFalse(resInvalidLat.valid);
        assertNotNull(resInvalidLat.errorMessage);
    }
}
