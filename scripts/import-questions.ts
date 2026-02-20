/**
 * Question File Importer
 *
 * Usage:
 *   npx tsx scripts/import-questions.ts ./questions_raw
 *
 * Supported file formats:
 *   - Plain text (.txt): one question per file, or Q: / A: delimited
 *   - Markdown (.md): ## Question / ## Answer / ## Explanation sections
 *   - JSON (.json): array of { title, content, answer, explanation } objects
 *
 * Filename conventions parsed for metadata:
 *   - Company: first part of filename before underscore or dash
 *   - Round: OA | Online | First | Round1 | Second | Final | Superday
 *   - Difficulty: Easy | Medium | Hard (if present in filename)
 *
 * Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as env vars before running.
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type InterviewRound = 'online_assessment' | 'first_round' | 'second_round' | 'final_round'
type Difficulty = 'easy' | 'medium' | 'hard'

interface ParsedQuestion {
  title: string
  content: string
  answer?: string
  explanation?: string
  difficulty: Difficulty
  round_tag: InterviewRound
  companyName?: string
  sourceFile: string
}

function parseRoundFromFilename(filename: string): InterviewRound {
  const lower = filename.toLowerCase()
  if (lower.includes('oa') || lower.includes('online')) return 'online_assessment'
  if (lower.includes('final') || lower.includes('superday')) return 'final_round'
  if (lower.includes('second') || lower.includes('round2') || lower.includes('round_2')) return 'second_round'
  return 'first_round'
}

function parseDifficultyFromFilename(filename: string): Difficulty {
  const lower = filename.toLowerCase()
  if (lower.includes('hard')) return 'hard'
  if (lower.includes('easy')) return 'easy'
  return 'medium'
}

function parseCompanyFromFilename(filename: string): string | undefined {
  const KNOWN_COMPANIES = [
    'jane_street', 'janestreet', 'jane-street',
    'citadel',
    'two_sigma', 'twosigma',
    'de_shaw', 'deshaw',
    'jump', 'jump_trading',
    'susquehanna', 'sig',
    'virtu',
    'akuna',
    'drw',
    'imc',
    'optiver',
    'hrt', 'hudson_river',
    'drs', 'renaissance',
    'millennium',
    'point72',
  ]

  const lower = filename.toLowerCase()
  for (const company of KNOWN_COMPANIES) {
    if (lower.includes(company)) {
      return company.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
  }
  return undefined
}

function parseTxtFile(content: string, filename: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  const round = parseRoundFromFilename(filename)
  const difficulty = parseDifficultyFromFilename(filename)
  const companyName = parseCompanyFromFilename(filename)

  // Check for Q: A: delimited format
  if (content.includes('Q:') || content.includes('Question:')) {
    const blocks = content.split(/\n(?=Q:|Question:)/i)
    for (const block of blocks) {
      const qMatch = block.match(/Q:|Question:\s*([\s\S]+?)(?=A:|Answer:|$)/i)
      const aMatch = block.match(/A:|Answer:\s*([\s\S]+?)(?=Explanation:|$)/i)
      const eMatch = block.match(/Explanation:\s*([\s\S]+?)$/i)

      if (qMatch?.[1]?.trim()) {
        const questionText = qMatch[1].trim()
        questions.push({
          title: questionText.split('\n')[0].slice(0, 80),
          content: questionText,
          answer: aMatch?.[1]?.trim(),
          explanation: eMatch?.[1]?.trim(),
          difficulty,
          round_tag: round,
          companyName,
          sourceFile: filename,
        })
      }
    }
  } else {
    // Treat entire file as one question
    const trimmed = content.trim()
    if (trimmed.length > 10) {
      questions.push({
        title: trimmed.split('\n')[0].slice(0, 80),
        content: trimmed,
        difficulty,
        round_tag: round,
        companyName,
        sourceFile: filename,
      })
    }
  }

  return questions
}

function parseMdFile(content: string, filename: string): ParsedQuestion[] {
  const round = parseRoundFromFilename(filename)
  const difficulty = parseDifficultyFromFilename(filename)
  const companyName = parseCompanyFromFilename(filename)

  // Split by ## headers to find sections
  const sections: Record<string, string> = {}
  const sectionRegex = /^##\s+(.+)$/gm
  let lastKey = 'intro'
  let lastIndex = 0

  let match
  const matches: { key: string; index: number }[] = []
  while ((match = sectionRegex.exec(content)) !== null) {
    matches.push({ key: match[1].toLowerCase().trim(), index: match.index })
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].key.length + 4
    const end = i + 1 < matches.length ? matches[i + 1].index : content.length
    sections[matches[i].key] = content.slice(start, end).trim()
  }

  const questionContent =
    sections['question'] ||
    sections['problem'] ||
    sections['intro'] ||
    content.split(/^##/m)[0].trim()

  if (!questionContent || questionContent.length < 10) return []

  return [{
    title: questionContent.split('\n')[0].replace(/^#+\s*/, '').slice(0, 80),
    content: questionContent,
    answer: sections['answer'] || sections['solution'],
    explanation: sections['explanation'] || sections['reasoning'] || sections['approach'],
    difficulty,
    round_tag: round,
    companyName,
    sourceFile: filename,
  }]
}

