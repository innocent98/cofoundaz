import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './markdown';

describe('Markdown', () => {
  it('renders headings, lists and emphasis', () => {
    const { container } = render(<Markdown source={'## Title\n\nHello **bold** and *it*.\n\n- a\n- b\n\n1. one\n2. two'} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Title' })).toBeInTheDocument();
    expect(container.querySelector('strong')?.textContent).toBe('bold');
    expect(container.querySelectorAll('ul li')).toHaveLength(2);
    expect(container.querySelectorAll('ol li')).toHaveLength(2);
  });

  it('never injects raw HTML', () => {
    const { container } = render(
      <Markdown source={'<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\nok'} />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });

  it('drops unsafe link targets but keeps the text', () => {
    const { container } = render(
      <Markdown source={'[bad](javascript:alert(1)) [good](https://example.com) [app](/academy)'} />,
    );
    const links = Array.from(container.querySelectorAll('a'));
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['https://example.com', '/academy']);
    expect(container.textContent).toContain('bad');
    expect(links[0].getAttribute('rel')).toBe('noopener noreferrer');
  });
});
