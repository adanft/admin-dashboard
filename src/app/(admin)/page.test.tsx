import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import Home from './page';

describe('dashboard Home page', () => {
  it('renders dashboard content without adding a nested main landmark', () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain('Dashboard');
    expect(markup.match(/<main\b/g)).toBeNull();
  });
});
