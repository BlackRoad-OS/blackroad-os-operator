import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnvCard } from '@/components/EnvCard';
import type { Env } from '@/types';

const mockEnv: Env = {
  id: 'env-1',
  name: 'Aurora',
  region: 'us-west-2',
  status: 'healthy',
  agentCount: 7,
  lastDeploy: {
    id: 'deploy-1',
    version: '2024.09.01',
    committedAt: '2024-09-01T00:00:00Z',
    status: 'success'
  }
};

describe('EnvCard', () => {
  it('renders environment metadata', () => {
    render(<EnvCard env={mockEnv} />);

    expect(screen.getByText('Aurora')).toBeInTheDocument();
    expect(screen.getByText('us-west-2')).toBeInTheDocument();
    expect(screen.getByText(/Env ID/)).toHaveTextContent('env-1');
  });
});
