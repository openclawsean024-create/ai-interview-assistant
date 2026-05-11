/**
 * Sessions API — persistence layer for interview history.
 *
 * Current implementation: in-memory store (per-process, resets on cold start).
 * Production upgrade path: replace `store` with Prisma calls to Neon Postgres.
 *
 *   GET  /api/sessions?userId=xxx          — list user's sessions (latest 20)
 *   POST /api/sessions                     — create or append to a session
 */
import { NextRequest, NextResponse } from 'next/server';

interface QuestionEntry {
  id: string;
  text: string;
  aiAnswer: string;
  techTags: string[];
  aiScore?: number;
  askedAt: string;
}

interface Session {
  id: string;
  userId: string;
  title: string;
  questions: QuestionEntry[];
  startedAt: string;
  updatedAt: string;
}

// In-memory store — swap with Prisma in production
const store = new Map<string, Session[]>();

function getUserSessions(userId: string): Session[] {
  return store.get(userId) ?? [];
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }
  const sessions = getUserSessions(userId).slice(-20).reverse();
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId, question } = body as {
      userId: string;
      sessionId?: string;
      question: Omit<QuestionEntry, 'id' | 'askedAt'>;
    };

    if (!userId || !question?.text) {
      return NextResponse.json({ error: 'Missing userId or question' }, { status: 400 });
    }

    const sessions = getUserSessions(userId);
    const now = new Date().toISOString();

    let session: Session | undefined = sessionId
      ? sessions.find((s) => s.id === sessionId)
      : undefined;

    if (!session) {
      session = {
        id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        title: question.text.slice(0, 50),
        questions: [],
        startedAt: now,
        updatedAt: now,
      };
      sessions.push(session);
      store.set(userId, sessions);
    }

    const entry: QuestionEntry = {
      id: `q_${Date.now()}`,
      ...question,
      askedAt: now,
    };
    session.questions.push(entry);
    session.updatedAt = now;

    return NextResponse.json({ sessionId: session.id, questionId: entry.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
