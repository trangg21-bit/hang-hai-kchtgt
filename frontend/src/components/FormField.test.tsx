import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FormField from './FormField';

describe('FormField Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders text input with label', () => {
    render(
      <FormField
        label="Username"
        name="username"
        type="text"
        value="admin"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin')).toBeInTheDocument();
  });

  it('renders email input with type=email', () => {
    render(
      <FormField
        label="Email"
        name="email"
        type="email"
        value="admin@hanghai.vn"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  it('renders password input with type=password', () => {
    render(
      <FormField
        label="Password"
        name="password"
        type="password"
        value="secret123"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('renders textarea when fieldType=textarea', () => {
    render(
      <FormField
        label="Description"
        name="description"
        fieldType="textarea"
        value="A description"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Description')).toHaveAttribute('rows');
  });

  it('renders select dropdown when options provided', () => {
    render(
      <FormField
        label="Status"
        name="status"
        fieldType="select"
        value="active"
        options={[
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ]}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Status')).toHaveValue('active');
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('renders with validation error', () => {
    render(
      <FormField
        label="Email"
        name="email"
        type="email"
        value="invalid-email"
        error="Invalid email format"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('calls onChange on value change', () => {
    const handleChange = vi.fn();
    render(
      <FormField
        label="Name"
        name="name"
        type="text"
        value="Old Value"
        onChange={handleChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Value' },
    });
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders with helper text', () => {
    render(
      <FormField
        label="Username"
        name="username"
        type="text"
        value="admin"
        helperText="Enter your desired username"
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Enter your desired username')).toBeInTheDocument();
  });

  it('renders with disabled state', () => {
    render(
      <FormField
        label="Username"
        name="username"
        type="text"
        value="admin"
        disabled
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Username')).toBeDisabled();
  });

  it('renders with required indicator', () => {
    render(
      <FormField
        label="Email"
        name="email"
        type="email"
        required
        value=""
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Email *')).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(
      <FormField
        label="Search"
        name="search"
        type="text"
        placeholder="Enter keyword..."
        onChange={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText('Enter keyword...')).toBeInTheDocument();
  });

  it('renders custom component when renderField provided', () => {
    const customField = (
      <div data-testid="custom-field">Custom Field</div>
    );

    render(
      <FormField
        label="Custom"
        name="custom"
        renderField={() => customField}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('custom-field')).toBeInTheDocument();
  });
});
