import Anthropic from '@anthropic-ai/sdk'
import { Difficulty, InterviewRound } from '@/types'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface GeneratedQuestion {
  title: string
  content: string
  difficulty: Difficulty
  round_tag: InterviewRound
  answer: string
  explanation: string
  topics: string[]
}

interface GenerateQuestionsInput {
  existingQuestions: Array<{ title: string; content: string }>
  topic: string
  count: number
  difficulty?: Difficulty
  round?: InterviewRound
}

export async function generateQuestions({
  existingQuestions,
  topic,
  count,
  difficulty,
  round,
}: GenerateQuestionsInput): Promise<GeneratedQuestion[]> {
  const examplesList = existingQuestions
    .slice(0, 5)
    .map((q, i) => `${i + 1}. ${q.title}: ${q.content}`)
    .join('\n')

  const difficultyInstruction = difficulty
    ? `All questions should be of ${difficulty} difficulty.`
    : 'Vary the difficulty across easy, medium, and hard.'

  const roundInstruction = round
    ? `Target these questions for the ${round.replace(/_/g, ' ')} stage.`
    : 'Assign appropriate interview rounds based on question complexity.'

  const prompt = `You are an expert quant finance interviewer creating interview prep questions.

Topic: ${topic}
${difficultyInstruction}
${roundInstruction}

Here are example questions from this dataset for style reference:
${examplesList}

Generate ${count} new, unique, high-quality quant finance interview questions on the topic of "${topic}".
These should be the type of questions asked at top quant firms (Jane Street, Two Sigma, Citadel, DE Shaw, Jump Trading, etc.).

For each question, provide:
- A concise title (max 80 chars)
- The full question text (as it would be asked in an interview)
- Difficulty: easy | medium | hard
- Round: online_assessment | first_round | second_round | final_round
- A complete, correct answer
- A detailed explanation of the reasoning and approach
- 2-4 relevant topic tags from: [probability, statistics, linear_algebra, calculus, brainteasers, programming, stochastic_processes, options_pricing, risk, market_making, data_structures, algorithms, mental_math, combinatorics, game_theory, finance_fundamentals]

Respond with a valid JSON array only, no markdown fences, no extra text.
Schema:
[
  {
    "title": "string",
    "content": "string",
    "difficulty": "easy|medium|hard",
    "round_tag": "online_assessment|first_round|second_round|final_round",
    "answer": "string",
    "explanation": "string",
    "topics": ["string"]
  }
]`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  })

  const responseText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')

  try {
    const parsed = JSON.parse(responseText)
    if (!Array.isArray(parsed)) throw new Error('Response is not an array')
    return parsed as GeneratedQuestion[]
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error}`)
  }
}
