import { Context } from 'koa';
import { prisma } from '../../../../libs/db/src';

export async function getStats(ctx: Context) {
  const [byDifficulty, reviewedByDifficulty, reviewed, total] = await Promise.all([
    prisma.question.groupBy({
      by: ['targetDifficultyLabel'],
      _count: { id: true },
    }),
    prisma.question.groupBy({
      by: ['targetDifficultyLabel'],
      where: { reviews: { some: {} } },
      _count: { id: true },
    }),
    prisma.question.count({
      where: { reviews: { some: {} } },
    }),
    prisma.question.count(),
  ]);

  const reviewedMap: Record<string, number> = {};
  for (const row of reviewedByDifficulty) {
    reviewedMap[row.targetDifficultyLabel] = row._count.id;
  }

  const byDifficultyDetail: Record<string, { total: number; reviewed: number }> = {};
  for (const row of byDifficulty) {
    byDifficultyDetail[row.targetDifficultyLabel] = {
      total: row._count.id,
      reviewed: reviewedMap[row.targetDifficultyLabel] ?? 0,
    };
  }

  ctx.body = {
    data: {
      total,
      reviewed,
      byDifficulty: byDifficultyDetail,
    },
  };
}
