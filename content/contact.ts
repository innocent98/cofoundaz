export const contact = {
  title: 'Get in touch.',
  subtitle: 'We usually reply within one business day.',
  fields: {
    name: { label: 'Name', placeholder: 'Your name' },
    email: { label: 'Email', placeholder: 'you@company.com' },
    topic: { label: 'Topic', options: ['Sales', 'Support', 'Partnerships', 'Press'] },
    message: { label: 'Message', placeholder: 'How can we help?' },
  },
  submit: 'Send message',
  success: 'Thanks, we’ll get back to you within one business day.',
} as const
