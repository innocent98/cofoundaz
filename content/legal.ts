import type { LegalDocument } from './types'

export const legalDocuments: Record<
  'terms' | 'privacy' | 'security' | 'cookies',
  LegalDocument
> = {
  terms: {
    title: 'Terms of Service',
    updated: 'July 1, 2026',
    intro:
      'These Terms of Service govern your access to and use of Cofoundaz. By creating a workspace you agree to them. This is a v1 layout; final language is provided by counsel.',
    sections: [
      { heading: '1. Your account', body: 'You are responsible for the activity in your workspace and for keeping your credentials secure. Each workspace has one owner account.' },
      { heading: '2. Acceptable use', body: 'Do not misuse the service, attempt to disrupt it, or use it to violate the rights of others. AI outputs are drafts you are responsible for reviewing before use.' },
      { heading: '3. Your content', body: 'You retain ownership of everything you put into your workspace. We process it only to provide the service to you.' },
      { heading: '4. Billing', body: 'Paid plans renew automatically until cancelled. Upgrades apply immediately; downgrades take effect at the end of the billing period.' },
      { heading: '5. Termination', body: 'You may close your workspace at any time. We keep your data for 90 days after cancellation, after which it is permanently deleted.' },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    updated: 'July 1, 2026',
    intro:
      'This policy explains what we collect, why, and the controls you have. This is a v1 layout; final language is provided by counsel.',
    sections: [
      { heading: 'What we collect', body: 'Account details, workspace content you create, and product usage needed to run and improve the service.' },
      { heading: 'How we use it', body: 'To operate your workspace, personalize your roadmap and Health Score, and keep the platform secure.' },
      { heading: 'AI and your data', body: 'Your workspace data is never used to train AI models. It is used only to generate answers and artifacts for you.' },
      { heading: 'Your controls', body: 'You can export or delete your data, manage sharing per document, and clear your AI Co-Founder memory at any time.' },
      { heading: 'Data retention', body: 'Content is retained while your workspace is active and for 90 days after cancellation.' },
    ],
  },

  security: {
    title: 'Security at Cofoundaz',
    updated: 'July 1, 2026',
    intro:
      // The counsel disclaimer matters most on this page: it is the one making
      // unqualified factual claims (OWASP ASVS L2, annual penetration test,
      // SOC 2 providers, 30-day PITR, a tested DR plan) for a product that has
      // no backend yet.
      'Your startup runs on Cofoundaz, so security is foundational. Here is how we protect your workspace. This is a v1 layout; final language is provided by counsel.',
    sections: [
      { heading: 'Isolated workspaces', body: 'Every workspace is tenant-isolated with row-level policies enforced at both the gateway and the service layer.' },
      { heading: 'Encryption', body: 'Data is encrypted in transit and at rest. The Founder Journal is additionally encrypted with a per-workspace key.' },
      { heading: 'Access controls', body: 'Granular, role-based permissions with per-document sharing and a full, immutable audit trail of sensitive actions.' },
      { heading: 'Compliance', body: 'We operate against OWASP ASVS L2, run an annual penetration test, and use SOC 2 providers for e-signature and payments.' },
      { heading: 'Resilience', body: 'Point-in-time recovery with 30-day backups, versioned document storage, and a tested disaster-recovery plan.' },
    ],
  },

  cookies: {
    title: 'Cookie Policy',
    updated: 'July 1, 2026',
    intro:
      'This policy describes the cookies we use and how to manage them. This is a v1 layout; final language is provided by counsel.',
    sections: [
      { heading: 'Essential cookies', body: 'Required to keep you signed in and to keep the product working. These cannot be turned off.' },
      { heading: 'Analytics cookies', body: 'Help us understand how the product is used so we can improve it. These are optional.' },
      { heading: 'Managing cookies', body: 'You can control non-essential cookies from your browser settings and from your workspace preferences.' },
    ],
  },
}

export const legalBackLink = { label: '← Back home', href: '/' }
