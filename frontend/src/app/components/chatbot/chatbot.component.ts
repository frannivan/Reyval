import { Component, ElementRef, ViewChild, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CRMService } from '../../services/crm.service';

interface Message {
    text: string;
    sender: 'bot' | 'user';
    options?: string[];
}

@Component({
    selector: 'app-chatbot',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chatbot.component.html',
    styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements AfterViewChecked {
    @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

    isOpen = false;
    currentInput = '';
    step: 'NAME' | 'MENU' | 'SUBMENU' | 'CONTACT_METHOD' | 'PHONE' | 'EMAIL' | 'END' = 'NAME';

    messages: Message[] = [
        { text: '👋 ¡Hola! Bienvenido a Reyval. ¿Con quién tengo el gusto?', sender: 'bot' }
    ];

    leadData: any = {
        nombre: '',
        mensaje: 'Inició conversación por Chatbot',
        source: 'CHATBOT'
    };

    private crmService = inject(CRMService);
    private router = inject(Router);

    constructor() { }

    get isHidden(): boolean {
        const url = this.router.url;
        return url.includes('/admin') || url.includes('/login') || url.includes('/register');
    }

    ngAfterViewChecked() {
        this.scrollToBottom();
    }

    private scrollToBottom(): void {
        if (this.scrollContainer) {
            try {
                this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
            } catch (err) { }
        }
    }

    toggle() {
        this.isOpen = !this.isOpen;
    }

    sendMessage(text: string = this.currentInput) {
        if (!text.trim()) return;
        this.messages.push({ text: text, sender: 'user' });
        this.currentInput = '';
        setTimeout(() => this.processResponse(text), 600);
    }

    processResponse(input: string) {
        switch (this.step) {
            case 'NAME':
                this.leadData.nombre = input;
                this.messages.push({
                    text: `¡Mucho gusto, ${input}! Cuéntame, ¿en qué podemos apoyarte hoy?`,
                    sender: 'bot',
                    options: ['Comprar un Lote', 'Vender un Terreno', 'Información de Fraccionamientos', 'Hablar con un Asesor']
                });
                this.step = 'MENU';
                break;
            case 'MENU':
                this.handleMenuSelection(input);
                break;
            case 'CONTACT_METHOD':
                if (input.includes('WhatsApp')) {
                    this.messages.push({ text: 'Excelente. Por favor, escribe tu número de WhatsApp para contactarte:', sender: 'bot' });
                    this.step = 'PHONE';
                } else {
                    this.messages.push({ text: 'Perfecto. Por favor, escribe tu correo electrónico:', sender: 'bot' });
                    this.step = 'EMAIL';
                }
                break;
            case 'PHONE':
            case 'EMAIL':
                if (this.step === 'PHONE') this.leadData.telefono = input;
                else this.leadData.email = input;
                this.saveLead();
                this.messages.push({ text: '¡Todo listo! Uno de nuestros asesores se pondrá en contacto contigo a la brevedad. ¡Que tengas un excelente día! 🏡✨', sender: 'bot' });
                this.step = 'END';
                break;
        }
    }

    handleMenuSelection(option: string) {
        this.leadData.mensaje += ' | Interés: ' + option;
        let responseText = '';

        if (option.includes('Comprar')) {
            responseText = 'Tenemos excelentes opciones de inversión. ¿Cómo prefieres que nos comuniquemos contigo?';
            this.leadData.interes = 'COTIZACION';
            this.step = 'CONTACT_METHOD';
        } else if (option.includes('Vender')) {
            responseText = 'Claro, podemos ayudarte a promover tu terreno. ¿Cómo prefieres que te contactemos?';
            this.leadData.interes = 'VENDER';
            this.step = 'CONTACT_METHOD';
        } else if (option.includes('Información')) {
            responseText = 'Nuestros fraccionamientos cuentan con todos los servicios. ¿Te gustaría que un asesor te envíe los folletos digitales?';
            this.leadData.interes = 'COTIZACION';
            this.step = 'CONTACT_METHOD';
        } else {
            this.leadData.interes = 'REPRESENTANTE';
            this.step = 'CONTACT_METHOD';
            responseText = 'Entendido. ¿Prefieres contacto por WhatsApp o Correo?';
        }

        const contactOptions = ['WhatsApp', 'Correo Electrónico'];

        this.messages.push({
            text: responseText,
            sender: 'bot',
            options: this.step === 'CONTACT_METHOD' ? contactOptions : undefined
        });
    }

    saveLead() {
        if (!this.leadData.email) this.leadData.email = 'sin@correo.com';
        if (!this.leadData.telefono) this.leadData.telefono = '0000000000';

        this.crmService.createLead(this.leadData).subscribe({
            next: (res: any) => console.log('Lead creado via Chatbot', res),
            error: (err: any) => {
                console.error('Error saving lead:', err);
            }
        });
    }

    selectOption(option: string) {
        this.sendMessage(option);
    }
}