function parseJsonFile(content: string, filename: string): ParsedQuestion[] {
  const round = parseRoundFromFilename(filename)
  const difficulty = parseDifficultyFromFilename(filename)
  const companyName = parseCompanyFromFilename(filename)

  try {
    const data = JSON.parse(content)
    const arr = Array.isArray(data) ? data : [data]
    return arr.map((q: any) => ({
      title: q.title ?? q.question?.slice(0, 80) ?? 'Untitled',
      content: q.content ?? q.question ?? q.text ?? '',
      answer: q.answer,
      explanation: q.explanation,
      difficulty: q.difficulty ?? difficulty,
      round_tag: q.round ?? q.round_tag ?? round,
      companyName: q.company ?? companyName,
      sourceFile: filename,
    }))
  } catch {
    console.warn(`Failed to parse JSON: ${filename}`)
    return []
  }
}

function parseFile(filePath: string): ParsedQuestion[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const filename = path.basename(filePath)
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case '.txt': return parseTxtFile(content, filename)
    case '.md': return parseMdFile(content, filename)
    case '.json': return parseJsonFile(content, filename)
    default:
      console.warn(`Unsupported file type: ${ext}`)
      return []
  }
}

async function getOrCreateCompany(name: string): Promise<string | null> {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const { data: existing } = await supabase.from('companies').select('id').eq('slug', slug).maybeSingle()
  if (existing) return existing.id

  const { data: newCo } = await supabase
    .from('companies')
    .insert({ name, slug, is_premium: true })
    .select('id')
    .single()

  return newCo?.id ?? null
}

async function importQuestions(dir: string) {
  const files = fs.readdirSync(dir).filter((f) => ['.txt', '.md', '.json'].includes(path.extname(f)))

  console.log(`Found ${files.length} files in ${dir}`)

  let totalImported = 0
  let totalSkipped = 0

  for (const file of files) {
    const filePath = path.join(dir, file)
    const parsed = parseFile(filePath)

    console.log(`  ${file}: ${parsed.length} questions found`)

    for (const q of parsed) {
      if (!q.content || q.content.length < 10) {
        totalSkipped++
        continue
      }

      // Insert question
      const { data: newQ, error } = await supabase
        .from('questions')
        .insert({
          title: q.title,
          content: q.content,
          difficulty: q.difficulty,
          round_tag: q.round_tag,
          is_free: false,
          source_notes: `Imported from: ${q.sourceFile}`,
        })
        .select('id')
        .single()

      if (error || !newQ) {
        console.warn(`    Failed to insert question: ${error?.message}`)
        totalSkipped++
        continue
      }

      // Insert answer if present
      if (q.answer) {
        await supabase.from('answers').insert({
          question_id: newQ.id,
          content: q.answer,
          explanation: q.explanation ?? '',
        })
      }

      // Attach company if found
      if (q.companyName) {
        const companyId = await getOrCreateCompany(q.companyName)
        if (companyId) {
          await supabase.from('question_companies').insert({
            question_id: newQ.id,
            company_id: companyId,
          })
        }
      }

      totalImported++
      console.log(`    + Imported: "${q.title.slice(0, 60)}"`)
    }
  }

  console.log(`\nDone! Imported: ${totalImported}, Skipped: ${totalSkipped}`)
}

const dir = process.argv[2]
if (!dir) {
  console.error('Usage: npx tsx scripts/import-questions.ts <directory>')
  process.exit(1)
}

if (!fs.existsSync(dir)) {
  console.error(`Directory not found: ${dir}`)
  process.exit(1)
}

importQuestions(dir).catch(console.error)
