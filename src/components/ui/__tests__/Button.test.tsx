import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders its visible label', () => {
    render(<Button>Save changes</Button>);

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
  });

  it('calls onClick when activated by the user', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Continue</Button>);

    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables itself while busy', () => {
    render(<Button busy>Processing</Button>);

    expect(screen.getByRole('button', { name: 'Processing' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Processing' })).toHaveAttribute('aria-busy', 'true');
  });
});
