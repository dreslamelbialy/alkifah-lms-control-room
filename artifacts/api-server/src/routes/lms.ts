import { Router, type IRouter } from "express";
import { and, count, desc, eq } from "drizzle-orm";
import {
  activityTable,
  assessmentsTable,
  db,
  homeworkTable,
  lessonsTable,
  materialsTable,
  settingsTable,
} from "@workspace/db";
import {
  AddLessonMaterialBody,
  AddLessonMaterialParams,
  AddLessonMaterialResponse,
  CreateLessonBody,
  CreateLessonResponse,
  DeleteLessonParams,
  GenerateAssessmentBody,
  GenerateAssessmentResponse,
  GenerateHomeworkBody,
  GenerateHomeworkResponse,
  GetAssessmentParams,
  GetAssessmentResponse,
  GetDashboardResponse,
  GetHomeworkParams,
  GetHomeworkResponse,
  GetLessonParams,
  GetLessonResponse,
  ListActivityQueryParams,
  ListActivityResponse,
  ListAssessmentsResponse,
  ListHomeworkResponse,
  ListLessonsQueryParams,
  ListLessonsResponse,
  ListProvidersResponse,
  PrepareWorkflowBody,
  PrepareWorkflowResponse,
  UpdateLessonBody,
  UpdateLessonParams,
  UpdateLessonResponse,
  UpdateProviderSettingsBody,
  UpdateProviderSettingsResponse,
} from "@workspace/api-zod";
import {
  allLessonSummaries,
  ensureSeedData,
  generateExercises,
  generateQuestions,
  getLessonDetail,
  lessonSummary,
  logActivity,
  providerLabel,
  providerStatuses,
  selectedProvider,
  type ProviderId,
} from "../lib/lms";

const router: IRouter = Router();

router.get("/dashboard", async (_req, res): Promise<void> => {
  await ensureSeedData();
  const [lessonCount] = await db.select({ value: count() }).from(lessonsTable).where(eq(lessonsTable.status, "ready"));
  const [allLessons] = await db.select({ value: count() }).from(lessonsTable).where(eq(lessonsTable.status, "draft"));
  const [assessments] = await db.select({ value: count() }).from(assessmentsTable);
  const [homework] = await db.select({ value: count() }).from(homeworkTable);
  const activities = await db.select().from(activityTable).orderBy(desc(activityTable.createdAt)).limit(12);
  const providers = await providerStatuses();
  res.json(
    GetDashboardResponse.parse({
      lessonCount: Number(lessonCount?.value ?? 0) + Number(allLessons?.value ?? 0),
      readyLessonCount: Number(lessonCount?.value ?? 0),
      assessmentCount: Number(assessments?.value ?? 0),
      homeworkCount: Number(homework?.value ?? 0),
      providerCount: providers.filter((provider) => provider.available).length,
      recentActivity: activities,
    }),
  );
});

router.get("/lessons", async (req, res): Promise<void> => {
  await ensureSeedData();
  const query = ListLessonsQueryParams.parse(req.query);
  const lessons = await allLessonSummaries(query.search, query.status);
  res.json(ListLessonsResponse.parse(lessons));
});

router.post("/lessons", async (req, res): Promise<void> => {
  const body = CreateLessonBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [lesson] = await db.insert(lessonsTable).values(body.data).returning();
  if (!lesson) {
    res.status(500).json({ error: "Lesson could not be created." });
    return;
  }
  await logActivity("created", "Lesson created", lesson.title);
  res.status(201).json(CreateLessonResponse.parse({ ...lesson, materialCount: 0, assessmentCount: 0 }));
});

router.get("/lessons/:id", async (req, res): Promise<void> => {
  const params = GetLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const lesson = await getLessonDetail(params.data.id);
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  res.json(GetLessonResponse.parse(lesson));
});

router.patch("/lessons/:id", async (req, res): Promise<void> => {
  const params = UpdateLessonParams.safeParse(req.params);
  const body = UpdateLessonBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : "Invalid lesson update." });
    return;
  }
  const [lesson] = await db
    .update(lessonsTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(lessonsTable.id, params.data.id))
    .returning();
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  const summary = await lessonSummary(lesson.id);
  await logActivity("updated", "Lesson updated", lesson.title);
  res.json(UpdateLessonResponse.parse(summary));
});

