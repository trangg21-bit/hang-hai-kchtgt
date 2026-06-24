package com.hanghai.kchtg.security.totp.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.EnumMap;
import java.util.Map;

/**
 * QR-code generation service for TOTP enrollment.
 * <p>
 * Produces SVG and PNG QR codes encoded as data-URI strings suitable
 * for direct embedding in HTML / client-side rendering.
 * </p>
 */
@Service
public class QRGenerationService {

    private static final Logger log = LoggerFactory.getLogger(QRGenerationService.class);

    private static final int QR_SIZE = 300;

    /**
     * Generates a data-URI SVG QR code for the given OTPAuth URL.
     *
     * @param otpAuthUrl the OTPAuth URL (e.g. {@code otpauth://totp/...})
     * @return data URI: {@code data:image/svg+xml;base64,...}
     */
    public String generateSvg(String otpAuthUrl) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(
                    otpAuthUrl,
                    BarcodeFormat.QR_CODE,
                    QR_SIZE,
                    QR_SIZE,
                    hints()
            );

            // Render SVG to a string using the zxing SVG output path
            String svgContent = renderSvg(matrix);
            String base64 = Base64.getEncoder().encodeToString(svgContent.getBytes(StandardCharsets.UTF_8));
            return "data:image/svg+xml;base64," + base64;
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Failed to generate SVG QR code", e);
        }
    }

    /**
     * Generates a data-URI PNG QR code for the given OTPAuth URL.
     *
     * @param otpAuthUrl the OTPAuth URL
     * @return data URI: {@code data:image/png;base64,...}
     */
    public String generatePng(String otpAuthUrl) {
        try {
            BitMatrix matrix = new QRCodeWriter().encode(
                    otpAuthUrl,
                    BarcodeFormat.QR_CODE,
                    QR_SIZE,
                    QR_SIZE,
                    hints()
            );

            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                MatrixToImageWriter.writeToStream(matrix, "PNG", out);
                byte[] pngBytes = out.toByteArray();
                String base64 = Base64.getEncoder().encodeToString(pngBytes);
                return "data:image/png;base64," + base64;
            }
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Failed to generate PNG QR code", e);
        }
    }

    private Map<EncodeHintType, ?> hints() {
        return new EnumMap<>(Map.of(
                EncodeHintType.CHARACTER_SET, StandardCharsets.UTF_8,
                EncodeHintType.MARGIN, 1
        ));
    }

    /**
     * Render a BitMatrix as raw SVG XML content.
     */
    private String renderSvg(BitMatrix matrix) throws IOException {
        int width = matrix.getWidth();
        int height = matrix.getHeight();
        double scale = QR_SIZE / (double) Math.max(width, height);
        int svgWidth = (int) (width * scale);
        int svgHeight = (int) (height * scale);
        int moduleSize = Math.max(1, (int) Math.round(QR_SIZE / (double) Math.max(width, height)));

        StringBuilder svg = new StringBuilder();
        svg.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        svg.append(String.format("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"%d\" height=\"%d\" viewBox=\"0 0 %d %d\">\n",
                svgWidth, svgHeight, width, height));
        svg.append("<rect width=\"100%\" height=\"100%\" fill=\"white\"/>\n");

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                if (matrix.get(x, y)) {
                    svg.append(String.format("<rect x=\"%d\" y=\"%d\" width=\"%d\" height=\"%d\" fill=\"black\"/>\n",
                            x * moduleSize, y * moduleSize, moduleSize, moduleSize));
                }
            }
        }

        svg.append("</svg>");
        return svg.toString();
    }
}