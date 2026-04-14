import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CRMService } from '../../../services/crm.service';
import { LoteService } from '../../../services/lote';
import { CommunicationModalComponent } from '../communication-modal.component';
import { ExportService } from '../../../services/export.service';
import { FraccionamientoService } from '../../../services/fraccionamiento';
import { CrmLeadDossierComponent } from './crm-lead-dossier.component';

@Component({
    selector: 'app-crm-leads',
    templateUrl: './crm-leads.component.html',
    styleUrls: ['./crm-leads.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, CommunicationModalComponent, CrmLeadDossierComponent]
})
export class CrmLeadsComponent implements OnInit {
    leads: any[] = [];
    availableLotes: any[] = [];
    selectedLead: any = null;
    selectedLoteId: number | null = null;
    showConvertModal = false;
    successMsg = '';
    errorMsg = '';
    searchTerm = '';
    showCommModal = false;
    
    // New Actions
    showPriceListModal = false;
    showBudgetModal = false;
    showDossier = false;
    fraccionamientos: any[] = [];
    selectedFraccIds: number[] = [];
    budgetDetails = '';

    get filteredLeads() {
        if (!this.searchTerm) return this.leads;
        const s = this.searchTerm.toLowerCase();
        return this.leads.filter(l => 
            (l.nombre?.toLowerCase().includes(s) || false) || 
            (l.email?.toLowerCase().includes(s) || false) ||
            (l.telefono?.includes(s) || false)
        );
    }

    private crmService = inject(CRMService);
    private loteService = inject(LoteService);
    private exportService = inject(ExportService);
    private fraccionamientoService = inject(FraccionamientoService);

    constructor() { }

    ngOnInit(): void {
        this.loadLeads();
        this.loadLotes();
        this.loadFraccionamientos();
    }

    loadLeads(): void {
        this.crmService.getAllLeads().subscribe({
            next: (data: any) => this.leads = data,
            error: (err: any) => this.errorMsg = 'Error al cargar prospectos'
        });
    }

    loadLotes(): void {
        this.loteService.getAllLotes().subscribe({
            next: (data: any) => this.availableLotes = data,
            error: (err: any) => console.error('Error al cargar lotes', err)
        });
    }

    loadFraccionamientos(): void {
        this.fraccionamientoService.getAllFraccionamientos().subscribe({
            next: (data: any) => this.fraccionamientos = data,
            error: (err: any) => console.error('Error al cargar fraccionamientos', err)
        });
    }

    openConvertModal(lead: any): void {
        this.selectedLead = lead;
        this.showConvertModal = true;
        this.errorMsg = '';
        this.successMsg = '';
    }

    openCommModal(lead: any): void {
        this.selectedLead = lead;
        this.showCommModal = true;
    }

    confirmConvert(): void {
        if (!this.selectedLoteId) {
            this.errorMsg = 'Debe seleccionar un lote';
            return;
        }

        this.crmService.convertLeadToOpportunity(this.selectedLead.id, this.selectedLoteId).subscribe({
            next: () => {
                this.successMsg = '¡Convertido a oportunidad exitosamente!';
                this.showDossier = false;
                this.loadLeads();
                setTimeout(() => this.showConvertModal = false, 2000);
            },
            error: (err: any) => this.errorMsg = 'Error al convertir: ' + (err.message || 'Error desconocido')
        });
    }

    exportExcel(): void {
        this.exportService.exportToExcel('/reportes/leads', {}, 'lista_leads.xlsx');
    }

    openPriceListModal(lead: any): void {
        this.selectedLead = lead;
        this.selectedFraccIds = [];
        this.showPriceListModal = true;
    }

    openBudgetModal(lead: any): void {
        this.selectedLead = lead;
        this.budgetDetails = '';
        this.showBudgetModal = true;
    }

    toggleFraccSelection(id: number): void {
        const index = this.selectedFraccIds.indexOf(id);
        if (index > -1) {
            this.selectedFraccIds.splice(index, 1);
        } else {
            this.selectedFraccIds.push(id);
        }
    }

    confirmPriceList(): void {
        if (this.selectedFraccIds.length === 0) return;
        this.crmService.sendPriceList(this.selectedLead.id, this.selectedFraccIds).subscribe({
            next: () => {
                this.successMsg = 'Lista de precios marcada como enviada';
                this.loadLeads();
                setTimeout(() => this.showPriceListModal = false, 2000);
            },
            error: err => this.errorMsg = 'Error al procesar'
        });
    }

    confirmBudget(): void {
        if (!this.budgetDetails) return;
        this.crmService.sendBudget(this.selectedLead.id, this.budgetDetails).subscribe({
            next: () => {
                this.successMsg = 'Presupuesto marcado como enviado';
                this.loadLeads();
                setTimeout(() => this.showBudgetModal = false, 2000);
            },
            error: err => this.errorMsg = 'Error al procesar'
        });
    }
    
    getPipelineProgress(status: string): number {
        switch(status) {
            case 'NEW': return 20;
            case 'CONTACTED': return 40;
            case 'PRICE_LIST_SENT': return 60;
            case 'BUDGET_SENT': return 80;
            case 'QUALIFIED': return 100;
            default: return 0;
        }
    }

    openDossier(lead: any): void {
        this.selectedLead = lead;
        this.showDossier = true;
    }

    handleDossierAction(event: {type: string, payload?: any}): void {
        switch(event.type) {
            case 'whatsapp':
            case 'email':
                this.openCommModal(this.selectedLead);
                break;
            case 'priceList':
                this.openPriceListModal(this.selectedLead);
                break;
            case 'budget':
                this.openBudgetModal(this.selectedLead);
                break;
            case 'convert':
                this.openConvertModal(this.selectedLead);
                break;
        }
    }
}
