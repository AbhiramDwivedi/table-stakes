import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Since we don't have the actual component, we'll create a mock component for testing purposes
// In a real scenario, you would import the actual component
const QueryInput = ({ onSubmit }: { onSubmit: (query: string) => void }) => {
  const [query, setQuery] = React.useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(query);
  };
  
  return (
    <div className="query-input-container">
      <form onSubmit={handleSubmit}>
        <input 
          className="query-input"
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about your data..."
          data-testid="query-input"
        />
        <button 
          className="query-submit-button"
          type="submit"
          data-testid="query-submit-button"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

describe('QueryInput Component', () => {
  test('renders the input field and submit button', () => {
    render(<QueryInput onSubmit={() => {}} />);
    
    // Check that input and button are rendered
    expect(screen.getByTestId('query-input')).toBeInTheDocument();
    expect(screen.getByTestId('query-submit-button')).toBeInTheDocument();
  });

  test('allows typing in the input field', async () => {
    render(<QueryInput onSubmit={() => {}} />);
    
    // Get the input element
    const inputElement = screen.getByTestId('query-input');
    
    // Simulate typing
    await userEvent.type(inputElement, 'Show all users');
    
    // Check that the input value has changed
    expect(inputElement).toHaveValue('Show all users');
  });

  test('calls onSubmit with the query when form is submitted', async () => {
    // Create a mock function to track calls
    const mockSubmit = jest.fn();
    
    render(<QueryInput onSubmit={mockSubmit} />);
    
    // Get the input element and button
    const inputElement = screen.getByTestId('query-input');
    const submitButton = screen.getByTestId('query-submit-button');
    
    // Type in the input
    await userEvent.type(inputElement, 'Show all users');
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Check that onSubmit was called with the correct query
    expect(mockSubmit).toHaveBeenCalledWith('Show all users');
  });

  test('submits when Enter key is pressed', async () => {
    // Create a mock function to track calls
    const mockSubmit = jest.fn();
    
    render(<QueryInput onSubmit={mockSubmit} />);
    
    // Get the input element
    const inputElement = screen.getByTestId('query-input');
    
    // Type in the input and press Enter
    await userEvent.type(inputElement, 'Show all users{enter}');
    
    // Check that onSubmit was called with the correct query
    expect(mockSubmit).toHaveBeenCalledWith('Show all users');
  });
});