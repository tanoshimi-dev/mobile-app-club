import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const { rerender, container } = render(<LoadingSpinner size="small" />);
    expect(container.querySelector('[class*="small"]')).toBeTruthy();

    rerender(<LoadingSpinner size="large" />);
    expect(container.querySelector('[class*="large"]')).toBeTruthy();
  });
});