router.delete("/lessons/:id", async (req, res): Promise<void> => {
  const params = DeleteLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [lesson] = await db
    .update(lessonsTable)
    .set({ status: "archived", updatedAt: new Date() })
    .where(eq(lessonsTable.id, params.data.id))
    .returning();
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  await logActivity("archived", "Lesson archived", lesson.title);
  res.sendStatus(204);
});

router.post("/lessons/:id/materials", async (req, res): Promise<void> => {
  const params = AddLessonMaterialParams.safeParse(req.params);
  const body = AddLessonMaterialBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: !params.success ? params.error.message : "Invalid material." });
    return;
  }
  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, params.data.id));
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  const [material] = await db.insert(materialsTable).values({ ...body.data, lessonId: lesson.id }).returning();
  if (!material) {
    res.status(500).json({ error: "Material could not be added." });
    return;
  }
  await db.update(lessonsTable).set({ updatedAt: new Date() }).where(eq(lessonsTable.id, lesson.id));
  await logActivity("added", "Lesson material added", `${lesson.title} · ${material.name}`);
  res.status(201).json(AddLessonMaterialResponse.parse(material));
});

router.get("/assessments", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ assessment: assessmentsTable, lessonTitle: lessonsTable.title })
    .from(assessmentsTable)
    .innerJoin(lessonsTable, eq(assessmentsTable.lessonId, lessonsTable.id))
    .orderBy(desc(assessmentsTable.createdAt));
  res.json(
    ListAssessmentsResponse.parse(
      rows.map(({ assessment, lessonTitle }) => ({ ...assessment, lessonTitle })),
    ),
  );
});

router.get("/assessments/:id", async (req, res): Promise<void> => {
  const params = GetAssessmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({ assessment: assessmentsTable, lessonTitle: lessonsTable.title })
    .from(assessmentsTable)
    .innerJoin(lessonsTable, eq(assessmentsTable.lessonId, lessonsTable.id))
    .where(eq(assessmentsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Assessment not found." });
    return;
  }
  res.json(GetAssessmentResponse.parse({ ...row.assessment, lessonTitle: row.lessonTitle }));
});

router.post("/assessments/generate", async (req, res): Promise<void> => {
  const body = GenerateAssessmentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const result = await generateQuestions(body.data.lessonId, body.data.provider as ProviderId | undefined);
    const lesson = await lessonSummary(body.data.lessonId);
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found." });
      return;
    }
    const now = new Date();
    const closesAt = new Date(now);
    closesAt.setMonth(closesAt.getMonth() + 2);
    const [assessment] = await db
      .insert(assessmentsTable)
      .values({
        lessonId: lesson.id,
        title: lesson.title,
        difficulty: "Easy",
        questionCount: 5,
        provider: result.provider,
        questions: result.questions,
        opensAt: new Date(now.getTime() + 5 * 60 * 1000),
        closesAt,
      })
      .returning();
    if (!assessment) {
      res.status(500).json({ error: "Assessment could not be saved." });
      return;
    }
    await logActivity("generated", "Easy assessment generated", `${lesson.title} · ${providerLabel(result.provider)}`);
    res.status(201).json(
      GenerateAssessmentResponse.parse({
        ...assessment,
        lessonTitle: lesson.title,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Assessment generation failed");
    res.status(503).json({ error: error instanceof Error ? error.message : "Assessment generation failed." });
  }
});

router.get("/homework", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ homework: homeworkTable, lessonTitle: lessonsTable.title })
    .from(homeworkTable)
    .innerJoin(lessonsTable, eq(homeworkTable.lessonId, lessonsTable.id))
    .orderBy(desc(homeworkTable.createdAt));
  res.json(
    ListHomeworkResponse.parse(rows.map(({ homework, lessonTitle }) => ({ ...homework, lessonTitle }))),
  );
});

