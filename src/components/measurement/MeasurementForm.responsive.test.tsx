import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MeasurementForm } from '../MeasurementForm';
import { ToastProvider } from '../ui/ToastProvider';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123', email: 'test@example.com' },
    loading: false,
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  }),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ToastProvider>
      {ui}
    </ToastProvider>
  );
};

describe('MeasurementForm Responsive Behavior (Web Desktop vs Mobile)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders Desktop Dual-HUD Layout when viewport width >= 1000px', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
    window.dispatchEvent(new Event('resize'));

    const { container } = renderWithProviders(
      <MeasurementForm onSave={vi.fn()} onCancel={vi.fn()} sex="male" />
    );

    expect(container.querySelector('.form-layout-editor')).toBeInTheDocument();
    expect(container.querySelector('.editor-left')).toBeInTheDocument();
    expect(container.querySelector('.editor-right')).toBeInTheDocument();
    expect(container.querySelector('.connector-overlay')).toBeInTheDocument();
  });

  it('renders Mobile Tap-Measure Interface when viewport width < 1000px', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
    window.dispatchEvent(new Event('resize'));

    const { container } = renderWithProviders(
      <MeasurementForm onSave={vi.fn()} onCancel={vi.fn()} sex="male" />
    );

    // Mobile specific tap measure stage must be present
    expect(container.querySelector('.mobile-tap-measure-container')).toBeInTheDocument();
    expect(container.querySelector('.mobile-silhouette-stage')).toBeInTheDocument();
    expect(container.querySelector('.hero-input-stage')).toBeInTheDocument();

    // Desktop connector overlay must NOT be rendered in mobile view
    expect(container.querySelector('.connector-overlay')).not.toBeInTheDocument();
  });

  it('dynamically adapts when viewport is resized between Desktop and Mobile', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
    const { container } = renderWithProviders(
      <MeasurementForm onSave={vi.fn()} onCancel={vi.fn()} sex="male" />
    );
    expect(container.querySelector('.form-layout-editor')).toBeInTheDocument();

    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 414 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(container.querySelector('.mobile-tap-measure-container')).toBeInTheDocument();
    expect(container.querySelector('.connector-overlay')).not.toBeInTheDocument();
  });
});
