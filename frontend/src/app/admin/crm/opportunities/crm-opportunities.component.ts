import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CRMService } from '../../../services/crm.service';
import { CommunicationModalComponent } from '../communication-modal.component';
import { ExportService } from '../../../services/export.service';

@Component({
    selector: 'app-crm-opportunities',
    templateUrl: './crm-opportunities.component.html',
    styleUrls: ['./crm-opportunities.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, CommunicationModalComponent]
})
export class CrmOpportunitiesComponent implements OnInit {
    opportunities: any[] = [];
    successMsg = '';
    errorMsg = '';
    searchTerm = '';
    showCommModal = false;

    get filteredOpportunities() {
        if (!this.searchTerm) return this.opportunities;
        const s = this.searchTerm.toLowerCase();
        return this.opportunities.filter(o => 
            (o.lead?.nombre?.toLowerCase().includes(s) || false) || 
            (o.lote?.numeroLote?.toString().includes(s) || false) ||
            (o.lote?.manzana?.toLowerCase().includes(s) || false)
        );
    }

    private crmService = inject(CRMService);
    private exportService = inject(ExportService);

    constructor() { }

    ngOnInit(): void {
        this.loadOpportunities();
    }

    loadOpportunities(): void {
        this.crmService.getAllOpportunities().subscribe({
            next: (data: any) => this.opportunities = data,
            error: (err: any) => this.errorMsg = 'Error al cargar oportunidades'
        });
    }

    updateStatus(opp: any, newStatus: string): void {
        const originalStatus = opp.status;
        opp.status = newStatus;
        this.crmService.updateOpportunity(opp.id, opp).subscribe({
            next: () => {
                this.successMsg = 'Estado actualizado';
                setTimeout(() => this.successMsg = '', 2000);
            },
            error: (err: any) => {
                opp.status = originalStatus;
                this.errorMsg = 'Error al actualizar estado';
            }
        });
    }

    convertToClient(opp: any): void {
        if (!confirm('¿Desea convertir este prospecto en Cliente oficial? Se creará el registro automáticamente.')) return;

        this.crmService.convertOpportunityToClient(opp.id).subscribe({
            next: () => {
                this.successMsg = '¡Cliente creado exitosamente!';
                this.loadOpportunities();
            },
            error: (err: any) => this.errorMsg = 'Error al convertir a cliente'
        });
    }

    openCommModal(opp: any): void {
        this.selectedOpportunity = opp;
        this.showCommModal = true;
    }

    exportExcel(): void {
        this.exportService.exportToExcel('/reportes/opportunities', {}, 'lista_oportunidades.xlsx');
    }

    selectedOpportunity: any = null;
}