router.get("/homework/:id", async (req, res): Promise<void> => {
  const params = GetHomeworkParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({ homework: homeworkTable, lessonTitle: lessonsTable.title })
    .from(homeworkTable)
    .innerJoin(lessonsTable, eq(homeworkTable.lessonId, lessonsTable.id))
    .where(eq(homeworkTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Homework sheet not found." });
    return;
  }
  res.json(GetHomeworkResponse.parse({ ...row.homework, lessonTitle: row.lessonTitle }));
});

router.post("/homework/generate", async (req, res): Promise<void> => {
  const body = GenerateHomeworkBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const result = await generateExercises(
      body.data.lessonId,
      body.data.provider as ProviderId | undefined,
      body.data.assessmentId,
    );
    const lesson = await lessonSummary(body.data.lessonId);
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found." });
      return;
    }
    const [homework] = await db
      .insert(homeworkTable)
      .values({
        lessonId: lesson.id,
        title: `${lesson.title} · Homework`,
        exerciseCount: result.exercises.length,
        provider: result.provider,
        exercises: result.exercises,
      })
      .returning();
    if (!homework) {
      res.status(500).json({ error: "Homework could not be saved." });
      return;
    }
    await logActivity("generated", "Homework sheet generated", `${lesson.title} · ${providerLabel(result.provider)}`);
    res.status(201).json(
      GenerateHomeworkResponse.parse({
        ...homework,
        lessonTitle: lesson.title,
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Homework generation failed");
    res.status(503).json({ error: error instanceof Error ? error.message : "Homework generation failed." });
  }
});

router.get("/activity", async (req, res): Promise<void> => {
  const query = ListActivityQueryParams.parse(req.query);
  const rows = await db.select().from(activityTable).orderBy(desc(activityTable.createdAt)).limit(query.limit ?? 12);
  res.json(ListActivityResponse.parse(rows));
});

router.get("/providers", async (_req, res): Promise<void> => {
  res.json(ListProvidersResponse.parse(await providerStatuses()));
});

router.patch("/providers/settings", async (req, res): Promise<void> => {
  const body = UpdateProviderSettingsBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const statuses = await providerStatuses();
  const provider = statuses.find((item) => item.id === body.data.provider);
  if (!provider?.available) {
    res.status(400).json({ error: `${provider?.label ?? body.data.provider} is not configured.` });
    return;
  }
  await db
    .insert(settingsTable)
    .values({ key: "selectedProvider", value: body.data.provider })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: { value: body.data.provider, updatedAt: new Date() },
    });
  await logActivity("selected", "AI provider selected", provider.label);
  res.json(UpdateProviderSettingsResponse.parse(await providerStatuses()));
});

router.post("/workflow/prepare", async (req, res): Promise<void> => {
  const body = PrepareWorkflowBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const lesson = await getLessonDetail(body.data.lessonId);
  if (!lesson) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  const [assessment] = body.data.assessmentId
    ? await db.select().from(assessmentsTable).where(and(eq(assessmentsTable.id, body.data.assessmentId), eq(assessmentsTable.lessonId, lesson.id)))
    : [];
  const [homework] = body.data.homeworkId
    ? await db.select().from(homeworkTable).where(and(eq(homeworkTable.id, body.data.homeworkId), eq(homeworkTable.lessonId, lesson.id)))
    : [];
  const checks = [
    {
      id: "lesson-materials",
      label: "Lesson materials",
      status: lesson.materials.length ? "pass" : "blocked",
      detail: lesson.materials.length ? `${lesson.materials.length} material(s) ready.` : "Add at least one material before preparing LMS work.",
    },
    {
      id: "assessment",
      label: "Assessment package",
      status: assessment ? "pass" : "warning",
      detail: assessment ? "Five Easy questions and timing rules are attached." : "Select a generated assessment to include it.",
    },
    {
      id: "homework",
      label: "Homework sheet",
      status: homework ? "pass" : "warning",
      detail: homework ? `${homework.exerciseCount} exercises are attached.` : "Homework is optional for this preparation.",
    },
    {
      id: "safe-mode",
      label: "Safe workflow mode",
      status: "pass",
      detail: "No browser automation or LMS submission is performed by this preparation step.",
    },
  ];
  const preparation = {
    lessonId: lesson.id,
    ready: checks.every((check) => check.status !== "blocked"),
    checks,
    generatedAt: new Date(),
  };
  await logActivity("prepared", "Safe LMS workflow prepared", lesson.title);
  res.json(PrepareWorkflowResponse.parse(preparation));
});

export default router;