import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('connects the label to the input', () => {
    render(<Input label="Email address" type="email" />);

    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('shows validation error accessibly', () => {
    render(<Input label="Email address" error="Enter a valid email address." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input label="Display name" />);

    await user.type(screen.getByLabelText('Display name'), 'BandUp');

    expect(screen.getByLabelText('Display name')).toHaveValue('BandUp');
  });
});
