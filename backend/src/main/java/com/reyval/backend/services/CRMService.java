package com.reyval.backend.services;

import com.reyval.backend.entity.*;
import com.reyval.backend.repository.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ECU-03: Motor de Gestión de Relaciones con el Cliente (CRM).
 * <p>
 * Este servicio implementa el Ciclo de Vida del Prospecto, desde su registro inicial
 * como Lead hasta su conversión en Cliente formal tras la negociación de una Oportunidad.
 * Centraliza la lógica de filtrado por roles para asegurar la privacidad de la información.
 * 
 * @author Reyval Systems
 * @version 1.0
 * @see <a href="SRS_Reyval_ERP.md#cu03-registro-de-clientes-y-seguimiento-crm">CU03: CRM Inmobiliario</a>
 */
@Service
public class CRMService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private LoteRepository loteRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder encoder;

    // Leads logic
    public List<Lead> getAllLeads() {
        return leadRepository.findAll();
    }

    public List<Lead> getAllLeadsFiltered(List<String> roles) {
        List<Lead> allLeads = leadRepository.findAll();

        if (roles.contains("ROLE_ADMIN") || roles.contains("ROLE_RECEPCION")) {
            return allLeads;
        }

        if (roles.contains("ROLE_VENDEDOR")) {
            // Vendedores see everything EXCEPT "REPRESENTANTE"
            return allLeads.stream()
                    .filter(l -> !"REPRESENTANTE".equalsIgnoreCase(l.getInteres()))
                    .collect(java.util.stream.Collectors.toList());
        }

        return List.of(); // Default empty if no relevant role
    }

    public Lead createLead(Lead lead) {
        if (lead.getFechaRegistro() == null) {
            lead.setFechaRegistro(LocalDateTime.now());
        }
        if (lead.getStatus() == null) {
            lead.setStatus(ELeadStatus.NEW);
        }
        System.out.println("DEBUG: Creating Lead -> " + lead.getNombre() + " (" + lead.getSource() + ")");
        return leadRepository.save(lead);
    }

    @Transactional
    public Lead sendPriceList(Long id, List<Long> fraccionamientoIds) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead no encontrado"));
        
        lead.setStatus(ELeadStatus.PRICE_LIST_SENT);
        String log = "\n[" + LocalDateTime.now() + "] Lista de precios enviada (IDs: " + fraccionamientoIds + ")";
        lead.setMensaje(lead.getMensaje() == null ? log : lead.getMensaje() + log);
        
        return leadRepository.save(lead);
    }

    @Transactional
    public Lead sendBudget(Long id, String details) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead no encontrado"));
        
        lead.setStatus(ELeadStatus.BUDGET_SENT);
        String log = "\n[" + LocalDateTime.now() + "] Presupuesto enviado: " + details;
        lead.setMensaje(lead.getMensaje() == null ? log : lead.getMensaje() + log);
        
        return leadRepository.save(lead);
    }

    @Transactional
    public Opportunity convertLeadToOpportunity(Long leadId, Long loteId) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead no encontrado"));
        Lote lote = loteRepository.findById(loteId)
                .orElseThrow(() -> new RuntimeException("Lote no encontrado"));

        lead.setStatus(ELeadStatus.QUALIFIED);
        leadRepository.save(lead);

        Opportunity opp = new Opportunity();
        opp.setLead(lead);
        opp.setLote(lote);
        opp.setMontoEstimado(lote.getPrecioTotal());
        opp.setStatus(EOpportunityStatus.NEGOTIATION);

        return opportunityRepository.save(opp);
    }

    // Opportunity logic
    public List<Opportunity> getAllOpportunities() {
        return opportunityRepository.findAll();
    }

    public Opportunity updateOpportunity(Long id, Opportunity oppData) {
        Opportunity opp = opportunityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Oportunidad no encontrada"));

        opp.setStatus(oppData.getStatus());
        opp.setNotas(oppData.getNotas());
        opp.setMontoEstimado(oppData.getMontoEstimado());
        opp.setFechaCierreEstimada(oppData.getFechaCierreEstimada());

        return opportunityRepository.save(opp);
    }

    @Transactional
    public Cliente convertOpportunityToClient(Long oppId) {
        Opportunity opp = opportunityRepository.findById(oppId)
                .orElseThrow(() -> new RuntimeException("Oportunidad no encontrada"));

        Lead lead = opp.getLead();

        // Create actual Cliente
        Cliente cliente = new Cliente();
        cliente.setNombre(lead.getNombre());
        cliente.setEmail(lead.getEmail());
        cliente.setTelefono(lead.getTelefono());
        cliente.setDireccion("Pendiente de actualizar");

        // The ClienteListener (Trigger) will handle User account creation automatically
        Cliente savedCliente = clienteRepository.save(cliente);

        opp.setStatus(EOpportunityStatus.WON);
        opportunityRepository.save(opp);

        return savedCliente;
    }
}
