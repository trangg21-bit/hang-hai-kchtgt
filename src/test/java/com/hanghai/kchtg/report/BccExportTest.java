package com.hanghai.kchtg.report;

import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.service.BccGeneralReportService;
import com.hanghai.kchtg.report.service.BccTemplateRenderer;
import com.hanghai.kchtg.report.service.BccWordRenderer;
import com.hanghai.kchtg.report.service.ReportService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BccExportTest {
    @ParameterizedTest
    @ValueSource(ints = {141, 142, 143, 144, 145, 146, 147})
    void exportsReadablePdfWithVietnameseText(int code) throws Exception {
        var provider = mock(BccGeneralReportService.class);
        var service = mock(ReportService.class, CALLS_REAL_METHODS);
        ReflectionTestUtils.setField(service, "bccGeneralReports", provider);
        ReflectionTestUtils.setField(service, "bccTemplateRenderer", new BccTemplateRenderer());
        ReflectionTestUtils.setField(service, "bccWordRenderer", new BccWordRenderer());
        var request = ReportPreviewRequest.builder().reportCode("F-" + code).format("PDF").build();
        when(provider.supports(request.getReportCode())).thenReturn(true);
        when(provider.load(request)).thenReturn(BccTemplateRendererTest.fixture(code, false));
        byte[] bytes = service.exportReport(request);
        Path output = Path.of("target", "bcc-verification"); Files.createDirectories(output);
        Files.write(output.resolve("F-" + code + ".pdf"), bytes);
        try (var pdf = PDDocument.load(bytes)) {
            assertTrue(pdf.getNumberOfPages() > 0);
            String text = new PDFTextStripper().getText(pdf);
            assertFalse(text.contains("${"));
            assertTrue(text.contains("Cảng vụ thử nghiệm"), text);
            ImageIO.write(new PDFRenderer(pdf).renderImageWithDPI(0, 80), "png",
                    output.resolve("F-" + code + ".png").toFile());
        }
        request.setFormat("WORD");
        try (var word = new XWPFDocument(new ByteArrayInputStream(service.exportReport(request)))) {
            assertFalse(word.getAllPictures().isEmpty());
        }
    }

    @Test void wordPreservesPageCountAndOrder() throws Exception {
        byte[] bytes;
        try (var pdf = new PDDocument(); var out = new ByteArrayOutputStream()) {
            pdf.addPage(new PDPage()); pdf.addPage(new PDPage()); pdf.addPage(new PDPage());
            pdf.save(out); bytes = out.toByteArray();
        }
        try (var word = new XWPFDocument(new ByteArrayInputStream(new BccWordRenderer().render(bytes)))) {
            assertEquals(3, word.getParagraphs().size());
            for (int i = 0; i < 3; i++) {
                var picture = word.getParagraphs().get(i).getRuns().get(0).getEmbeddedPictures().get(0);
                assertEquals("page-" + (i + 1) + ".png", picture.getDescription());
            }
        }
    }
}
