import { Page, expect } from "@playwright/test";

export class ViewingResultsPage {
  constructor(private page: Page) {}

  async expectTitle(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }

  async expectQuestionResults(
    questionTitle: string,
    expectedResults: { [key: string]: number }
  ) {
    const question = this.page.getByText(questionTitle).locator("..");

    for (const [answer, count] of Object.entries(expectedResults)) {
      const resultText = question.getByText(answer + count);
      await expect(resultText).toBeVisible();
    }
  }
}
