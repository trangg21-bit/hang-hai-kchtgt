package com.hanghai.kchtg.report.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.poi.util.Units;
import org.apache.poi.xwpf.usermodel.BreakType;
import org.apache.poi.xwpf.usermodel.Document;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigInteger;

/** Source-compatible DOCX: one image per internally generated PDF page, in order. */
@Component
public class BccWordRenderer {
    public byte[] render(byte[] generatedPdf) {
        try (PDDocument pdf = PDDocument.load(generatedPdf);
                XWPFDocument word = new XWPFDocument();
                ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (pdf.getNumberOfPages() == 0) throw new IllegalArgumentException("Báo cáo không có trang để xuất Word");
            var page = pdf.getPage(0).getMediaBox();
            var section = word.getDocument().getBody().addNewSectPr();
            var size = section.addNewPgSz();
            size.setW(BigInteger.valueOf(Math.round(page.getWidth() * 20)));
            size.setH(BigInteger.valueOf(Math.round(page.getHeight() * 20)));
            var margins = section.addNewPgMar();
            margins.setTop(BigInteger.ZERO); margins.setBottom(BigInteger.ZERO);
            margins.setLeft(BigInteger.ZERO); margins.setRight(BigInteger.ZERO);
            margins.setHeader(BigInteger.ZERO); margins.setFooter(BigInteger.ZERO);
            PDFRenderer renderer = new PDFRenderer(pdf);
            for (int index = 0; index < pdf.getNumberOfPages(); index++) {
                var paragraph = word.createParagraph();
                paragraph.setSpacingBefore(0); paragraph.setSpacingAfter(0);
                var run = paragraph.createRun();
                if (index > 0) run.addBreak(BreakType.PAGE);
                var bitmap = renderer.renderImageWithDPI(index, 120);
                try (ByteArrayOutputStream png = new ByteArrayOutputStream()) {
                    ImageIO.write(bitmap, "png", png);
                    // Leave room for Word's paragraph baseline to prevent a trailing blank page.
                    double scale = Math.min(page.getWidth() / bitmap.getWidth(),
                            (page.getHeight() - 18) / bitmap.getHeight());
                    run.addPicture(new ByteArrayInputStream(png.toByteArray()), Document.PICTURE_TYPE_PNG,
                            "page-" + (index + 1) + ".png", Units.toEMU(bitmap.getWidth() * scale),
                            Units.toEMU(bitmap.getHeight() * scale));
                } finally { bitmap.flush(); }
            }
            word.write(output);
            return output.toByteArray();
        } catch (Exception error) {
            throw new IllegalStateException("Không thể xuất báo cáo Word", error);
        }
    }
}
