import { Page, expect } from "@playwright/test";

export class AnsweringSurveyPage {
  constructor(public page: Page) {}

  async expectTitle(title: string) {
    await expect(this.page.getByText(title)).toBeVisible();
  }

  async expectOwnerEmail(email: string) {
    await expect(this.page.getByText(`By ${email}`)).toBeVisible();
  }

  get submitButton() {
    return this.page.getByRole("button", { name: "Submit" });
  }

  async expectSubmitButton() {
    await expect(this.submitButton).toBeVisible();
  }

  //   TODO: Add answerQuestion
  //   async answerQuestion(questionTitle: string, answerTitle: string) {
  //   }

  async submit() {
    await this.submitButton.click();
  }
}
