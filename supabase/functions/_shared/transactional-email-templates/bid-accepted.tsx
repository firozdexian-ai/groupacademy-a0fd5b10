import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"
const SITE_URL = "https://groupacademy.lovable.app"

interface BidAcceptedProps {
  name?: string
  gig_title?: string
  credits_awarded?: number
}

const BidAcceptedEmail = ({ name, gig_title, credits_awarded }: BidAcceptedProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your gig submission was approved — {credits_awarded || 0} credits earned!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Submission Approved! 🏆</Heading>
        <Text style={text}>
          {name ? `Congrats ${name},` : 'Congrats,'}
        </Text>
        <Text style={text}>
          Your submission for <strong>{gig_title || 'a gig'}</strong> has been reviewed and approved.
        </Text>
        <Text style={rewardBox}>
          💰 <strong>{credits_awarded || 0} credits</strong> have been added to your wallet.
        </Text>
        <Button style={button} href={SITE_URL + "/app/gigs"}>
          View Your Gigs
        </Button>
        <Text style={footer}>
          Keep earning — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BidAcceptedEmail,
  subject: 'Your gig submission was approved! 🏆',
  displayName: 'Gig submission approved',
  previewData: { name: 'Rafi', gig_title: 'Share 3 Job Posts', credits_awarded: 50 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#333333', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#677280', lineHeight: '1.6', margin: '0 0 16px' }
const rewardBox = { fontSize: '16px', color: '#10D576', lineHeight: '1.6', margin: '0 0 20px', padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', textAlign: 'center' as const }
const button = { backgroundColor: '#2A7DDE', color: '#ffffff', fontSize: '14px', borderRadius: '8px', padding: '12px 24px', textDecoration: 'none', fontWeight: '600' as const }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }

