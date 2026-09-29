import { and, asc, count, desc, eq, ilike } from "drizzle-orm";
import {
  activityTable,
  assessmentsTable,
  db,
  homeworkTable,
  lessonsTable,
  materialsTable,
  settingsTable,
} from "@workspace/db";
import { logger } from "./logger";

export type ProviderId = "gemini" | "openai" | "deepseek";

const providerDefaults: Record<ProviderId, { label: string; model: string }> = {
  gemini: { label: "Gemini", model: "gemini-2.5-flash" },
  openai: { label: "GPT", model: "gpt-4o-mini" },
  deepseek: { label: "DeepSeek", model: "deepseek-chat" },
};

function hasProviderKey(provider: ProviderId): boolean {
  const keyByProvider: Record<ProviderId, string> = {
    gemini: "GEMINI_API_KEY",
    openai: "OPENAI_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
  };
  return Boolean(process.env[keyByProvider[provider]]);
}

export async function selectedProvider(): Promise<ProviderId> {
  const [setting] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, "selectedProvider"));
  const value = setting?.value;
  if (value === "openai" || value === "deepseek" || value === "gemini") {
    return value;
  }
  return "gemini";
}

export async function providerStatuses() {
  const selected = await selectedProvider();
  return (Object.keys(providerDefaults) as ProviderId[]).map((id) => ({
    id,
    label: providerDefaults[id].label,
    available: hasProviderKey(id),
    selected: id === selected,
    model: providerDefaults[id].model,
  }));
}

export async function logActivity(action: string, label: string, detail?: string) {
  await db.insert(activityTable).values({ action, label, detail });
}

let seedPromise: Promise<void> | null = null;

async function seedStarterData() {
  const [starter] = await db
    .select({ id: lessonsTable.id })
    .from(lessonsTable)
    .where(eq(lessonsTable.title, "Unit 1: Greetings and Introductions"))
    .limit(1);
  if (starter) return;

  const [existingCount] = await db.select({ value: count() }).from(lessonsTable);
  if (Number(existingCount?.value ?? 0) > 0) return;

  const [lesson] = await db
    .insert(lessonsTable)
    .values({
      title: "Unit 1: Greetings and Introductions",
      course: "English Foundations",
      level: "A1",
      status: "ready",
    })
    .returning();
  if (!lesson) return;

  await db.insert(materialsTable).values({
    lessonId: lesson.id,
    name: "Teacher notes",
    kind: "text",
    content:
      "Practice hello, good morning, my name is, nice to meet you, and short introductions.",
  });
  await logActivity("seeded", "Starter lesson added", lesson.title);
  logger.info({ lessonId: lesson.id }, "Seeded starter LMS lesson");
}

export async function ensureSeedData() {
  if (!seedPromise) {
    seedPromise = seedStarterData().finally(() => {
      seedPromise = null;
    });
  }
  await seedPromise;
}

export async function lessonSummary(lessonId: number) {
  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, lessonId));
  if (!lesson) return undefined;
  const [{ value: materialCount }] = await db
    .select({ value: count() })
    .from(materialsTable)
    .where(eq(materialsTable.lessonId, lessonId));
  const [{ value: assessmentCount }] = await db
    .select({ value: count() })
    .from(assessmentsTable)
    .where(eq(assessmentsTable.lessonId, lessonId));
  return {
    ...lesson,
    materialCount: Number(materialCount),
    assessmentCount: Number(assessmentCount),
  };
}

export async function allLessonSummaries(search?: string, status?: string) {
  const filters = [];
  if (status) filters.push(eq(lessonsTable.status, status));
  if (search) filters.push(ilike(lessonsTable.title, `%${search}%`));
  const lessons = await db
    .select()
    .from(lessonsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(lessonsTable.updatedAt));

  return Promise.all(
    lessons.map(async (lesson) => {
      const [materialResult] = await db
        .select({ value: count() })
        .from(materialsTable)
        .where(eq(materialsTable.lessonId, lesson.id));
      const [assessmentResult] = await db
        .select({ value: count() })
        .from(assessmentsTable)
        .where(eq(assessmentsTable.lessonId, lesson.id));
      return {
        ...lesson,
        materialCount: Number(materialResult?.value ?? 0),
        assessmentCount: Number(assessmentResult?.value ?? 0),
      };
    }),
  );
}

export async function getLessonDetail(lessonId: number) {
  const summary = await lessonSummary(lessonId);
  if (!summary) return undefined;
  const materials = await db
    .select()
    .from(materialsTable)
    .where(eq(materialsTable.lessonId, lessonId))
    .orderBy(asc(materialsTable.createdAt));
  return { ...summary, materials };
}

function parseJson(text: string): unknown {
  const withoutFence = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(withoutFence);
}

async function providerJson(provider: ProviderId, prompt: string): Promise<unknown> {
  const model = providerDefaults[provider].model;
  let response: Response;

  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Gemini is not configured.");
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        }),
      },
    );
  } else {
    const key = provider === "openai" ? process.env.OPENAI_API_KEY : process.env.DEEPSEEK_API_KEY;
    if (!key) throw new Error(`${providerDefaults[provider].label} is not configured.`);
    const baseUrl =
      provider === "openai" ? "https://api.openai.com/v1/chat/completions" : "https://api.deepseek.com/chat/completions";
    response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Return only valid JSON. Do not wrap it in markdown.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
  }

  const payload = (await response.json()) as Record<string, any>;
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `${providerDefaults[provider].label} request failed.`);
  }
  const text =
    provider === "gemini"
      ? payload.candidates?.[0]?.content?.parts?.[0]?.text
      : payload.choices?.[0]?.message?.content;
  if (typeof text !== "string") throw new Error("The provider returned no content.");
  return parseJson(text);
}

function normalizedQuestions(value: unknown) {
  const items = (value as { questions?: unknown[] })?.questions;
  if (!Array.isArray(items) || items.length !== 5) {
    throw new Error("The provider did not return exactly five questions.");
  }
  return items.map((item, index) => {
    const question = item as Record<string, unknown>;
    const options = Array.isArray(question.options)
      ? question.options.filter((option): option is string => typeof option === "string")
      : [];
    if (
      typeof question.prompt !== "string" ||
      typeof question.answer !== "string" ||
      typeof question.explanation !== "string" ||
      options.length < 2
    ) {
      throw new Error(`Question ${index + 1} is incomplete.`);
    }
    return {
      id: typeof question.id === "string" ? question.id : `q${index + 1}`,
      prompt: question.prompt,
      options,
      answer: question.answer,
      explanation: question.explanation,
    };
  });
}

function normalizedExercises(value: unknown) {
  const items = (value as { exercises?: unknown[] })?.exercises;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("The provider did not return homework exercises.");
  }
  return items.map((item, index) => {
    const exercise = item as Record<string, unknown>;
    if (typeof exercise.prompt !== "string" || typeof exercise.answer !== "string") {
      throw new Error(`Exercise ${index + 1} is incomplete.`);
    }
    return {
      id: typeof exercise.id === "string" ? exercise.id : `e${index + 1}`,
      prompt: exercise.prompt,
      answer: exercise.answer,
    };
  });
}

export async function generateQuestions(lessonId: number, providerOverride?: ProviderId) {
  const detail = await getLessonDetail(lessonId);
  if (!detail) throw new Error("Lesson not found.");
  const provider = providerOverride ?? (await selectedProvider());
  if (!hasProviderKey(provider)) throw new Error(`${providerDefaults[provider].label} is not configured.`);
  const source = detail.materials.map((material) => `${material.name}:\n${material.content}`).join("\n\n");
  const result = await providerJson(
    provider,
    `Create exactly five Easy English-learning multiple-choice questions from this lesson. Use only the supplied material. Return JSON with a questions array; each item must have id, prompt, options (exactly four strings), answer (one option), and explanation.\nLesson: ${detail.title}\nCourse: ${detail.course}\nMaterials:\n${source}`,
  );
  return { provider, questions: normalizedQuestions(result) };
}

export async function generateExercises(lessonId: number, providerOverride?: ProviderId, assessmentId?: number | null) {
  const detail = await getLessonDetail(lessonId);
  if (!detail) throw new Error("Lesson not found.");
  const provider = providerOverride ?? (await selectedProvider());
  if (!hasProviderKey(provider)) throw new Error(`${providerDefaults[provider].label} is not configured.`);
  let source = detail.materials.map((material) => `${material.name}:\n${material.content}`).join("\n\n");
  if (assessmentId) {
    const [assessment] = await db.select().from(assessmentsTable).where(eq(assessmentsTable.id, assessmentId));
    if (assessment) source += `\nExisting questions:\n${JSON.stringify(assessment.questions)}`;
  }
  const result = await providerJson(
    provider,
    `Create a concise homework sheet with 6 practice exercises based on this lesson. Keep it suitable for beginner English learners and include an answer for each exercise. Return JSON with an exercises array; each item must have id, prompt, and answer.\nLesson: ${detail.title}\nMaterials:\n${source}`,
  );
  return { provider, exercises: normalizedExercises(result) };
}

export const providerLabel = (provider: string) =>
  provider in providerDefaults ? providerDefaults[provider as ProviderId].label : provider;