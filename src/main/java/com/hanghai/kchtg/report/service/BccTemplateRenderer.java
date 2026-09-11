package com.hanghai.kchtg.report.service;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.ss.util.CellRangeAddress;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Renders only the seven reviewed VMD layouts; never evaluates template Java expressions. */
@Component
public class BccTemplateRenderer {
    public Workbook render(BccReportDataset data) throws IOException {
        int number = Integer.parseInt(data.code().substring(2)) + 15;
        String resource = "public/template_export/vmd-bcc/BCC_" + number + ".xlsx";
        try (InputStream input = getClass().getClassLoader().getResourceAsStream(resource)) {
            if (input == null) throw new IOException("Không tìm thấy template: " + resource);
            Workbook workbook = WorkbookFactory.create(input);
            try {
                if (number == 157) renderFinancial(workbook.getSheetAt(0), data);
                else renderTable(workbook, number, data);
                workbook.setForceFormulaRecalculation(true);
                verify(workbook.getSheetAt(0));
                return workbook;
            } catch (RuntimeException | IOException error) {
                workbook.close();
                throw error;
            }
        }
    }

    private void renderFinancial(Sheet sheet, BccReportDataset data) {
        int[] rows = {13, 14, 15, 16, 18, 19, 20, 21, 23, 24};
        for (Row row : sheet) for (Cell cell : row) {
            if (cell.getCellType() == CellType.STRING && !cell.getStringCellValue().contains("zobjComReport")) {
                replaceHeader(cell, data.metadata());
            }
            cell.removeCellComment();
        }
        for (int i = 0; i < rows.length; i++) {
            Row row = sheet.getRow(rows[i]);
            for (int col = 2; col <= 4; col++) {
                Object value = data.lines().isEmpty() ? null : data.lines().get(i).values().get(col);
                write(row.getCell(col, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK), value);
            }
        }
    }

    private void renderTable(Workbook workbook, int number, BccReportDataset data) {
        Sheet source = workbook.getSheetAt(0);
        Sheet target = workbook.cloneSheet(0);
        target.getPrintSetup().setPaperSize(source.getPrintSetup().getPaperSize());
        target.getPrintSetup().setLandscape(source.getPrintSetup().getLandscape());
        target.getPrintSetup().setScale(source.getPrintSetup().getScale());
        if (source.getRepeatingRows() != null) target.setRepeatingRows(source.getRepeatingRows());
        for (int i = target.getNumMergedRegions() - 1; i >= 0; i--) target.removeMergedRegion(i);
        for (int i = target.getLastRowNum(); i >= 0; i--) {
            Row row = target.getRow(i); if (row != null) target.removeRow(row);
        }
        List<PlacedRow> placement = new ArrayList<>();
        int first = number == 156 ? 9 : number == 158 || number == 162 ? 10 : number == 161 ? 8 : 9;
        for (int i = 0; i < first; i++) placement.add(new PlacedRow(i, null, null, data.lines()));
        int after;
        if (number == 156) {
            for (var line : data.lines()) placement.add(new PlacedRow(9, line, null, null));
            after = 10;
        } else if (number == 161) {
            String[] blocks = {"2", "1", "5"};
            for (int block = 0; block < blocks.length; block++) {
                String key = blocks[block];
                var entries = data.lines().stream().filter(line -> key.equals(line.block())).toList();
                int row = 8 + block * 3;
                placement.add(new PlacedRow(row, null, null, entries));
                groups(placement, entries, row + 1, row + 2);
            }
            after = 17;
        } else {
            groups(placement, data.lines(), first, first + 1);
            after = first + 2;
        }
        for (int i = after; i <= source.getLastRowNum(); i++) placement.add(new PlacedRow(i, null, null, data.lines()));
        for (int destination = 0; destination < placement.size(); destination++) {
            PlacedRow placed = placement.get(destination);
            Row original = source.getRow(placed.source());
            if (original == null) continue;
            Row row = target.createRow(destination);
            row.setHeight(original.getHeight());
            for (Cell sourceCell : original) {
                int column = sourceCell.getColumnIndex();
                Cell cell = row.createCell(column);
                cell.setCellStyle(sourceCell.getCellStyle());
                if (placed.line() != null) {
                    write(cell, column < placed.line().values().size() ? placed.line().values().get(column) : null);
                } else if (sourceCell.getCellType() == CellType.FORMULA) {
                    // Formula cells in these VMD layouts are subtotal/grand-total cells only.
                    BigDecimal total = BigDecimal.ZERO;
                    for (var line : placed.totals()) {
                        Object value = column < line.values().size() ? line.values().get(column) : null;
                        if (value instanceof Number) total = total.add(new BigDecimal(value.toString()));
                    }
                    write(cell, total);
                } else if (sourceCell.getCellType() == CellType.STRING) {
                    String value = sourceCell.getStringCellValue();
                    if (placed.group() != null && value.contains("${")) write(cell, placed.group());
                    else { cell.setCellValue(value); replaceHeader(cell, data.metadata()); }
                } else if (sourceCell.getCellType() == CellType.NUMERIC) cell.setCellValue(sourceCell.getNumericCellValue());
                else if (sourceCell.getCellType() == CellType.BOOLEAN) cell.setCellValue(sourceCell.getBooleanCellValue());
                else cell.setBlank();
            }
        }
        // Copy repeated row merges and header/footer multi-row merges with the new row positions.
        for (CellRangeAddress merge : source.getMergedRegions()) {
            for (int dest = 0; dest < placement.size(); dest++) {
                if (placement.get(dest).source() != merge.getFirstRow()) continue;
                int length = merge.getLastRow() - merge.getFirstRow();
                if (dest + length >= placement.size()) continue;
                boolean contiguous = true;
                for (int j = 0; j <= length; j++) {
                    if (placement.get(dest + j).source() != merge.getFirstRow() + j) contiguous = false;
                }
                if (contiguous) target.addMergedRegion(new CellRangeAddress(dest, dest + length, merge.getFirstColumn(), merge.getLastColumn()));
            }
        }
        int lastColumn = data.headers().size() - 1;
        if (number == 158) {
            // Excel lets unmerged heading text overflow empty cells; PDF tables need an explicit span.
            for (int rowIndex = 0; rowIndex < first; rowIndex++) {
                Row row = target.getRow(rowIndex);
                Cell cell = row == null ? null : row.getCell(0);
                if (cell != null && cell.getCellType() == CellType.STRING
                        && (cell.getStringCellValue().startsWith("I. NỘI DUNG")
                        || cell.getStringCellValue().startsWith("II.DANH MỤC"))) {
                    final int headingRow = rowIndex;
                    if (target.getMergedRegions().stream().noneMatch(merge -> merge.isInRange(headingRow, 0))) {
                        target.addMergedRegion(new CellRangeAddress(rowIndex, rowIndex, 0, lastColumn));
                    }
                }
            }
        }
        String name = source.getSheetName();
        workbook.removeSheetAt(0);
        workbook.setSheetName(0, name);
        workbook.setPrintArea(0, 0, lastColumn, 0, placement.size() - 1);
        target.setFitToPage(true);
        target.getPrintSetup().setFitWidth((short) 1);
        target.getPrintSetup().setFitHeight((short) 0);
    }

