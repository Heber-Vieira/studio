import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../components/Login';
import { AuthProvider } from '../contexts/AuthContext';
import React from 'react';

// Mock Auth Context
const mockSignUp = vi.fn();

vi.mock('../contexts/AuthContext', async () => {
    const actual = await vi.importActual('../contexts/AuthContext');
    return {
        ...actual,
        useAuth: () => ({
            signUp: mockSignUp,
            login: vi.fn(),
            user: null,
            isLoading: false
        })
    };
});

describe('Login Component - Consent Flow', () => {
    it('renders consent checkboxes in signup mode', () => {
        render(<Login />);

        // Switch to Signup mode
        const signupLink = screen.getByText(/Criar conta agora/i);
        fireEvent.click(signupLink);

        expect(screen.getByText(/Li e aceito os/i)).toBeInTheDocument();
        expect(screen.getByText(/Termos de Uso/i)).toBeInTheDocument();
        expect(screen.getByText(/Política de Privacidade/i)).toBeInTheDocument();
        expect(screen.getByText(/Aceito receber novidades/i)).toBeInTheDocument();
    });

    it('shows error if terms are not accepted', async () => {
        render(<Login />);

        // Switch to Signup
        fireEvent.click(screen.getByText(/Criar conta agora/i));

        // Fill form
        fireEvent.change(screen.getByPlaceholderText(/Nome completo/i), { target: { value: 'User Test' } });
        fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirme sua senha'), { target: { value: 'password123' } });

        // Submit without checking terms
        fireEvent.click(screen.getByText('Criar conta'));

        expect(await screen.findByText(/Você precisa aceitar os Termos de Uso/i)).toBeInTheDocument();
        expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('calls signUp with consents when accepted', async () => {
        mockSignUp.mockResolvedValue({ error: null });
        render(<Login />);

        // Switch to Signup
        fireEvent.click(screen.getByText(/Criar conta agora/i));

        // Fill form
        fireEvent.change(screen.getByPlaceholderText(/Nome completo/i), { target: { value: 'User Test' } });
        fireEvent.change(screen.getByPlaceholderText(/E-mail/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: 'password123' } });
        fireEvent.change(screen.getByPlaceholderText('Confirme sua senha'), { target: { value: 'password123' } });

        // Check terms
        // Need to find the checkbox input. Since it's hidden with "hidden" class but label triggers it.
        // Or find by label text.
        // Wait, "Li e aceito os..." label wraps the input?
        // Let's inspect Login.tsx markup:
        // <label ...> <input type="checkbox" ... /> <span>...</span> </label>
        // It's hidden, so `user-event` or `fireEvent` on label works.
        const termsCheckbox = screen.getByText(/Li e aceito os/i);
        fireEvent.click(termsCheckbox);

        // Submit
        fireEvent.click(screen.getByText('Criar conta'));

        await waitFor(() => {
            expect(mockSignUp).toHaveBeenCalledWith(
                'test@example.com',
                'password123',
                'User Test',
                'client',
                expect.objectContaining({ terms: true, marketing: false })
            );
        });
    });
});
