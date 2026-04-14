import { InjectionToken } from '@angular/core';

/**
 * Configuration interface for the CRM Communication Library.
 * Each consuming project provides its own API base URL.
 */
export interface CrmCommunicationConfig {
  /** Base URL of the backend API (e.g., 'http://localhost:8080/api') */
  apiUrl: string;
}

/**
 * Injection token used to provide configuration to the CRM Communication Library.
 * 
 * @example
 * // In your app's providers:
 * providers: [
 *   { provide: CRM_COMMUNICATION_CONFIG, useValue: { apiUrl: 'http://localhost:8080/api' } }
 * ]
 */
export const CRM_COMMUNICATION_CONFIG = new InjectionToken<CrmCommunicationConfig>('CRM_COMMUNICATION_CONFIG');
