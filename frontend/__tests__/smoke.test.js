import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Simple dummy component for testing if environment works
const Dummy = () => <div>Nebula Test</div>;

describe('Smoke Test', () => {
  it('renders without crashing', () => {
    render(<Dummy />);
    expect(screen.getByText('Nebula Test')).toBeInTheDocument();
  });
});
