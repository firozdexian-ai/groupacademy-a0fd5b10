import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "GroUp Academy"

interface ModuleLine {
  title: string
  flaggedQuiz: number
  flaggedScenarios: number
}

interface DigestProps {
  name?: string
  courseTitle?: string
  totalFlagged?: number
  modulesCount?: number
  modules?: ModuleLine[]
}

const AuthoringReviewDigestEmail = ({
  name, courseTitle, totalFlagged = 0, modulesCount = 0, modules = [],
}: DigestProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{totalFlagged} item{totalFlagged === 1 ? '' : 's'} need your review in {courseTitle ?? 'your course'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Items need your review</Heading>
        <Text style={text}>
          {name ? `Hi ${name},` : 'Hi,'}
        </Text>
        <Text style={text}>
          Learners flagged <strong>{totalFlagged}</strong> item{totalFlagged === 1 ? '' : 's'} across
          {' '}<strong>{modulesCount}</strong> module{modulesCount === 1 ? '' : 's'} in
          {' '}<strong>{courseTitle ?? 'your course'}</strong> this week.
          A quick rewrite or recalibration will keep mastery scores accurate.
        </Text>
        <Section style={listBox}>
          {modules.map((m, i) => (
            <Text key={i} style={item}>
              <strong>{m.title}</strong> — {m.flaggedQuiz} quiz · {m.flaggedScenarios} scenario
            </Text>
          ))}
        </Section>
        <Text style={text}>
          Open the Module Manager → Analytics on each module to see exactly which items need editing.
        </Text>
        <Text style={footer}>The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AuthoringReviewDigestEmail,
  subject: (d: Record<string, any>) =>
    `${d.totalFlagged ?? 0} items need your review${d.courseTitle ? ` in ${d.courseTitle}` : ''}`,
  displayName: 'Authoring review digest',
  previewData: {
    name: 'Asha',
    courseTitle: 'Communication Mastery',
    totalFlagged: 7,
    modulesCount: 3,
    modules: [
      { title: 'Module 1 — Listening', flaggedQuiz: 2, flaggedScenarios: 1 },
      { title: 'Module 2 — Empathy', flaggedQuiz: 3, flaggedScenarios: 0 },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#2A7DDE', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 14px' }
const listBox = { borderTop: '1px solid #eeeeee', borderBottom: '1px solid #eeeeee', padding: '12px 0', margin: '12px 0 18px' }
const item = { fontSize: '13px', color: '#333333', margin: '6px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
