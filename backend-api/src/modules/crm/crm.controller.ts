import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { CrmService } from './crm.service';

@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // LEADS - Match exact Java paths at /api/crm/*
  @Get('leads')
  getAllLeads() {
    return this.crmService.getAllLeads();
  }

  @Post('leads')
  createLead(@Body() body: any) {
    return this.crmService.createLead(body);
  }

  @Put('leads/:id')
  updateLead(@Param('id') id: string, @Body() body: any) {
    return this.crmService.updateLead(parseInt(id), body);
  }

  @Post('leads/:id/send-price-list')
  sendPriceList(@Param('id') id: string, @Body() body: number[]) {
    return this.crmService.sendPriceList(parseInt(id), body);
  }

  @Post('leads/:id/send-budget')
  sendBudget(@Param('id') id: string, @Body() body: { details: string }) {
    return this.crmService.sendBudget(parseInt(id), body.details);
  }

  @Post('leads/:id/convert')
  convertLead(@Param('id') id: string, @Query('loteId') loteId: string) {
    return this.crmService.convertLeadToOpportunity(parseInt(id), parseInt(loteId));
  }

  // OPPORTUNITIES
  @Get('opportunities')
  getAllOpportunities() {
    return this.crmService.getAllOpportunities();
  }

  @Put('opportunities/:id')
  updateOpportunity(@Param('id') id: string, @Body() body: any) {
    return this.crmService.updateOpportunity(parseInt(id), body);
  }

  @Post('opportunities/:id/convert')
  convertOpportunity(@Param('id') id: string) {
    return this.crmService.convertOpportunityToClient(parseInt(id));
  }

  // --- INTERACTIONS (CRM FASE 2) ---
  @Get('leads/:id/interactions')
  getLeadInteractions(@Param('id') id: string) {
    return this.crmService.getInteractionsByLead(parseInt(id));
  }

  @Get('clientes/:id/interactions')
  getClientInteractions(@Param('id') id: string) {
    return this.crmService.getInteractionsByClient(parseInt(id));
  }

  @Post('interactions')
  createInteraction(@Body() body: any) {
    return this.crmService.createInteraction(body);
  }
}
