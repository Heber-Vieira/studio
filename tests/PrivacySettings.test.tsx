import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsView from '../components/Settings';
import React from 'react';

// Mock DB
const mockGetMyConsents = vi.fn();
const mockRecordConsent = vi.fn();
const mockLogAction = vi.fn();
const mockAnonymizeUser = vi.fn();

// Mock console.error to avoid noise
console.error = vi.fn();

vi.mock('../services/database', () => ({
    db: {
        getMyConsents: () => mockGetMyConsents(),
        recordConsent: (...args: any[]) => mockRecordConsent(...args),
        logAction: (...args: any[]) => mockLogAction(...args),
        anonymizeUser: () => mockAnonymizeUser(),
        getProfiles: vi.fn().mockResolvedValue([]),
        updateProfile: vi.fn(),
        deleteProfile: vi.fn()
    }
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn();

describe('Privacy Settings', () => {
    const defaultProps = {
        t: {
            settings: { tabs: { general: 'Geral', plan: 'Plano', loyalty: 'Fidelidade', integrations: 'Integrações', ai: 'IA', financial: 'Financeiro' } },
            privacy: {
                title: 'Central de Privacidade',
                description: 'Desc',
                exportData: 'Exportar Dados',
                exportDesc: 'Desc',
                deleteAccount: 'Excluir Conta',
                deleteDesc: 'Desc',
                consents: 'Consentimentos',
                terms: 'Termos',
                termsDesc: 'Desc',
                marketing: 'Marketing',
                marketingDesc: 'Desc'
            }
        },
        lang: 'pt' as any,
        setLang: vi.fn(),
        settings: { name: 'Test Salon' } as any,
        onUpdate: vi.fn(),
        onExportData: vi.fn(),
        onImportData: vi.fn(),
        onShowToast: vi.fn(),
        onShowConfirm: vi.fn()
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockGetMyConsents.mockResolvedValue([]);
    });

    it('renders privacy tab and fetches consents', async () => {
        render(<SettingsView {...defaultProps} />);

        const tab = screen.getByText('Central de Privacidade');
        fireEvent.click(tab);

        await waitFor(() => {
            expect(mockGetMyConsents).toHaveBeenCalled();
            expect(screen.getByText('Marketing')).toBeInTheDocument();
        });
    });

    it('toggles marketing consent', async () => {
        mockGetMyConsents.mockResolvedValue([{ type: 'marketing', agreed: false }]);
        render(<SettingsView {...defaultProps} />);

        fireEvent.click(screen.getByText('Central de Privacidade'));

        await waitFor(() => screen.getByText('Marketing'));

        const checkboxes = screen.getAllByRole('checkbox');
        // Filter out hidden ones? Or assume visible.
        // Marketing toggle is likely the only checkbox in Privacy View.
        const marketingToggle = checkboxes[0];

        fireEvent.click(marketingToggle);

        await waitFor(() => {
            expect(mockRecordConsent).toHaveBeenCalledWith('marketing', true);
        });
    });

    it('handles export data', async () => {
        render(<SettingsView {...defaultProps} />);
        fireEvent.click(screen.getByText('Central de Privacidade'));

        const exportBtn = await screen.findByText('Exportar Dados');
        fireEvent.click(exportBtn);

        await waitFor(() => {
            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(mockLogAction).toHaveBeenCalledWith('export_data', 'all');
        });
    });

    it('handles delete account request', async () => {
        render(<SettingsView {...defaultProps} />);
        fireEvent.click(screen.getByText('Central de Privacidade'));

        const deleteBtn = await screen.findByText('Excluir Conta');
        fireEvent.click(deleteBtn);

        expect(defaultProps.onShowConfirm).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Excluir Conta',
            variant: 'danger'
        }));

        // Simulate confirm
        const confirmCall = (defaultProps.onShowConfirm as any).mock.calls[0][0];
        await confirmCall.onConfirm();

        expect(mockAnonymizeUser).toHaveBeenCalled();
    });
});
