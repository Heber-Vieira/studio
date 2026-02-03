import { supabase } from './supabase';
import { Client, Appointment, Professional, Service, Category, InventoryItem, Transaction, BlockedPeriod, SalonSettings, Supplier } from '../types';

const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export const db = {
    // --- STORAGE ---
    async uploadFile(bucket: string, path: string, file: File) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, { cacheControl: '3600', upsert: true });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);

        return publicUrl;
    },

    // --- SETTINGS / COMPANY ---
    async getSettings() {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('id', DEFAULT_COMPANY_ID)
            .single();

        if (error) throw error;
        return {
            name: data.name,
            address: data.address,
            phone: data.phone,
            aiTone: data.ai_tone,
            autoReminders: data.auto_reminders,
            pixKey: data.pix_key,
            commissionDefault: data.commission_default,
            taxRate: data.tax_rate,
            monthlyGoal: data.monthly_goal,
            instagram: data.instagram,
            logo: data.logo_url,
            theme: data.theme,
            permissions: data.permissions,
            loyalty: data.loyalty_config
        } as SalonSettings;
    },

    async updateSettings(settings: SalonSettings) {
        const { error } = await supabase
            .from('companies')
            .update({
                name: settings.name,
                address: settings.address,
                phone: settings.phone,
                ai_tone: settings.aiTone,
                auto_reminders: settings.autoReminders,
                pix_key: settings.pixKey,
                commission_default: settings.commissionDefault,
                tax_rate: settings.taxRate,
                monthly_goal: settings.monthlyGoal,
                instagram: settings.instagram,
                logo_url: settings.logo,
                theme: settings.theme,
                permissions: settings.permissions,
                loyalty_config: settings.loyalty
            })
            .eq('id', DEFAULT_COMPANY_ID);

        if (error) throw error;
    },

    // --- CLIENTS ---
    async getClients() {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('company_id', DEFAULT_COMPANY_ID);

        if (error) throw error;
        return data.map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
            lastVisit: c.last_visit,
            totalSpent: Number(c.total_spent) || 0,
            loyaltyPoints: Number(c.loyalty_points) || 0,
            tags: c.tags || []
        } as Client));
    },

    async addClient(client: Omit<Client, 'id'>) {
        const { data, error } = await supabase
            .from('clients')
            .insert([{
                company_id: DEFAULT_COMPANY_ID,
                name: client.name,
                phone: client.phone,
                last_visit: client.lastVisit,
                total_spent: client.totalSpent,
                loyalty_points: client.loyaltyPoints,
                tags: client.tags
            }])
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            phone: data.phone,
            lastVisit: data.last_visit,
            totalSpent: Number(data.total_spent),
            loyaltyPoints: data.loyalty_points,
            tags: data.tags || []
        } as Client;
    },

    async updateClient(client: Client) {
        const { error } = await supabase
            .from('clients')
            .update({
                name: client.name,
                phone: client.phone,
                tags: client.tags,
                loyalty_points: client.loyaltyPoints,
                total_spent: client.totalSpent
            })
            .eq('id', client.id);
        if (error) throw error;
    },

    async deleteClient(id: string) {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
    },

    // --- PROFESSIONALS ---
    async getProfessionals() {
        const { data, error } = await supabase
            .from('professionals')
            .select('*')
            .eq('company_id', DEFAULT_COMPANY_ID);

        if (error) throw error;
        return data.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            specialties: p.specialties || [],
            services: p.services || [],
            commissionRate: Number(p.commission_rate) || 0,
            avatar: p.avatar_url,
            rating: Number(p.rating) || 0,
            revenueGenerated: Number(p.revenue_generated) || 0,
            appointmentsCount: Number(p.appointments_count) || 0,
            schedule: p.schedule
        } as Professional));
    },

    async addProfessional(pro: Omit<Professional, 'id'>) {
        const { data, error } = await supabase
            .from('professionals')
            .insert([{
                company_id: DEFAULT_COMPANY_ID,
                name: pro.name,
                role: pro.role,
                specialties: pro.specialties,
                services: pro.services,
                commission_rate: pro.commissionRate,
                avatar_url: pro.avatar,
                schedule: pro.schedule
            }])
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            role: data.role,
            specialties: data.specialties || [],
            services: data.services || [],
            commissionRate: Number(data.commission_rate) || 0,
            avatar: data.avatar_url,
            rating: Number(data.rating) || 0,
            revenueGenerated: Number(data.revenue_generated) || 0,
            appointmentsCount: Number(data.appointments_count) || 0,
            schedule: data.schedule
        } as Professional;
    },

    async updateProfessional(pro: Professional) {
        const { error } = await supabase
            .from('professionals')
            .update({
                name: pro.name,
                role: pro.role,
                specialties: pro.specialties,
                services: pro.services,
                commission_rate: pro.commissionRate,
                avatar_url: pro.avatar,
                schedule: pro.schedule
            })
            .eq('id', pro.id);
        if (error) throw error;
    },

    async deleteProfessional(id: string) {
        const { error } = await supabase.from('professionals').delete().eq('id', id);
        if (error) throw error;
    },

    // --- APPOINTMENTS ---
    async getAppointments() {
        const { data, error } = await supabase
            .from('appointments')
            .select('*, clients(name)')
            .eq('company_id', DEFAULT_COMPANY_ID);

        if (error) throw error;
        return data.map(a => ({
            id: a.id,
            clientId: a.client_id,
            clientName: a.clients?.name || 'Cliente Desconhecido',
            service: a.service_id,
            date: a.appointment_date,
            time: a.appointment_time,
            status: a.status,
            price: Number(a.price) || 0,
            professionalId: a.professional_id
        } as Appointment));
    },

    async addAppointment(apt: Omit<Appointment, 'id'>) {
        const { data, error } = await supabase
            .from('appointments')
            .insert([{
                company_id: DEFAULT_COMPANY_ID,
                client_id: apt.clientId,
                professional_id: apt.professionalId,
                service_id: apt.service, // Assumes this is an ID now
                appointment_date: apt.date,
                appointment_time: apt.time,
                status: apt.status,
                price: apt.price
            }])
            .select()
            .single();
        if (error) throw error;
        return data as Appointment;
    },

    async updateAppointment(apt: Appointment) {
        const { error } = await supabase
            .from('appointments')
            .update({
                status: apt.status,
                appointment_date: apt.date,
                appointment_time: apt.time,
                price: apt.price,
                service_id: apt.service // Make sure this is consistent with how it's saved
            })
            .eq('id', apt.id);
        if (error) throw error;
    },

    async deleteAppointment(id: string) {
        const { error } = await supabase.from('appointments').delete().eq('id', id);
        if (error) throw error;
    },

    // --- TRANSACTIONS ---
    async getTransactions() {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('company_id', DEFAULT_COMPANY_ID)
            .order('transaction_date', { ascending: false });

        if (error) throw error;
        return data.map(t => ({
            id: t.id,
            type: t.type,
            title: t.title,
            client: t.client_name,
            amount: Number(t.amount) || 0,
            method: t.method,
            date: t.transaction_date,
            professionalId: t.professional_id
        } as Transaction));
    },

    async addTransaction(t: Omit<Transaction, 'id'>) {
        const { data, error } = await supabase
            .from('transactions')
            .insert([{
                company_id: DEFAULT_COMPANY_ID,
                type: t.type,
                title: t.title,
                client_name: t.client,
                amount: t.amount,
                method: t.method,
                transaction_date: t.date,
                professional_id: t.professionalId
            }])
            .select()
            .single();
        if (error) throw error;
        return data as Transaction;
    },

    async deleteTransaction(id: string) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
    },

    // --- INVENTORY ---
    async getInventoryItems() {
        const { data, error } = await supabase
            .from('inventory_items')
            .select('*, inventory_categories(label)')
            .eq('company_id', DEFAULT_COMPANY_ID);

        if (error) throw error;
        return data.map(i => ({
            id: i.id,
            name: i.name,
            type: i.type,
            category: i.inventory_categories?.label || 'Sem Categoria',
            quantity: Number(i.quantity) || 0,
            unit: i.unit,
            minLevel: Number(i.min_level) || 0,
            costPrice: Number(i.cost_price) || 0,
            salePrice: i.sale_price ? Number(i.sale_price) : undefined,
            supplier: i.supplier,
            lastRestock: i.last_restock
        } as InventoryItem));
    },

    async addInventoryItem(item: Omit<InventoryItem, 'id'>) {
        // Resolve category ID
        const { data: catData } = await supabase
            .from('inventory_categories')
            .select('id')
            .eq('label', item.category)
            .single();

        const { data, error } = await supabase
            .from('inventory_items')
            .insert([{
                company_id: DEFAULT_COMPANY_ID,
                category_id: catData?.id,
                name: item.name,
                type: item.type,
                quantity: item.quantity,
                unit: item.unit,
                min_level: item.minLevel,
                cost_price: item.costPrice,
                sale_price: item.salePrice,
                supplier: item.supplier
            }])
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            type: data.type,
            category: item.category, // Use the input label as we just saved it
            quantity: Number(data.quantity) || 0,
            unit: data.unit,
            minLevel: Number(data.min_level) || 0,
            costPrice: Number(data.cost_price) || 0,
            salePrice: data.sale_price ? Number(data.sale_price) : undefined,
            supplier: data.supplier
        } as InventoryItem;
    },

    async updateInventoryItem(item: InventoryItem) {
        const { data: catData } = await supabase
            .from('inventory_categories')
            .select('id')
            .eq('label', item.category)
            .single();

        const { error } = await supabase
            .from('inventory_items')
            .update({
                category_id: catData?.id,
                name: item.name,
                type: item.type,
                quantity: item.quantity,
                unit: item.unit,
                min_level: item.minLevel,
                cost_price: item.costPrice,
                sale_price: item.salePrice,
                supplier: item.supplier
            })
            .eq('id', item.id);
        if (error) throw error;
    },

    async deleteInventoryItem(id: string) {
        const { error } = await supabase.from('inventory_items').delete().eq('id', id);
        if (error) throw error;
    },

    async getInventoryCategories() {
        const { data, error } = await supabase
            .from('inventory_categories')
            .select('*')
            .eq('company_id', DEFAULT_COMPANY_ID);

        if (error) throw error;
        return data.map(c => ({
            id: c.id,
            label: c.label,
            iconName: c.icon_name
        } as Category));
    },

    async addInventoryCategory(cat: Omit<Category, 'id'>) {
        const { data, error } = await supabase
            .from('inventory_categories')
            .insert([{ company_id: DEFAULT_COMPANY_ID, label: cat.label, icon_name: cat.iconName }])
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            label: data.label,
            iconName: data.icon_name
        } as Category;
    },

    async deleteInventoryCategory(id: string) {
        const { error } = await supabase.from('inventory_categories').delete().eq('id', id);
        if (error) throw error;
    },

    // --- SUPPLIERS ---
    async getSuppliers() {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .eq('company_id', DEFAULT_COMPANY_ID);
        if (error) throw error;
        return (data || []).map(s => ({
            id: s.id,
            name: s.name,
            contactName: s.contact_name,
            phone: s.phone,
            email: s.email,
            category: s.category,
            notes: s.notes
        } as Supplier));
    },

    async addSupplier(s: Omit<Supplier, 'id'>) {
        const { data, error } = await supabase
            .from('suppliers')
            .insert([{
                company_id: DEFAULT_COMPANY_ID,
                name: s.name,
                contact_name: s.contactName,
                phone: s.phone,
                email: s.email,
                category: s.category,
                notes: s.notes
            }])
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            contactName: data.contact_name,
            phone: data.phone,
            email: data.email,
            category: data.category,
            notes: data.notes
        } as Supplier;
    },

    async updateSupplier(s: Supplier) {
        const { error } = await supabase
            .from('suppliers')
            .update({
                name: s.name,
                contact_name: s.contactName,
                phone: s.phone,
                email: s.email,
                category: s.category,
                notes: s.notes
            })
            .eq('id', s.id);
        if (error) throw error;
    },

    async deleteSupplier(id: string) {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (error) throw error;
    }
};
