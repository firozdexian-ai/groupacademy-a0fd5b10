import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"
const SITE_URL = "https://groupacademy.lovable.app"

interface ServiceCompleteProps {
  name?: string
  service_name?: string
  summary?: string
}

const ServiceCompleteEmail = ({ name, service_name, summary }: ServiceCompleteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your {service_name || 'service'} results are ready!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Results Are Ready ✅</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi there,'}
        </Text>
        <Text style={text}>
          Great news! Your <strong>{service_name || 'service'}</strong> has been completed and your results are ready to view.
        </Text>
        {summary ? (
          <Text style={summaryBox}>
            {summary}
          </Text>
        ) : null}
        <Button style={button} href={SITE_URL + "/app/my-results"}>
          View Your Results
        </Button>
        <Text style={footer}>
          Keep building your career — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ServiceCompleteEmail,
  subject: (data: Record<string, unknown>) => `Your ${data.service_name || 'service'} results are ready ✅`,
  displayName: 'Service complete notification',
  previewData: { name: 'Ahmed', service_name: 'Career Assessment', summary: 'Overall score: 78% — Market Ready' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 16px' }
const summaryBox = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 20px', padding: '16px', backgroundColor: '#f0f7ff', borderRadius: '8px', borderLeft: '4px solid #2A7DDE' }
const button = { backgroundColor: '#2A7DDE', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }


