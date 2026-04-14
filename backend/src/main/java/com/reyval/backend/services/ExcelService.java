package com.reyval.backend.services;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * ECU-10: Motor de Generación de Reportes en Formato Excel.
 * <p>
 * Proporciona capacidades de exportación masiva de datos utilizando Apache POI.
 * Soporta la generación de sábanas de datos para usuarios, pagos e inventario 
 * cumpliendo con los estándares de auditoría del Directivo.
 * 
 * @author Reyval Systems
 * @version 1.0
 * @see <a href="SRS_Reyval_ERP.md#cu10-reportes-e-inteligencia-de-negocio">CU10: Reportes BI</a>
 * @see <a href="SRS_Reyval_ERP.md#cu07-carga-masiva-de-datos">CU07: Carga Masiva</a>
 */
@Service
public class ExcelService {

    public ByteArrayInputStream generateUsersReport(List<Map<String, Object>> users) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Usuarios");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Create headers
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Usuario", "Email", "Roles", "Fecha Creación"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            // Data rows
            int rowIdx = 1;
            for (Map<String, Object> user : users) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(String.valueOf(user.get("id")));
                row.createCell(1).setCellValue(String.valueOf(user.get("username")));
                row.createCell(2).setCellValue(String.valueOf(user.get("email")));
                row.createCell(3).setCellValue(String.valueOf(user.get("roles")));
                row.createCell(4).setCellValue(String.valueOf(user.get("createdAt")));
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream generatePagosReport(List<?> pagos) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Pagos");

            // Header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Create headers
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Fecha", "Monto", "Concepto", "Referencia", "Método", "Contrato ID"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            // Data rows
            int rowIdx = 1;
            for (Object obj : pagos) {
                // We use reflection or cast if we know the type. 
                // Since this is a specialized service, we might as well use specific DTOs or entities.
                if (obj instanceof com.reyval.backend.entity.Pago) {
                    com.reyval.backend.entity.Pago p = (com.reyval.backend.entity.Pago) obj;
                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(p.getId());
                    row.createCell(1).setCellValue(p.getFechaPago().toString());
                    row.createCell(2).setCellValue(p.getMonto().doubleValue());
                    row.createCell(3).setCellValue(p.getConcepto());
                    row.createCell(4).setCellValue(p.getReferencia());
                    row.createCell(5).setCellValue(p.getMetodoPago());
                    row.createCell(6).setCellValue(p.getContrato() != null ? p.getContrato().getId().toString() : "N/A");
                }
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream generateInventarioReport(List<com.reyval.backend.entity.Lote> lotes) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Inventario Lotes");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Lote", "Manzana", "Fraccionamiento", "Precio", "Área (m²)", "Estatus"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowIdx = 1;
            for (com.reyval.backend.entity.Lote lote : lotes) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(lote.getNumeroLote());
                row.createCell(1).setCellValue(lote.getManzana());
                row.createCell(2).setCellValue(lote.getFraccionamiento() != null ? lote.getFraccionamiento().getNombre() : "Independiente");
                row.createCell(3).setCellValue(lote.getPrecioTotal().doubleValue());
                row.createCell(4).setCellValue(lote.getAreaMetrosCuadrados());
                row.createCell(5).setCellValue(String.valueOf(lote.getEstatus()));
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream generateLeadsReport(List<com.reyval.backend.entity.Lead> leads) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Prospectos");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Nombre", "Email", "Teléfono", "Origen", "Interés", "Estatus", "Fecha Registro"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowIdx = 1;
            for (com.reyval.backend.entity.Lead lead : leads) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(lead.getId());
                row.createCell(1).setCellValue(lead.getNombre());
                row.createCell(2).setCellValue(lead.getEmail());
                row.createCell(3).setCellValue(lead.getTelefono());
                row.createCell(4).setCellValue(lead.getSource());
                row.createCell(5).setCellValue(lead.getInteres());
                row.createCell(6).setCellValue(String.valueOf(lead.getStatus()));
                row.createCell(7).setCellValue(lead.getFechaRegistro().toString());
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }

    public ByteArrayInputStream generateOpportunitiesReport(List<com.reyval.backend.entity.Opportunity> opportunities) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Oportunidades");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Prospecto", "Lote", "Manzana", "Monto Estimado", "Estatus", "Cierre Estimado"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 5000);
            }

            int rowIdx = 1;
            for (com.reyval.backend.entity.Opportunity opp : opportunities) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(opp.getId());
                row.createCell(1).setCellValue(opp.getLead() != null ? opp.getLead().getNombre() : "N/A");
                row.createCell(2).setCellValue(opp.getLote() != null ? opp.getLote().getNumeroLote() : "N/A");
                row.createCell(3).setCellValue(opp.getLote() != null ? opp.getLote().getManzana() : "N/A");
                row.createCell(4).setCellValue(opp.getMontoEstimado() != null ? opp.getMontoEstimado().doubleValue() : 0.0);
                row.createCell(5).setCellValue(String.valueOf(opp.getStatus()));
                row.createCell(6).setCellValue(opp.getFechaCierreEstimada() != null ? opp.getFechaCierreEstimada().toString() : "N/A");
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
        }
    }
}
