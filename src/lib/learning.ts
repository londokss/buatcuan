import type { LessonDto } from "@/lib/api";

export const learningLevels = [
  { key: "Beginner", label: "Level 1 - Basic", shortLabel: "Basic" },
  { key: "Intermediate", label: "Level 2 - Menengah", shortLabel: "Menengah" },
  { key: "Advanced", label: "Level 3 - Mahir", shortLabel: "Mahir" },
] as const;

export type LearningLevel = (typeof learningLevels)[number]["key"];

const levelRank: Record<LearningLevel, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

const categoryRank: Record<LessonDto["category"], number> = {
  TikTok: 0,
  Instagram: 1,
  YouTube: 2,
  Facebook: 3,
};

export function sortLearningPath(lessons: LessonDto[]) {
  return [...lessons].sort((a, b) => {
    const bySection = (a.section?.sortOrder ?? 99) - (b.section?.sortOrder ?? 99);
    if (bySection) return bySection;
    const bySort = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    if (bySort) return bySort;
    const byLevel = levelRank[a.level] - levelRank[b.level];
    if (byLevel) return byLevel;
    const byCategory = categoryRank[a.category] - categoryRank[b.category];
    if (byCategory) return byCategory;
    return a.title.localeCompare(b.title);
  });
}

export function getLessonsByLevel(lessons: LessonDto[], level: LearningLevel) {
  return sortLearningPath(lessons).filter((lesson) => lesson.level === level);
}

export function isSequentiallyAvailable(lessons: LessonDto[], lessonId: string, completedLessonIds: string[]) {
  const path = sortLearningPath(lessons);
  const index = path.findIndex((lesson) => lesson.id === lessonId);
  if (index < 0) return false;
  const current = path[index];
  const sectionPath = current.sectionSlug
    ? path.filter((lesson) => lesson.sectionSlug === current.sectionSlug)
    : path;
  const sectionIndex = sectionPath.findIndex((lesson) => lesson.id === lessonId);
  if (sectionIndex < 0) return false;
  return sectionPath.slice(0, sectionIndex).every((lesson) => completedLessonIds.includes(lesson.id));
}

export function getNextLesson(lessons: LessonDto[], completedLessonIds: string[], proAccess = true) {
  const path = sortLearningPath(lessons);
  return path.find((lesson) =>
    !completedLessonIds.includes(lesson.id) &&
    !isMembershipLocked(lesson, proAccess) &&
    isSequentiallyAvailable(path, lesson.id, completedLessonIds)
  ) ?? null;
}

export function getLearningStatus(lessons: LessonDto[], lesson: LessonDto, completedLessonIds: string[], proAccess = true) {
  const completed = completedLessonIds.includes(lesson.id);
  const sequentiallyAvailable = isSequentiallyAvailable(lessons, lesson.id, completedLessonIds);
  const pointLocked = lesson.isPointLocked && !lesson.isPointUnlocked;
  const membershipLocked = isMembershipLocked(lesson, proAccess);

  return {
    completed,
    locked: !completed && (!sequentiallyAvailable || membershipLocked),
    pointLocked,
    membershipLocked,
    sequentiallyAvailable,
  };
}

export function isMembershipLocked(lesson: LessonDto, proAccess: boolean) {
  return Boolean(lesson.isMembershipLocked ?? (!proAccess && lesson.requiredMembership === "PRO"));
}
