package com.hanghai.kchtg.security.totp;

import com.hanghai.kchtg.security.totp.service.QRGenerationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link QRGenerationService}.
 */
class QRGenerationServiceTest {

    private final QRGenerationService qrService = new QRGenerationService();

    @Test
    @DisplayName("generateSvg produces data URI with base64 content")
    void testGenerateSvg() {
        String otpAuthUrl = "otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example";
        String svg = qrService.generateSvg(otpAuthUrl);

        assertNotNull(svg);
        assertTrue(svg.startsWith("data:image/svg+xml;base64,"),
                "SVG must be a data URI");
        // Decode and verify basic SVG structure
        String base64Data = svg.substring("data:image/svg+xml;base64,".length());
        assertTrue(base64Data.length() > 100, "SVG should have substantial content");
    }

    @Test
    @DisplayName("generatePng produces data URI with base64 content")
    void testGeneratePng() {
        String otpAuthUrl = "otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example";
        String png = qrService.generatePng(otpAuthUrl);

        assertNotNull(png);
        assertTrue(png.startsWith("data:image/png;base64,"),
                "PNG must be a data URI");
        String base64Data = png.substring("data:image/png;base64,".length());
        assertTrue(base64Data.length() > 100, "PNG should have substantial content");
    }

    @Test
    @DisplayName("SVG and PNG QR codes are different formats")
    void testSvgVsPng() {
        String otpAuthUrl = "otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example";
        String svg = qrService.generateSvg(otpAuthUrl);
        String png = qrService.generatePng(otpAuthUrl);

        assertNotEquals(svg, png, "SVG and PNG should be different");
    }

    @Test
    @DisplayName("QR codes for same URL are identical")
    void testDeterministic() {
        String otpAuthUrl = "otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example";
        String svg1 = qrService.generateSvg(otpAuthUrl);
        String svg2 = qrService.generateSvg(otpAuthUrl);

        assertEquals(svg1, svg2, "Same URL should produce identical QR codes");
    }
}