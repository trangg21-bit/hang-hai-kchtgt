import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Delete"
        message="Are you sure you want to delete this item?"
      />
    );

    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm Delete"
        message="Are you sure?"
      />
    );

    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
  });

  it('renders default cancel button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        message="Message"
      />
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders default confirm button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        message="Message"
      />
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('calls onClose when cancel button clicked', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Delete Item"
        message="This action cannot be undone."
      />
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(handleClose).toHaveBeenCalled();
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Delete Item"
        message="This action cannot be undone."
      />
    );

    fireEvent.click(screen.getByText('Confirm'));
    expect(handleConfirm).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders with custom button labels', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Confirm"
        message="Continue?"
        confirmText="Yes, Proceed"
        cancelText="Go Back"
      />
    );

    expect(screen.getByText('Yes, Proceed')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('renders with custom variant styles', () => {
    const { rerender } = render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Danger Zone"
        message="This is a destructive action"
        variant="danger"
      />
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders with loading state on confirm button', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Processing"
        message="Please wait..."
        isConfirmLoading
      />
    );

    const confirmBtn = screen.getByText('Confirm');
    expect(confirmBtn).toBeDisabled();
  });

  it('renders with icon', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Delete"
        message="Are you sure?"
        icon="Warning"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders with custom children content', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Custom Content"
        message="Check details below:"
      >
        <div data-testid="custom-content">Custom Details</div>
      </ConfirmModal>
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom Details')).toBeInTheDocument();
  });

  it('closes when clicking overlay', () => {
    const handleClose = vi.fn();

    render(
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        title="Delete"
        message="Are you sure?"
      />
    );

    // Simulate click on overlay backdrop
    const overlay = document.querySelector('[role="dialog"]');
    if (overlay) {
      fireEvent.mouseDown(overlay);
    }
    expect(handleClose).toHaveBeenCalled();
  });
});
