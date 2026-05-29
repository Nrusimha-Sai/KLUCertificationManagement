package com.klu.certification.service;

import com.klu.certification.dto.RegisteredCourseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelExportService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public byte[] exportCertifications(List<RegisteredCourseDto> certifications) {
        // SXSSFWorkbook for memory-efficient large exports
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            workbook.setCompressTempFiles(true);
            Sheet sheet = workbook.createSheet("Certifications");

            // Styles
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle approvedStyle = createStatusStyle(workbook, IndexedColors.LIGHT_GREEN);
            CellStyle pendingStyle = createStatusStyle(workbook, IndexedColors.LIGHT_YELLOW);

            // Header Row
            String[] headers = {
                "#", "University ID", "Student Name", "Course Code",
                "Course Title", "Credly Link", "Status", "Submitted At", "Verified At"
            };
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data Rows
            int rowNum = 1;
            for (RegisteredCourseDto cert : certifications) {
                Row row = sheet.createRow(rowNum++);
                CellStyle statusStyle = "APPROVED".equals(cert.getStatus().name()) ? approvedStyle : pendingStyle;

                createCell(row, 0, String.valueOf(rowNum - 1), dataStyle);
                createCell(row, 1, cert.getUniversityId(), dataStyle);
                createCell(row, 2, cert.getStudentName(), dataStyle);
                createCell(row, 3, cert.getCourseCode(), dataStyle);
                createCell(row, 4, cert.getCourseTitle(), dataStyle);
                createCell(row, 5, cert.getCredlyLink(), dataStyle);
                createCell(row, 6, cert.getStatus().name(), statusStyle);
                createCell(row, 7,
                    cert.getSubmittedAt() != null ? cert.getSubmittedAt().format(FORMATTER) : "",
                    dataStyle);
                createCell(row, 8,
                    cert.getVerifiedAt() != null ? cert.getVerifiedAt().format(FORMATTER) : "",
                    dataStyle);
            }

            // Auto-size columns (skip for SXSSFWorkbook - use manual widths)
            int[] columnWidths = {8, 20, 25, 20, 40, 60, 15, 25, 25};
            for (int i = 0; i < columnWidths.length; i++) {
                sheet.setColumnWidth(i, columnWidths[i] * 256);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            workbook.dispose(); // Clean temp files
            return out.toByteArray();
        } catch (IOException e) {
            log.error("Error generating Excel export", e);
            throw new RuntimeException("Failed to generate Excel report");
        }
    }

    private void createCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value != null ? value : "");
        cell.setCellStyle(style);
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.LEFT);
        return style;
    }

    private CellStyle createStatusStyle(Workbook workbook, IndexedColors color) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(color.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        return style;
    }
}
