package com.reyval.backend.controllers;

import com.reyval.backend.entity.Lead;
import com.reyval.backend.entity.Opportunity;
import com.reyval.backend.entity.Cliente;
import com.reyval.backend.services.CRMService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CONTROLADOR DE CRM Y PROSPECTACIÓN (CU03)
 * <p>
 * Centraliza la gestión de Leads y Oportunidades. Permite el seguimiento 
 * de prospectos desde su captura inicial hasta la pre-calificación y
 * asignación de lotes específicos para negociación.
 * 
 * @author Reyval Systems
 * @version 1.0
 * @see <a href="SRS_Reyval_ERP.md#cu03-registro-de-clientes-y-seguimiento-crm">CU03: CRM Inmobiliario</a>
 */
@RestController
@RequestMapping("/api/crm")
public class CRMController {

    @Autowired
    private CRMService crmService;

    // LEADS
    @GetMapping("/leads")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION')")
    public List<Lead> getAllLeads() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        List<String> roles = auth.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .collect(java.util.stream.Collectors.toList());

        return crmService.getAllLeadsFiltered(roles);
    }

    @PostMapping("/leads")
    // Permitido para todos (Web/Chatbot) - se configura en WebSecurityConfig
    public ResponseEntity<Lead> createLead(@RequestBody Lead lead) {
        return ResponseEntity.ok(crmService.createLead(lead));
    }

    @PostMapping("/leads/{id}/convert")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION')")
    public ResponseEntity<Opportunity> convertLead(@PathVariable Long id, @RequestParam Long loteId) {
        return ResponseEntity.ok(crmService.convertLeadToOpportunity(id, loteId));
    }

    @PostMapping("/leads/{id}/send-price-list")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
    public ResponseEntity<Lead> sendPriceList(@PathVariable Long id, @RequestBody List<Long> fraccionamientoIds) {
        return ResponseEntity.ok(crmService.sendPriceList(id, fraccionamientoIds));
    }

    @PostMapping("/leads/{id}/send-budget")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
    public ResponseEntity<Lead> sendBudget(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload) {
        return ResponseEntity.ok(crmService.sendBudget(id, payload.get("details")));
    }

    // OPPORTUNITIES
    @GetMapping("/opportunities")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION')")
    public List<Opportunity> getAllOpportunities() {
        return crmService.getAllOpportunities();
    }

    @PutMapping("/opportunities/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR', 'RECEPCION')")
    public ResponseEntity<Opportunity> updateOpportunity(@PathVariable Long id, @RequestBody Opportunity opportunity) {
        return ResponseEntity.ok(crmService.updateOpportunity(id, opportunity));
    }

    @PostMapping("/opportunities/{id}/convert")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Cliente> convertOpportunity(@PathVariable Long id) {
        return ResponseEntity.ok(crmService.convertOpportunityToClient(id));
    }
}
