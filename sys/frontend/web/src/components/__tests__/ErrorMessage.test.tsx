import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message text', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Error" />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('renders and calls retry button', () => {
    const onRetry = jest.fn();
    render(<ErrorMessage message="Error" onRetry={onRetry} />);

    const button = screen.getByText('Try Again');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
