
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
    score += Math.floor(client.totalSpent / 100);

    // B. Loyalty Points (Direct correlation)
    score += (client.loyaltyPoints || 0) * 0.5;

    // C. Frequency (Visits in last 90 days - Simulated by existing data or Recency)
    // Here we use Recency: Fresh clients get a small boost to hook them, Loyal gets more.
    const lastVisit = new Date(client.lastVisit);
    const now = new Date();
    const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24));

    if (daysSinceLastVisit < 30) score += 10; // Active this month
    else if (daysSinceLastVisit < 90) score += 5;

    // D. Ticket Value (Higher value service = Higher priority to fill)
    score += Math.floor(servicePrice / 50);

    return Math.floor(score);
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
        date: string
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
            clientId: clientId || 'external',
            clientName: clientData.name,
            clientPhone: clientData.phone,
            serviceId: service.id,
            serviceName: service.name,
            professionalId,
            professionalName,
            preferredDate: date,
            status: 'active',
            priorityScore: score,
            createdAt: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('waiting_list')
            .insert([{
                company_id: '00000000-0000-0000-0000-000000000001', // Default ID from database.ts
                client_id: entry.clientId,
                client_name: entry.clientName,
                client_phone: entry.clientPhone,
                service_id: entry.serviceId,
                service_name: entry.serviceName,
                professional_id: entry.professionalId,
                professional_name: entry.professionalName,
                preferred_date: entry.preferredDate,
                priority_score: entry.priorityScore,
                status: 'active'
            }])
            .select()
            .single();

        if (error) {
            console.error("Error joining waiting list:", error);
            throw error;
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
            status: data.status,
            priorityScore: data.priority_score,
            createdAt: data.created_at,
            notifiedAt: data.notified_at,
            expiresAt: data.expires_at
        };
    }
};
