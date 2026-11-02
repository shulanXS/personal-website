/**
 * Formatting of the numbers that describe a work.
 *
 * A Chinese text has no words to count — it has characters — so the length
 * of a work is a character count, and the way that count is written
 * differs between the two languages: Chinese groups it by ten thousands
 * ("2.6 万"), English separates it by thousands ("26,000").
 */
export function formatCharacterCount(count: number, uiLang: string): string {
  if (uiLang === "zh-CN") {
    if (count >= 10000) {
      const tens = count / 10000;
      // One decimal place is enough to be useful and not enough to be noisy.
      return `${Math.round(tens * 10) / 10} 万字`;
    }
    return `${count} 字`;
  }
  return `${count.toLocaleString("en-US")} characters`;
}
