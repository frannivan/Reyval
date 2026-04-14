import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MensajeService, Mensaje } from '../../services/mensaje';

@Component({
  selector: 'app-communication-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" *ngIf="show" (click)="close()">
      <div class="modal-content glass" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="target-info">
            <h3>Comunicación con: {{ targetName }}</h3>
            <span class="badge">{{ activeTab === 'WA' ? 'WhatsApp Business' : 'Correo Electrónico' }}</span>
          </div>
          <button class="close-btn" (click)="close()">&times;</button>
        </div>

        <div class="tabs">
          <button [class.active]="activeTab === 'WA'" (click)="activeTab = 'WA'">
            <i class="fab fa-whatsapp"></i> WhatsApp
          </button>
          <button [class.active]="activeTab === 'EMAIL'" (click)="activeTab = 'EMAIL'">
            <i class="fas fa-envelope"></i> Email
          </button>
        </div>

        <!-- WHATSAPP VIEW -->
        <div class="chat-container" *ngIf="activeTab === 'WA'">
          <div class="chat-history" #chatHistory>
            <div *ngFor="let msg of waHistory" [class]="'msg ' + (msg.direccion?.toLowerCase() || 'enviado')">
              <div class="bubble">
                {{ msg.contenido }}
                <span class="time">{{ msg.fecha | date:'HH:mm' }}</span>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <input type="text" [(ngModel)]="newWaMsg" placeholder="Escribe un mensaje de WhatsApp..." (keyup.enter)="sendWA()">
            <button class="send-btn" (click)="sendWA()"><i class="fas fa-paper-plane"></i></button>
          </div>
        </div>

        <!-- EMAIL VIEW -->
        <div class="email-form" *ngIf="activeTab === 'EMAIL'">
          <div class="form-group">
            <label>Asunto:</label>
            <input type="text" [(ngModel)]="emailSubject" placeholder="Ej: Cotización Lote {{ targetId }}">
          </div>
          <div class="form-group">
            <label>Mensaje:</label>
            <textarea [(ngModel)]="emailBody" rows="5" placeholder="Escribe el cuerpo del correo aquí..."></textarea>
          </div>
          <div class="email-actions">
            <button class="btn-outline" (click)="sendEmail(true)">
              <i class="fas fa-file-pdf"></i> Adjuntar Cotización
            </button>
            <button class="btn-primary" (click)="sendEmail(false)">
              <i class="fas fa-paper-plane"></i> Enviar Correo
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-content {
      width: 500px; max-width: 95%; background: #1a1a1e; border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.1); overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      padding: 1.5rem; display: flex; justify-content: space-between; align-items: center;
      background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .target-info h3 { margin: 0; font-size: 1.1rem; color: #fff; }
    .badge { font-size: 0.7rem; background: rgba(0,198,255,0.1); color: #00c6ff; padding: 2px 8px; border-radius: 10px; }
    .tabs { display: flex; background: rgba(0,0,0,0.2); }
    .tabs button {
      flex: 1; padding: 1rem; border: none; background: transparent; color: #888;
      cursor: pointer; transition: all 0.3s; border-bottom: 2px solid transparent;
    }
    .tabs button.active { color: #00c6ff; border-bottom-color: #00c6ff; background: rgba(255,255,255,0.02); }
    
    .chat-container { height: 400px; display: flex; flex-direction: column; }
    .chat-history { flex: 1; padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
    .msg { display: flex; }
    .msg.enviado { justify-content: flex-end; }
    .bubble {
      max-width: 80%; padding: 0.8rem 1rem; border-radius: 15px; position: relative;
      font-size: 0.9rem; line-height: 1.4;
    }
    .enviado .bubble { background: #0072ff; color: #fff; border-bottom-right-radius: 2px; }
    .recibido .bubble { background: #2a2a2e; color: #e0e0e0; border-bottom-left-radius: 2px; }
    .time { font-size: 0.65rem; opacity: 0.6; display: block; margin-top: 4px; text-align: right; }
    
    .chat-input { padding: 1rem; display: flex; gap: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
    .chat-input input { flex: 1; background: #000; border: 1px solid #333; color: #fff; padding: 0.8rem; border-radius: 10px; outline: none; }
    .send-btn { background: #00c6ff; border: none; color: #fff; width: 45px; height: 45px; border-radius: 10px; cursor: pointer; }

    .email-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.2rem; }
    .form-group label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 0.5rem; }
    .form-group input, .form-group textarea {
      width: 100%; background: #000; border: 1px solid #333; color: #fff; padding: 0.8rem; border-radius: 10px; outline: none;
    }
    .email-actions { display: flex; justify-content: space-between; margin-top: 1rem; }
    .btn-outline { background: transparent; border: 1px solid #444; color: #fff; padding: 0.8rem 1.2rem; border-radius: 10px; cursor: pointer; }
    .btn-primary { background: #0072ff; border: none; color: #fff; padding: 0.8rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; }
  `]
})
export class CommunicationModalComponent implements OnInit {
  @Input() show = false;
  @Input() targetId!: number;
  @Input() targetName!: string;
  @Output() onClose = new EventEmitter<void>();

  activeTab: 'WA' | 'EMAIL' = 'WA';
  waHistory: Mensaje[] = [];
  newWaMsg = '';
  
  emailSubject = '';
  emailBody = '';

  private msgService = inject(MensajeService);

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.msgService.getHistory(this.targetId).subscribe((history: Mensaje[]) => {
      this.waHistory = history.filter((m: Mensaje) => m.tipo === 'WA');
    });
  }

  close() {
    this.onClose.emit();
  }

  sendWA() {
    if (!this.newWaMsg.trim()) return;
    this.msgService.sendWhatsApp(this.targetId, this.newWaMsg).subscribe(() => {
      this.newWaMsg = '';
      this.loadHistory();
      // Auto-scroll simulation simplified here
    });
  }

  sendEmail(attachQuote: boolean) {
    if (!this.emailSubject || !this.emailBody) return;
    this.msgService.sendEmail(this.targetId, this.emailSubject, this.emailBody, attachQuote).subscribe(() => {
      alert(attachQuote ? '✅ Email enviado con cotización adjunta.' : '✅ Email enviado exitosamente.');
      this.emailSubject = '';
      this.emailBody = '';
      this.close();
    });
  }
}
