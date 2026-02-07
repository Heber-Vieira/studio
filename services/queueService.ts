
import { SupabaseClient } from '@supabase/supabase-js';
import { WaitingListEntry, Client, Service, SalonSettings } from '../types';
import { db } from './database';
import { supabase } from './supabase';

/**
 * QUEUE LOGIC:
 * 1. Calculate Priority Score based on Loyalty.
 * 2. Add to DB with score.
 * 3. On Cancellation (Trigger), fetch top 3 and notify.
 */

// --- 1. LOYALTY SCORE ALGORITHM ---
export const calculatePriorityScore = (client: Client, servicePrice: number, settings: SalonSettings): number => {
    let score = 0;

    // A. Spending Power (1 point per R$ 100 spent)
    const totalSpent = Number(client.totalSpent) || 0;
    score += Math.floor(totalSpent / 100);

    // B. Loyalty Points (Direct correlation)
    const loyaltyPoints = Number(client.loyaltyPoints) || 0;
    score += loyaltyPoints * 0.5;

    // C. Frequency
    const lastVisitDate = client.lastVisit ? new Date(client.lastVisit) : new Date();
    const now = new Date();
    const daysSinceLastVisit = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 3600 * 24));

    if (!isNaN(daysSinceLastVisit)) {
        if (daysSinceLastVisit < 30) score += 10;
        else if (daysSinceLastVisit < 90) score += 5;
    }

    // D. Ticket Value
    const price = Number(servicePrice) || 0;
    score += Math.floor(price / 50);

    return Math.floor(score) || 0;
};

// --- 2. BACKEND OPERATIONS (Simulating Server-Side Logic) ---

export const queueService = {

    /**
     * Entrar na fila de espera
     */
    async joinWaitingList(
        clientData: { name: string; phone: string; id?: string },
        service: Service,
        professionalId: string,
        professionalName: string,
        date: string,
        preferredTimes?: string[]
    ): Promise<WaitingListEntry> {

        // 1. Find or Create Client to get stats
        let client: Client | undefined;
        let clientId = clientData.id;

        if (clientId && clientId !== 'external') {
            const clients = await db.getClients();
            client = clients.find(c => c.id === clientId);
        } else {
            // Try to find by phone
            const clients = await db.getClients();
            client = clients.find(c => c.phone.replace(/\D/g, '') === clientData.phone.replace(/\D/g, ''));
            if (client) clientId = client.id;
        }

        // Default mock client if new (Score 0 baseline + Ticket Value)
        if (!client) {
            client = {
                id: 'temp',
                name: clientData.name,
                phone: clientData.phone,
                totalSpent: 0,
                loyaltyPoints: 0,
                lastVisit: new Date().toISOString(),
                tags: []
            };
        }

        // 2. Calculate Score
        const settings = await db.getSettings();
        const score = calculatePriorityScore(client, service.price, settings);

        // 3. Insert into DB
        const entry: Omit<WaitingListEntry, 'id' | 'position' | 'estimatedWaitTime'> = {
            clientId: (clientId && clientId !== 'temp' && clientId !== 'external') ? clientId : null,
            clientName: clientData.name,
            clientPhone: clientData.phone,
            serviceId: service.id,
            serviceName: service.name,
            professionalId: professionalId || null,
            professionalName: professionalName || null,
            preferredDate: date,
            preferredTimes: preferredTimes || [],
            status: 'active',
            priorityScore: score,
            createdAt: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('waiting_list')
            .insert([{
                company_id: '00000000-0000-0000-0000-000000000001',
                client_id: entry.clientId,
                client_name: entry.clientName,
                client_phone: entry.clientPhone,
                service_id: entry.serviceId,
                service_name: entry.serviceName,
                professional_id: entry.professionalId,
                professional_name: entry.professionalName,
                preferred_date: entry.preferredDate,
                preferred_times: entry.preferredTimes,
                priority_score: entry.priorityScore,
                status: 'active'
            }])
            .select()
            .single();

        if (error) {
            console.error("[QueueService] DB Insert Error:", error);
            // If it's a conflict or specific constraint, provide more info
            if (error.code === '23505') {
                throw new Error("Este cliente já está na fila de espera para este serviço nesta data.");
            }
            throw new Error(`Erro ao salvar na fila: ${error.message}`);
        }

        return this.mapEntry(data);
    },

    /**
     * Verificar posição e estimativa
     */
    async getStatus(entryId: string): Promise<WaitingListEntry | null> {
        const { data: entry, error } = await supabase
            .from('waiting_list')
            .select('*')
            .eq('id', entryId)
            .single();

        if (error || !entry) return null;

        // Calculate Position: Count how many active entries allow for the same slot with higher score
        const { count } = await supabase
            .from('waiting_list')
            .select('*', { count: 'exact', head: true })
            .eq('preferred_date', entry.preferred_date)
            .eq('professional_id', entry.professional_id)
            .eq('status', 'active')
            .gt('priority_score', entry.priority_score);

        const position = (count || 0) + 1;

        // Estimate: Simple heuristic (e.g., 20% cancellation rate, 2 days per person ahead)
        // In a real AI model, this would use historical cancellation rates.
        const estDays = Math.ceil(position * 0.5);
        const estimatedWaitTime = position === 1 ? 'Próximo da fila!' : `~${estDays} dias`;

        return {
            ...this.mapEntry(entry),
            position,
            estimatedWaitTime
        };
    },

    async checkWaitlistForCancellation(date: string, time: string, professionalId?: string): Promise<WaitingListEntry | null> {
        // Find best candidate (highest score) who has this time in their preferredTimes
        const { data, error } = await supabase
            .from('waiting_list')
            .select('*')
            .eq('preferred_date', date)
            .eq('status', 'active')
            .contains('preferred_times', [time])
            .order('priority_score', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) {
            // If no match by specific time, check if there's someone who didn't specify times (optional, but keep it simple for now as per multiple selection requirement)
            return null;
        }

        const entry = data[0];

        // If professionalId is specified, check if it matches OR if the entry didn't specify a professional
        if (professionalId && entry.professional_id && entry.professional_id !== professionalId) {
            return null;
        }

        return this.mapEntry(entry);
    },

    mapEntry(data: any): WaitingListEntry {
        return {
            id: data.id,
            clientId: data.client_id,
            clientName: data.client_name,
            clientPhone: data.client_phone,
            serviceId: data.service_id,
            serviceName: data.service_name,
            professionalId: data.professional_id,
            professionalName: data.professional_name,
            preferredDate: data.preferred_date,
            preferredTimes: data.preferred_times,
            status: data.status,
            priorityScore: data.priority_score,
            createdAt: data.created_at,
            notifiedAt: data.notified_at,
            expiresAt: data.expires_at
        };
    }
};
