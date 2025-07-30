import { render, screen } from '../test-utils';

describe('Simple Test', () => {
  test('renders a simple div', () => {
    render(<div data-testid="simple-test">Hello World</div>);
    expect(screen.getByTestId('simple-test')).toBeInTheDocument();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
