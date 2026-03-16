import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StarRating from '../components/StarRating';

// Mock lucide-react to avoid issues with SVG rendering in JSDOM
jest.mock('lucide-react', () => ({
  Star: () => <div data-testid="star-icon" />,
  StarHalf: () => <div data-testid="star-half-icon" />,
}));

describe('StarRating Component', () => {
  it('renders the correct number of stars', () => {
    render(<StarRating rating={3} interactive={false} />);
    // There should always be 5 star containers
    const stars = screen.getAllByTestId('star-icon');
    expect(stars).toHaveLength(5);
  });

  it('displays the rating text', () => {
    render(<StarRating rating={4.5} interactive={false} />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
  });
});
