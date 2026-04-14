import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CrmMensajeService, CrmMensaje } from './crm-mensaje.service';

/**
 * Componente reutilizable de comunicación CRM.
 * Modal premium con pestañas de WhatsApp y Email.
 *
 * @example
 * <crm-communication-modal
 *   [show]="true"
 *   [targetId]="lead.id"
 *   [targetName]="lead.nombre"
 *   (onClose)="cerrarModal()">
 * </crm-communication-modal>
 */
@Component({
  selector: 'crm-communication-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="crm-modal-backdrop" *ngIf="show" (click)="close()">
      <div class="crm-modal-content" (click)="$event.stopPropagation()">
        <div class="crm-modal-header">
          <div class="crm-target-info">
            <h3>Comunicación con: {{ targetName }}</h3>
            <span class="crm-badge">{{ activeTab === 'WA' ? 'WhatsApp Business' : 'Correo Electrónico' }}</span>
          </div>
          <button class="crm-close-btn" (click)="close()">&times;</button>
        </div>

        <div class="crm-tabs">
          <button [class.active]="activeTab === 'WA'" (click)="switchTab('WA')">
            <i class="fab fa-whatsapp"></i> WhatsApp
          </button>
          <button [class.active]="activeTab === 'EMAIL'" (click)="switchTab('EMAIL')">
            <i class="fas fa-envelope"></i> Email
          </button>
        </div>

        <!-- WHATSAPP VIEW -->
        <div class="crm-chat-container" *ngIf="activeTab === 'WA'">
          <div class="crm-chat-history">
            <div *ngFor="let msg of waHistory" [class]="'crm-msg ' + (msg.direccion?.toLowerCase() || 'enviado')">
              <div class="crm-bubble">
                {{ msg.contenido }}
                <span class="crm-time">{{ msg.fecha | date:'HH:mm' }}</span>
              </div>
            </div>
            <div *ngIf="waHistory.length === 0" class="crm-empty-state">
              <i class="fab fa-whatsapp"></i>
              <p>No hay mensajes aún. ¡Envía el primero!</p>
            </div>
          </div>
          <div class="crm-chat-input">
            <input type="text" [(ngModel)]="newWaMsg" placeholder="Escribe un mensaje de WhatsApp..." (keyup.enter)="sendWA()">
            <button class="crm-send-btn" (click)="sendWA()" [disabled]="!newWaMsg.trim()">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>

        <!-- EMAIL VIEW -->
        <div class="crm-email-form" *ngIf="activeTab === 'EMAIL'">
          <div class="crm-form-group">
            <label>Asunto:</label>
            <input type="text" [(ngModel)]="emailSubject" placeholder="Ej: Cotización Lote">
          </div>
          <div class="crm-form-group">
            <label>Mensaje:</label>
            <textarea [(ngModel)]="emailBody" rows="5" placeholder="Escribe el cuerpo del correo aquí..."></textarea>
          </div>
          <div class="crm-email-actions">
            <button class="crm-btn-outline" (click)="sendEmail(true)">
              <i class="fas fa-file-pdf"></i> Adjuntar Cotización
            </button>
            <button class="crm-btn-primary" (click)="sendEmail(false)">
              <i class="fas fa-paper-plane"></i> Enviar Correo
            </button>
          </div>
          <!-- Email History -->
          <div *ngIf="emailHistory.length > 0" class="crm-email-history">
            <h4>Correos enviados:</h4>
            <div *ngFor="let msg of emailHistory" class="crm-email-item">
              <span class="crm-email-date">{{ msg.fecha | date:'dd/MM HH:mm' }}</span>
              <span class="crm-email-preview">{{ msg.contenido | slice:0:80 }}...</span>
              <span *ngIf="msg.adjunto" class="crm-email-attachment">📎 {{ msg.adjunto }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .crm-modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;
      animation: crmFadeIn 0.2s ease-out;
    }
    @keyframes crmFadeIn { from { opacity: 0; } to { opacity: 1; } }
    
    .crm-modal-content {
      width: 520px; max-width: 95%; background: #1a1a1e; border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.1); overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: crmSlideUp 0.3s ease-out;
    }
    @keyframes crmSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    
    .crm-modal-header {
      padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .crm-target-info h3 { margin: 0; font-size: 1.1rem; color: #fff; }
    .crm-badge { font-size: 0.7rem; background: rgba(0,198,255,0.1); color: #00c6ff; padding: 2px 8px; border-radius: 10px; }
    .crm-close-btn { background: none; border: none; color: #888; font-size: 1.5rem; cursor: pointer; transition: color 0.2s; }
    .crm-close-btn:hover { color: #fff; }
    
    .crm-tabs { display: flex; background: rgba(0,0,0,0.2); }
    .crm-tabs button {
      flex: 1; padding: 1rem; border: none; background: transparent; color: #888;
      cursor: pointer; transition: all 0.3s; border-bottom: 2px solid transparent; font-size: 0.9rem;
    }
    .crm-tabs button.active { color: #00c6ff; border-bottom-color: #00c6ff; background: rgba(255,255,255,0.02); }
    .crm-tabs button:hover:not(.active) { color: #bbb; }
    
    .crm-chat-container { height: 420px; display: flex; flex-direction: column; }
    .crm-chat-history { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
    .crm-msg { display: flex; }
    .crm-msg.enviado { justify-content: flex-end; }
    .crm-bubble {
      max-width: 80%; padding: 0.8rem 1rem; border-radius: 15px; position: relative;
      font-size: 0.9rem; line-height: 1.4;
    }
    .crm-msg.enviado .crm-bubble { background: linear-gradient(135deg, #0072ff, #00c6ff); color: #fff; border-bottom-right-radius: 2px; }
    .crm-msg.recibido .crm-bubble { background: #2a2a2e; color: #e0e0e0; border-bottom-left-radius: 2px; }
    .crm-time { font-size: 0.65rem; opacity: 0.6; display: block; margin-top: 4px; text-align: right; }
    
    .crm-empty-state { text-align: center; padding: 3rem 1rem; color: #555; }
    .crm-empty-state i { font-size: 3rem; margin-bottom: 1rem; display: block; }
    
    .crm-chat-input { padding: 1rem; display: flex; gap: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
    .crm-chat-input input { flex: 1; background: #000; border: 1px solid #333; color: #fff; padding: 0.8rem; border-radius: 10px; outline: none; transition: border-color 0.2s; }
    .crm-chat-input input:focus { border-color: #00c6ff; }
    .crm-send-btn { background: linear-gradient(135deg, #0072ff, #00c6ff); border: none; color: #fff; width: 45px; height: 45px; border-radius: 10px; cursor: pointer; transition: transform 0.15s; }
    .crm-send-btn:hover { transform: scale(1.05); }
    .crm-send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

    .crm-email-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.2rem; }
    .crm-form-group label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 0.5rem; }
    .crm-form-group input, .crm-form-group textarea {
      width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 0.8rem; border-radius: 10px; outline: none; transition: border-color 0.2s; box-sizing: border-box;
    }
    .crm-form-group input:focus, .crm-form-group textarea:focus { border-color: #00c6ff; }
    .crm-email-actions { display: flex; justify-content: space-between; margin-top: 0.5rem; }
    .crm-btn-outline { background: transparent; border: 1px solid #444; color: #fff; padding: 0.8rem 1.2rem; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .crm-btn-outline:hover { border-color: #00c6ff; color: #00c6ff; }
    .crm-btn-primary { background: linear-gradient(135deg, #0072ff, #00c6ff); border: none; color: #fff; padding: 0.8rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; transition: transform 0.15s; }
    .crm-btn-primary:hover { transform: scale(1.02); }
    
    .crm-email-history { margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem; }
    .crm-email-history h4 { font-size: 0.8rem; color: #888; margin-bottom: 0.8rem; }
    .crm-email-item { display: flex; gap: 0.8rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.8rem; color: #aaa; }
    .crm-email-date { color: #00c6ff; min-width: 80px; }
    .crm-email-attachment { color: #ffbd2e; }
  `]
})
export class CrmCommunicationModalComponent implements OnInit {
  @Input() show = false;
  @Input() targetId!: number;
  @Input() targetName = '';
  @Output() onClose = new EventEmitter<void>();

  activeTab: 'WA' | 'EMAIL' = 'WA';
  waHistory: CrmMensaje[] = [];
  emailHistory: CrmMensaje[] = [];
  newWaMsg = '';
  emailSubject = '';
  emailBody = '';

  private msgService = inject(CrmMensajeService);

  ngOnInit(): void {
    this.loadHistory();
  }

  switchTab(tab: 'WA' | 'EMAIL'): void {
    this.activeTab = tab;
    this.loadHistory();
  }

  loadHistory(): void {
    this.msgService.getHistory(this.targetId).subscribe((history: CrmMensaje[]) => {
      this.waHistory = history.filter((m: CrmMensaje) => m.tipo === 'WA');
      this.emailHistory = history.filter((m: CrmMensaje) => m.tipo === 'EMAIL');
    });
  }

  close(): void {
    this.onClose.emit();
  }

  sendWA(): void {
    if (!this.newWaMsg.trim()) return;
    this.msgService.sendWhatsApp(this.targetId, this.newWaMsg).subscribe(() => {
      this.newWaMsg = '';
      this.loadHistory();
    });
  }

  sendEmail(attachQuote: boolean): void {
    if (!this.emailSubject || !this.emailBody) return;
    this.msgService.sendEmail(this.targetId, this.emailSubject, this.emailBody, attachQuote).subscribe(() => {
      this.emailSubject = '';
      this.emailBody = '';
      this.loadHistory();
      this.switchTab('EMAIL');
    });
  }
}
