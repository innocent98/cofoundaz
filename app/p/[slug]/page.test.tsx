import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const pub = vi.hoisted(() => ({
  getPublicPage: vi.fn(),
  sendPublicEvent: vi.fn(),
  submitPublicSignup: vi.fn(),
}));
vi.mock('next/navigation', () => ({ useParams: () => ({ slug: 'novapay' }) }));
vi.mock('@/lib/api/validation-public', async () => {
  class PublicApiError extends Error {
    constructor(public status: number) {
      super(String(status));
    }
  }
  return { ...pub, PublicApiError };
});

import { PublicApiError } from '@/lib/api/validation-public';
import PublicSmokePage from './page';

const page = {
  headline: 'Get paid the same day',
  subheadline: 'Instant settlement',
  cta_text: 'Join the waitlist',
  require_email: true,
  show_pricing: false,
  metric_type: 'email_signup',
  post_signup_message: "You're on the list, we'll be in touch soon.",
  powered_by: 'Powered by Cofoundaz',
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  pub.getPublicPage.mockResolvedValue(page);
});

describe('public smoke-test page', () => {
  it('renders the page, the footer, and sends one visit with a stored visitor id', async () => {
    render(<PublicSmokePage />);
    expect(await screen.findByRole('heading', { name: 'Get paid the same day' })).toBeTruthy();
    expect(screen.getByText('Instant settlement')).toBeTruthy();
    expect(screen.getByText('Powered by Cofoundaz')).toBeTruthy();
    await waitFor(() => expect(pub.sendPublicEvent).toHaveBeenCalledTimes(1));
    const [slug, kind, id] = pub.sendPublicEvent.mock.calls[0];
    expect([slug, kind]).toEqual(['novapay', 'visit']);
    expect(localStorage.getItem('cf_visitor_novapay')).toBe(id);
  });

  it('shows "This page isn\'t available" on a 404 and no workspace detail', async () => {
    pub.getPublicPage.mockRejectedValue(new PublicApiError(404));
    render(<PublicSmokePage />);
    expect(await screen.findByRole('heading', { name: "This page isn't available" })).toBeTruthy();
    expect(pub.sendPublicEvent).not.toHaveBeenCalled();
  });

  it('validates the email client-side and never calls the API for a bad one', async () => {
    render(<PublicSmokePage />);
    await screen.findByRole('heading', { name: 'Get paid the same day' });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join the waitlist' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
    expect(pub.submitPublicSignup).not.toHaveBeenCalled();
  });

  it('signs up with email and visitor id, fires a cta_click and shows the server message', async () => {
    pub.submitPublicSignup.mockResolvedValue('Custom thanks from the founder');
    render(<PublicSmokePage />);
    await screen.findByRole('heading', { name: 'Get paid the same day' });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'funke@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join the waitlist' }));
    expect(await screen.findByText('Custom thanks from the founder')).toBeTruthy();
    const id = localStorage.getItem('cf_visitor_novapay');
    expect(pub.submitPublicSignup).toHaveBeenCalledWith('novapay', 'funke@example.com', id);
    expect(pub.sendPublicEvent).toHaveBeenCalledWith('novapay', 'cta_click', id);
  });

  it('never shows raw server text when the signup is rejected', async () => {
    pub.submitPublicSignup.mockRejectedValue(new PublicApiError(422));
    render(<PublicSmokePage />);
    await screen.findByRole('heading', { name: 'Get paid the same day' });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'funke@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join the waitlist' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
  });

  it('without email capture the CTA click is recorded and the message shown', async () => {
    pub.getPublicPage.mockResolvedValue({ ...page, require_email: false, cta_text: 'Try it' });
    render(<PublicSmokePage />);
    await screen.findByRole('heading', { name: 'Get paid the same day' });
    expect(screen.queryByLabelText('Email address')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Try it' }));
    expect(await screen.findByText(page.post_signup_message)).toBeTruthy();
    expect(pub.sendPublicEvent).toHaveBeenCalledWith('novapay', 'cta_click', expect.any(String));
    expect(pub.submitPublicSignup).not.toHaveBeenCalled();
  });

  it('fake-door pricing records a preorder click', async () => {
    pub.getPublicPage.mockResolvedValue({ ...page, require_email: false, show_pricing: true, metric_type: 'preorder_click' });
    render(<PublicSmokePage />);
    await screen.findByRole('heading', { name: 'Get paid the same day' });
    fireEvent.click(screen.getByRole('button', { name: 'I would pay for this' }));
    expect(pub.sendPublicEvent).toHaveBeenCalledWith('novapay', 'preorder_click', expect.any(String));
    expect(await screen.findByText(page.post_signup_message)).toBeTruthy();
  });
});