    private void groups(List<PlacedRow> rows, List<BccReportDataset.Line> lines, int groupRow, int detailRow) {
        Map<String, List<BccReportDataset.Line>> grouped = new LinkedHashMap<>();
        for (var line : lines) grouped.computeIfAbsent(line.group(), ignored -> new ArrayList<>()).add(line);
        grouped.forEach((group, entries) -> {
            rows.add(new PlacedRow(groupRow, null, group, entries));
            for (var line : entries) rows.add(new PlacedRow(detailRow, line, null, null));
        });
    }

    private void replaceHeader(Cell cell, Map<String, Object> metadata) {
        if (cell.getCellType() != CellType.STRING) return;
        String text = cell.getStringCellValue();
        for (var entry : metadata.entrySet()) {
            text = text.replace("${" + entry.getKey() + "}", entry.getValue() == null ? "" : entry.getValue().toString());
        }
        if (text.contains("NOI_DUNG_BAO_CAO_158")) {
            text = "I. NỘI DUNG BÁO CÁO: " + metadata.getOrDefault("reportContent", "");
        }
        cell.setCellValue(text);
    }

    private void write(Cell cell, Object value) {
        cell.setBlank();
        if (value == null) return;
        if (value instanceof Number number) cell.setCellValue(number.doubleValue());
        else cell.setCellValue(value.toString());
    }

    private void verify(Sheet sheet) throws IOException {
        for (Row row : sheet) for (Cell cell : row) {
            cell.removeCellComment();
            if (cell.getCellType() == CellType.STRING && cell.getStringCellValue().contains("${")) {
                throw new IOException("Template còn biến chưa được xử lý tại " + cell.getAddress());
            }
            if (cell.getCellType() == CellType.ERROR) throw new IOException("Ô báo cáo bị lỗi tại " + cell.getAddress());
        }
    }

    private record PlacedRow(int source, BccReportDataset.Line line, String group, List<BccReportDataset.Line> totals) {}
}
