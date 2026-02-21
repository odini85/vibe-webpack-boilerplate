import { describe, expect, it } from 'vitest';

import { createApp, renderApp } from '../index';

describe('createApp', () => {
  it('renders heading, description, and initial count', () => {
    const app = createApp(2);

    expect(app.className).toBe('app');
    const [heading, description, valueEl] = Array.from(app.children);
    expect(heading?.textContent).toMatch(/카운터/i);
    expect(description?.textContent).toMatch(/버튼을 눌러/i);
    expect(valueEl?.textContent).toBe('2');
  });

  it('increments the count when button is clicked', () => {
    const app = createApp(0);
    const button = app.querySelector('button');
    const valueEl = app.querySelector('.counter-value');

    button?.dispatchEvent(new Event('click'));

    expect(valueEl?.textContent).toBe('1');
  });
});

describe('renderApp', () => {
  it('renders into the provided root element', () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    renderApp('root');

    expect(root.querySelector('.app')).not.toBeNull();
    expect(root.querySelector('.counter-value')?.textContent).toBe('0');
  });
});
