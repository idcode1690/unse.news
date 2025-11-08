import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Simple React rendering test
test('React renders basic component without errors', () => {
  const TestComponent = () => <div data-testid="test">Hello React</div>;
  render(<TestComponent />);
  expect(screen.getByTestId('test')).toBeInTheDocument();
  expect(screen.getByText('Hello React')).toBeInTheDocument();
});

// Test basic HTML elements
test('renders button element', () => {
  const TestButton = ({ children, ...props }) => (
    <button {...props}>{children}</button>
  );
  
  render(<TestButton>Click me</TestButton>);
  expect(screen.getByRole('button')).toBeInTheDocument();
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

// Test conditional rendering
test('renders element conditionally', () => {
  const ConditionalComponent = ({ show }) => (
    <div>
      {show && <span data-testid="conditional">Visible</span>}
    </div>
  );
  
  const { rerender } = render(<ConditionalComponent show={false} />);
  expect(screen.queryByTestId('conditional')).not.toBeInTheDocument();
  
  rerender(<ConditionalComponent show={true} />);
  expect(screen.getByTestId('conditional')).toBeInTheDocument();
});

// Test sessionStorage mock
test('sessionStorage mock works', () => {
  sessionStorageMock.setItem('test', 'value');
  expect(sessionStorageMock.setItem).toHaveBeenCalledWith('test', 'value');
  
  sessionStorageMock.getItem.mockReturnValue('value');
  expect(sessionStorageMock.getItem('test')).toBe('value');
});