/*
 * CRM Communication Library
 * Componente reutilizable de comunicación WA/Email para CRM.
 * 
 * Usage:
 *   1. Add provider in your app config:
 *      { provide: CRM_COMMUNICATION_CONFIG, useValue: { apiUrl: environment.apiUrl } }
 *   2. Import and use the component:
 *      <crm-communication-modal [show]="true" [targetId]="1" [targetName]="'John'" (onClose)="close()">
 */

export { CRM_COMMUNICATION_CONFIG } from './lib/crm-communication.config';
export type { CrmCommunicationConfig } from './lib/crm-communication.config';
export { CrmMensajeService } from './lib/crm-mensaje.service';
export type { CrmMensaje } from './lib/crm-mensaje.service';
export { CrmCommunicationModalComponent } from './lib/crm-communication-modal.component';
