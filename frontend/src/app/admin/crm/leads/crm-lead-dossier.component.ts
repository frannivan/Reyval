import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CRMService } from '../../../services/crm.service';

@Component({
  selector: 'app-crm-lead-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './crm-lead-dossier.component.html',
  styleUrls: ['./crm-lead-dossier.component.css']
})
export class CrmLeadDossierComponent implements OnInit {
  @Input() lead: any;
  @Output() onClose = new EventEmitter<void>();
  @Output() onAction = new EventEmitter<{type: string, payload?: any}>();

  interacciones: any[] = [];
  nuevaInteraccion = {
    tipo: 'NOTA',
    notas: ''
  };

  constructor(private crmService: CRMService) {}

  ngOnInit() {
    if (this.lead && this.lead.id) {
      this.cargarInteracciones();
    }
  }

  cargarInteracciones() {
    this.crmService.getLeadInteractions(this.lead.id).subscribe({
      next: (res: any) => this.interacciones = res,
      error: (err: any) => console.error('Error cargando interacciones', err)
    });
  }

  agregarInteraccion() {
    if (!this.nuevaInteraccion.notas.trim()) return;

    const payload = {
      leadId: this.lead.id,
      tipo: this.nuevaInteraccion.tipo,
      notas: this.nuevaInteraccion.notas
    };

    this.crmService.createInteraction(payload).subscribe({
      next: (res: any) => {
        this.interacciones.unshift(res); // Añadir arriba
        this.nuevaInteraccion.notas = ''; // Limpiar textarea
      },
      error: (err: any) => console.error('Error creando interacción', err)
    });
  }

  statuses = [
    { key: 'NEW', label: 'Nuevo' },
    { key: 'CONTACTED', label: 'Contactado' },
    { key: 'PRICE_LIST_SENT', label: 'Lista de Precios' },
    { key: 'BUDGET_SENT', label: 'Presupuesto' },
    { key: 'QUALIFIED', label: 'Calificado' }
  ];

  getStatusIndex(currentStatus: string): number {
    return this.statuses.findIndex(s => s.key === currentStatus);
  }

  isCompleted(statusKey: string): boolean {
    const currentIndex = this.getStatusIndex(this.lead?.status);
    const statusIndex = this.statuses.findIndex(s => s.key === statusKey);
    return statusIndex < currentIndex;
  }

  isActive(statusKey: string): boolean {
    return this.lead?.status === statusKey;
  }

  emitAction(type: string, payload?: any) {
    this.onAction.emit({ type, payload });
  }

  close() {
    this.onClose.emit();
  }
}
