import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  // --- LEADS ---
  async getAllLeads() {
    return this.prisma.lead.findMany({
      include: { oportunidades: { include: { lote: true } } },
      orderBy: { fechaRegistro: 'desc' },
    });
  }

  async createLead(data: any) {
    return this.prisma.lead.create({ data });
  }

  async updateLead(id: number, data: any) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    return this.prisma.lead.update({ where: { id }, data });
  }

  async sendPriceList(leadId: number, fraccionamientoIds: number[]) {
    // In a real app we would query the fraccionamientos, generate PDF, and send email.
    // For now we just return a success message.
    return { message: 'Lista de precios enviada correctamente' };
  }

  async sendBudget(leadId: number, details: string) {
    // Similarly, we would send the details to the lead's email.
    return { message: 'Cotización enviada correctamente' };
  }

  async convertLeadToOpportunity(leadId: number, loteId: number) {
    const lead = await this.prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead no encontrado');

    await this.prisma.lead.update({ where: { id: leadId }, data: { status: 'CONTACTED' } });

    return this.prisma.opportunity.create({
      data: { leadId, loteId, status: 'OPEN' },
      include: { lead: true, lote: true },
    });
  }

  // --- OPPORTUNITIES ---
  async getAllOpportunities() {
    return this.prisma.opportunity.findMany({
      include: { lead: true, lote: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOpportunity(id: number, data: any) {
    const opp = await this.prisma.opportunity.findUnique({ where: { id } });
    if (!opp) throw new NotFoundException('Oportunidad no encontrada');
    return this.prisma.opportunity.update({ where: { id }, data: { status: data.status, notas: data.notas } });
  }

  async convertOpportunityToClient(id: number) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { id },
      include: { lead: true },
    });
    if (!opp) throw new NotFoundException('Oportunidad no encontrada');

    // Mark lead as converted
    await this.prisma.lead.update({ where: { id: opp.leadId }, data: { status: 'CONVERTED' } });
    await this.prisma.opportunity.update({ where: { id }, data: { status: 'WON' } });

    // Create a Cliente from the lead data
    return this.prisma.cliente.create({
      data: {
        nombre: opp.lead.nombre,
        email: opp.lead.email,
        telefono: opp.lead.telefono,
      },
    });
  }

  // --- INTERACTIONS (CRM FASE 2) ---
  async getInteractionsByLead(leadId: number) {
    return this.prisma.interaccion.findMany({
      where: { leadId },
      include: { vendedor: true },
      orderBy: { fecha: 'desc' },
    });
  }

  async getInteractionsByClient(clienteId: number) {
    return this.prisma.interaccion.findMany({
      where: { clienteId },
      include: { vendedor: true },
      orderBy: { fecha: 'desc' },
    });
  }

  async createInteraction(data: any) {
    return this.prisma.interaccion.create({ data });
  }
}
