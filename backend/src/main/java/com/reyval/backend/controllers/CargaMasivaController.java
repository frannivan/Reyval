package com.reyval.backend.controllers;

import com.reyval.backend.entity.*;
import com.reyval.backend.repository.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;

/**
 * CONTROLADOR DE CARGA MASIVA (CU07)
 * <p>
 * Este componente permite la ingesta masiva de datos mediante archivos Excel.
 * Soporta la importación de usuarios, lotes, fraccionamientos, clientes,
 * contratos y pagos, realizando validaciones de integridad y negocio.
 * 
 * @author Reyval Systems
 * @version 1.0
 * @see <a href="SRS_Reyval_ERP.md#cu07-carga-masiva-de-datos">CU07: Carga Masiva</a>
 */
@RestController
@RequestMapping("/api/carga-masiva")
@PreAuthorize("hasRole('ADMIN')")
public class CargaMasivaController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private FraccionamientoRepository fraccionamientoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ContratoRepository contratoRepository;

    @Autowired
    private PagoRepository pagoRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/template/{tipo}")
    public ResponseEntity<byte[]> downloadTemplate(@PathVariable String tipo) throws IOException {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Datos");

        // Header row
        Row headerRow = sheet.createRow(0);
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);

        String[] headers;
        String[] descriptions;

        switch (tipo.toLowerCase()) {
            case "usuarios":
                headers = new String[]{"username", "email", "password", "rol"};
                descriptions = new String[]{"Nombre de usuario (único)", "Email (único)", "Contraseña", "Rol del usuario (ROLE_USER, ROLE_ADMIN, ROLE_VENDEDOR, etc.)"};
                break;
            case "lotes":
                headers = new String[]{"numeroLote", "manzana", "precioTotal", "areaMetrosCuadrados", "coordenadasGeo", "fraccionamientoId", "estatus"};
                descriptions = new String[]{"Número del lote", "Manzana", "Precio total (número)", "Área en m² (número)", "Coordenadas (lat,lng)", "ID del fraccionamiento (opcional)", "DISPONIBLE/VENDIDO/APARTADO/CONTRATADO"};
                break;
            case "fraccionamientos":
                headers = new String[]{"nombre", "ubicacion", "descripcion", "logoUrl", "coordenadasGeo"};
                descriptions = new String[]{"Nombre del fraccionamiento", "Ubicación/Ciudad", "Descripción", "URL del logo (opcional)", "Coordenadas o polígono"};
                break;
            case "clientes":
                headers = new String[]{"nombre", "apellidos", "email", "telefono", "direccion", "ine"};
                descriptions = new String[]{"Nombre(s)", "Apellido(s)", "Email (único)", "Teléfono", "Dirección física (opcional)", "INE/Identificación (opcional)"};
                break;
            case "contratos":
                headers = new String[]{"clienteId", "loteId", "fechaContrato", "montoTotal", "enganche", "plazoMeses", "tasaInteresAnual", "estatus"};
                descriptions = new String[]{"ID del Cliente", "ID del Lote", "AAAA-MM-DD", "Monto total de venta", "Monto de enganche", "Meses de plazo", "Tasa % anual", "ACTIVO/PAGADO/CANCELADO"};
                break;
            case "pagos":
                headers = new String[]{"contratoId", "fechaPago", "monto", "referencia", "concepto", "metodoPago"};
                descriptions = new String[]{"ID del Contrato", "AAAA-MM-DD", "Monto pagado", "Número de referencia", "Concepto (Enganche, Mensualidad X, etc)", "Transferencia/Efectivo/Depósito"};
                break;
            default:
                return ResponseEntity.badRequest().build();
        }

        // Create headers
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 5000);
        }

        // Add description row
        Row descRow = sheet.createRow(1);
        CellStyle descStyle = workbook.createCellStyle();
        Font descFont = workbook.createFont();
        descFont.setItalic(true);
        descFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        descStyle.setFont(descFont);

        for (int i = 0; i < descriptions.length; i++) {
            Cell cell = descRow.createCell(i);
            cell.setCellValue(descriptions[i]);
            cell.setCellStyle(descStyle);
        }

        // Write to byte array
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        HttpHeaders headersResponse = new HttpHeaders();
        headersResponse.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headersResponse.setContentDispositionFormData("attachment", "plantilla_" + tipo + ".xlsx");

        return ResponseEntity.ok()
                .headers(headersResponse)
                .body(outputStream.toByteArray());
    }

    @GetMapping("/template/master")
    public ResponseEntity<byte[]> downloadMasterTemplate() throws IOException {
        Workbook workbook = new XSSFWorkbook();
        createSheet(workbook, "usuarios", 
            new String[]{"username", "email", "password", "rol"},
            new String[]{"Nombre de usuario (único)", "Email (único)", "Contraseña", "Rol del usuario (ROLE_USER, ROLE_ADMIN, ROLE_VENDEDOR, etc.)"});
        
        createSheet(workbook, "lotes", 
            new String[]{"numeroLote", "manzana", "precioTotal", "areaMetrosCuadrados", "coordenadasGeo", "fraccionamientoId", "estatus"},
            new String[]{"Número del lote", "Manzana", "Precio total (número)", "Área en m² (número)", "Coordenadas (lat,lng)", "ID del fraccionamiento (opcional)", "DISPONIBLE/VENDIDO/APARTADO/CONTRATADO"});
        
        createSheet(workbook, "fraccionamientos", 
            new String[]{"nombre", "ubicacion", "descripcion", "logoUrl", "coordenadasGeo"},
            new String[]{"Nombre del fraccionamiento", "Ubicación/Ciudad", "Descripción", "URL del logo (opcional)", "Coordenadas o polígono"});
            
        createSheet(workbook, "clientes", 
            new String[]{"nombre", "apellidos", "email", "telefono", "direccion", "ine"},
            new String[]{"Nombre(s)", "Apellido(s)", "Email (único)", "Teléfono", "Dirección física (opcional)", "INE/Identificación (opcional)"});

        createSheet(workbook, "contratos", 
            new String[]{"clienteId", "loteId", "fechaContrato", "montoTotal", "enganche", "plazoMeses", "tasaInteresAnual", "estatus"},
            new String[]{"ID del Cliente", "ID del Lote", "AAAA-MM-DD", "Monto total de venta", "Monto de enganche", "Meses de plazo", "Tasa % anual", "ACTIVO/PAGADO/CANCELADO"});

        createSheet(workbook, "pagos", 
            new String[]{"contratoId", "fechaPago", "monto", "referencia", "concepto", "metodoPago"},
            new String[]{"ID del Contrato", "AAAA-MM-DD", "Monto pagado", "Número de referencia", "Concepto (Enganche, Mensualidad X, etc)", "Transferencia/Efectivo/Depósito"});

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        workbook.write(outputStream);
        workbook.close();

        HttpHeaders headersResponse = new HttpHeaders();
        headersResponse.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headersResponse.setContentDispositionFormData("attachment", "plantilla_maestra_reyval.xlsx");

        return ResponseEntity.ok()
                .headers(headersResponse)
                .body(outputStream.toByteArray());
    }

    private void createSheet(Workbook workbook, String name, String[] headers, String[] descriptions) {
        Sheet sheet = workbook.createSheet(name);
        Row headerRow = sheet.createRow(0);
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);

        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
            sheet.setColumnWidth(i, 5000);
        }

        Row descRow = sheet.createRow(1);
        CellStyle descStyle = workbook.createCellStyle();
        Font descFont = workbook.createFont();
        descFont.setItalic(true);
        descFont.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        descStyle.setFont(descFont);

        for (int i = 0; i < descriptions.length; i++) {
            Cell cell = descRow.createCell(i);
            cell.setCellValue(descriptions[i]);
            cell.setCellStyle(descStyle);
        }
    }

    @PostMapping("/upload/{tipo}")
    public ResponseEntity<?> uploadData(@PathVariable String tipo, @RequestParam("file") MultipartFile file) throws IOException {
        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        List<String> errors = new ArrayList<>();
        int successCount = 0;

        switch (tipo.toLowerCase()) {
            case "usuarios":
                for (int i = 2; i < sheet.getPhysicalNumberOfRows(); i++) { // Skip header and description
                    Row row = sheet.getRow(i);
                    if (row == null) continue;

                    try {
                        String username = getCellValue(row.getCell(0));
                        String email = getCellValue(row.getCell(1));
                        String password = getCellValue(row.getCell(2));
                        String rolesStr = getCellValue(row.getCell(3));

                        if (username.isEmpty() || email.isEmpty() || password.isEmpty()) {
                            errors.add("Fila " + (i + 1) + ": Campos obligatorios vacíos");
                            continue;
                        }

                        if (userRepository.existsByUsername(username)) {
                            errors.add("Fila " + (i + 1) + ": Usuario '" + username + "' ya existe");
                            continue;
                        }

                        User user = new User();
                        user.setUsername(username);
                        user.setEmail(email);
                        user.setPassword(passwordEncoder.encode(password));

                        Role role;
                        if (!rolesStr.isEmpty()) {
                            // Take first role if multiple provided by mistake
                            String roleName = rolesStr.split(",")[0].trim();
                            ERole eRole = ERole.valueOf(roleName);
                            role = roleRepository.findByName(eRole)
                                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                        } else {
                            role = roleRepository.findByName(ERole.ROLE_USER)
                                    .orElseThrow(() -> new RuntimeException("Default role not found"));
                        }
                        user.setRole(role);

                        userRepository.save(user);
                        successCount++;
                    } catch (Exception e) {
                        errors.add("Fila " + (i + 1) + ": " + e.getMessage());
                    }
                }
                break;

            case "lotes":
                for (int i = 2; i < sheet.getPhysicalNumberOfRows(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null) continue;

                    try {
                        String numeroLote = getCellValue(row.getCell(0));
                        String manzana = getCellValue(row.getCell(1));
                        String precioStr = getCellValue(row.getCell(2));
                        String areaStr = getCellValue(row.getCell(3));
                        String coordenadas = getCellValue(row.getCell(4));
                        String fraccIdStr = getCellValue(row.getCell(5));
                        String estatusStr = getCellValue(row.getCell(6));

                        if (numeroLote.isEmpty() || manzana.isEmpty() || precioStr.isEmpty()) {
                            errors.add("Fila " + (i + 1) + ": Campos obligatorios vacíos");
                            continue;
                        }

                        Lote lote = new Lote();
                        lote.setNumeroLote(numeroLote);
                        lote.setManzana(manzana);
                        lote.setPrecioTotal(new java.math.BigDecimal(precioStr));
                        lote.setAreaMetrosCuadrados(!areaStr.isEmpty() ? Double.parseDouble(areaStr) : 0.0);
                        lote.setCoordenadasGeo(coordenadas);

                        if (!fraccIdStr.isEmpty()) {
                            Long fraccId = Long.parseLong(fraccIdStr);
                            Fraccionamiento fracc = fraccionamientoRepository.findById(fraccId).orElse(null);
                            lote.setFraccionamiento(fracc);
                        }

                        if (!estatusStr.isEmpty()) {
                            lote.setEstatus(EStatusLote.valueOf(estatusStr.toUpperCase()));
                        } else {
                            lote.setEstatus(EStatusLote.DISPONIBLE);
                        }

                        loteRepository.save(lote);
                        successCount++;
                    } catch (Exception e) {
                        errors.add("Fila " + (i + 1) + ": " + e.getMessage());
                    }
                }
                break;

            case "fraccionamientos":
                for (int i = 2; i < sheet.getPhysicalNumberOfRows(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null) continue;

                    try {
                        String nombre = getCellValue(row.getCell(0));
                        String ubicacion = getCellValue(row.getCell(1));
                        String descripcion = getCellValue(row.getCell(2));
                        String logoUrl = getCellValue(row.getCell(3));
                        String coordenadas = getCellValue(row.getCell(4));

                        if (nombre.isEmpty()) {
                            errors.add("Fila " + (i + 1) + ": Nombre es obligatorio");
                            continue;
                        }

                        Fraccionamiento fracc = new Fraccionamiento();
                        fracc.setNombre(nombre);
                        fracc.setUbicacion(ubicacion);
                        fracc.setDescripcion(descripcion);
                        fracc.setLogoUrl(logoUrl);
                        fracc.setCoordenadasGeo(coordenadas);

                        fraccionamientoRepository.save(fracc);
                        successCount++;
                    } catch (Exception e) {
                        errors.add("Fila " + (i + 1) + ": " + e.getMessage());
                    }
                }
                break;

            case "clientes":
                for (int i = 2; i < sheet.getPhysicalNumberOfRows(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null) continue;
                    try {
                        String nombre = getCellValue(row.getCell(0));
                        String apellidos = getCellValue(row.getCell(1));
                        String email = getCellValue(row.getCell(2));
                        String telefono = getCellValue(row.getCell(3));
                        String direccion = getCellValue(row.getCell(4));
                        String ine = getCellValue(row.getCell(5));

                        if (nombre.isEmpty() || email.isEmpty()) {
                            errors.add("Fila " + (i + 1) + ": Nombre y Email son obligatorios");
                            continue;
                        }
                        if (clienteRepository.existsByEmail(email)) {
                            errors.add("Fila " + (i + 1) + ": El email '" + email + "' ya está registrado");
                            continue;
                        }

                        Cliente cliente = new Cliente();
                        cliente.setNombre(nombre);
                        cliente.setApellidos(apellidos);
                        cliente.setEmail(email);
                        cliente.setTelefono(telefono);
                        cliente.setDireccion(direccion);
                        cliente.setIne(ine);

                        // ClienteListener (Trigger) will handle User creation automatically
                        clienteRepository.save(cliente);
                        successCount++;
                    } catch (Exception e) {
                        errors.add("Fila " + (i + 1) + ": " + e.getMessage());
                    }
                }
                break;

            case "contratos":
                for (int i = 2; i < sheet.getPhysicalNumberOfRows(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null) continue;
                    try {
                        String cliIdStr = getCellValue(row.getCell(0));
                        String loteIdStr = getCellValue(row.getCell(1));
                        String fechaStr = getCellValue(row.getCell(2));
                        String montoStr = getCellValue(row.getCell(3));
                        String engancheStr = getCellValue(row.getCell(4));
                        String plazoStr = getCellValue(row.getCell(5));
                        String tasaStr = getCellValue(row.getCell(6));
                        String estatusStr = getCellValue(row.getCell(7));

                        if (cliIdStr.isEmpty() || loteIdStr.isEmpty() || montoStr.isEmpty()) {
                            errors.add("Fila " + (i + 1) + ": ClienteID, LoteID y Monto son obligatorios");
                            continue;
                        }

                        Contrato contrato = new Contrato();
                        Cliente cli = clienteRepository.findById(Long.parseLong(cliIdStr)).orElse(null);
                        Lote lote = loteRepository.findById(Long.parseLong(loteIdStr)).orElse(null);

                        if (cli == null || lote == null) {
                            errors.add("Fila " + (i + 1) + ": Cliente o Lote no encontrado");
                            continue;
                        }

                        contrato.setCliente(cli);
                        contrato.setLote(lote);
                        contrato.setFechaContrato(java.time.LocalDate.parse(fechaStr));
                        contrato.setMontoTotal(new java.math.BigDecimal(montoStr));
                        contrato.setEnganche(new java.math.BigDecimal(!engancheStr.isEmpty() ? engancheStr : "0"));
                        contrato.setPlazoMeses(!plazoStr.isEmpty() ? Integer.parseInt(plazoStr) : 0);
                        contrato.setTasaInteresAnual(!tasaStr.isEmpty() ? Double.parseDouble(tasaStr) : 0.0);
                        contrato.setEstatus(EStatusContrato.valueOf(estatusStr.toUpperCase()));

                        contratoRepository.save(contrato);
                        successCount++;
                    } catch (Exception e) {
                        errors.add("Fila " + (i + 1) + ": " + e.getMessage());
                    }
                }
                break;

            case "pagos":
                for (int i = 2; i < sheet.getPhysicalNumberOfRows(); i++) {
                    Row row = sheet.getRow(i);
                    if (row == null) continue;
                    try {
                        String contIdStr = getCellValue(row.getCell(0));
                        String fechaStr = getCellValue(row.getCell(1));
                        String montoStr = getCellValue(row.getCell(2));
                        String ref = getCellValue(row.getCell(3));
                        String concepto = getCellValue(row.getCell(4));
                        String metodo = getCellValue(row.getCell(5));

                        if (contIdStr.isEmpty() || montoStr.isEmpty()) {
                            errors.add("Fila " + (i + 1) + ": ContratoID y Monto son obligatorios");
                            continue;
                        }

                        Pago pago = new Pago();
                        Contrato cont = contratoRepository.findById(Long.parseLong(contIdStr)).orElse(null);
                        if (cont == null) {
                            errors.add("Fila " + (i + 1) + ": Contrato no encontrado");
                            continue;
                        }

                        pago.setContrato(cont);
                        pago.setFechaPago(java.time.LocalDate.parse(fechaStr));
                        pago.setMonto(new java.math.BigDecimal(montoStr));
                        pago.setReferencia(ref);
                        pago.setConcepto(concepto);
                        pago.setMetodoPago(metodo);
                        pago.setEstatus(EPagoStatus.VALIDADO); 
                        pago.setValidado(true);
                        pago.setFechaValidacion(java.time.LocalDateTime.now());
                        pago.setValidadoPor("CARGA_MASIVA");

                        pagoRepository.save(pago);
                        successCount++;
                    } catch (Exception e) {
                        errors.add("Fila " + (i + 1) + ": " + e.getMessage());
                    }
                }
                break;

            default:
                throw new IllegalArgumentException("Tipo de carga no válido: " + tipo);
        }

        workbook.close();

        Map<String, Object> response = new HashMap<>();
        response.put("success", successCount);
        response.put("errors", errors);
        response.put("message", "Procesados: " + successCount + " registros. Errores: " + errors.size());

        return ResponseEntity.ok(response);

    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                }
                double numVal = cell.getNumericCellValue();
                if (numVal == (long) numVal) {
                    return String.valueOf((long) numVal);
                } else {
                    return String.valueOf(numVal);
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }
}
