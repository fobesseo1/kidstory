//lib/utils/dateAudit.ts

export const getKoreanDateRange = () => {
  const now = new Date();
  const kstStart = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstStart.setHours(0, 0, 0, 0);
  const kstEnd = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kstEnd.setHours(23, 59, 59, 999);

  const utcStart = new Date(kstStart.getTime() - 9 * 60 * 60 * 1000);
  const utcEnd = new Date(kstEnd.getTime() - 9 * 60 * 60 * 1000);

  return { utcStart, utcEnd };
};
