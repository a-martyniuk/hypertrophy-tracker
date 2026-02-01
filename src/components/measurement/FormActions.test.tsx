import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormActions } from './FormActions';

describe('FormActions Component', () => {
    it('renders functionality buttons', () => {
        render(<FormActions isSaving={false} onCancel={() => { }} />);
        expect(screen.getByText('Salir')).toBeInTheDocument();
        expect(screen.getByText('Confirmar Registro')).toBeInTheDocument();
    });

    it('shows loading state when saving', () => {
        render(<FormActions isSaving={true} onCancel={() => { }} />);
        expect(screen.getByText('Guardando...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Guardando/i })).toBeDisabled();
    });

    it('calls onCancel when cancel button is clicked', () => {
        const handleCancel = vi.fn();
        render(<FormActions isSaving={false} onCancel={handleCancel} />);

        fireEvent.click(screen.getByText('Salir'));
        expect(handleCancel).toHaveBeenCalledTimes(1);
    });
});
