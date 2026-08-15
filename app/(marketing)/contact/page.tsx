import type { Metadata } from 'next'
import { Container } from '@/ui/primitives'
import { ContactForm } from '@/ui/marketing/contact/contact-form'
import { contact } from '@/content/contact'

export const metadata: Metadata = {
  title: 'Contact',
  description: contact.subtitle,
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <Container width="prose" className="max-w-[620px] pb-24 pt-16">
      <h1 className="text-center font-display text-[32px] font-semibold text-green-900 md:text-[40px]">
        {contact.title}
      </h1>
      <p className="mt-3 text-center text-base text-sage-500">{contact.subtitle}</p>
      <ContactForm />
    </Container>
  )
}
