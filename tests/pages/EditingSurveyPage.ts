import { Page, Locator, expect } from "@playwright/test";
import Survey from "@/model/Survey";
import Question, { QuestionType } from "@/model/Question";
import Answer from "@/model/Answer";

export class EditingSurveyPage {
  constructor(private page: Page) {}

  async fillSurvey(survey: Survey) {
    if (!survey.title || !survey.description || !survey.participants)
      throw new Error("Survey is not defined");

    await this.page.getByRole("textbox", { name: "Title" }).click();
    await this.page.getByRole("textbox", { name: "Title" }).fill(survey.title);
    await this.page
      .getByRole("textbox", { name: "Participants' emails" })
      .click();
    await this.page
      .getByRole("textbox", { name: "Participants' emails" })
      .fill(survey.participants?.join(", "));

    for (let index = 0; index < (survey.questions?.length ?? 0); index++) {
      const question = survey.questions![index];
      await this.addQuestion(question, index);
    }
  }

  async fillNumericSurvey(survey: Survey) {
    if (!survey.title || !survey.description || !survey.participants)
      throw new Error("Survey is not defined");

    await this.page.getByRole("textbox", { name: "Title" }).click();
    await this.page.getByRole("textbox", { name: "Title" }).fill(survey.title);
    await this.page
      .getByRole("textbox", { name: "Participants' emails" })
      .click();
    await this.page
      .getByRole("textbox", { name: "Participants' emails" })
      .fill(survey.participants?.join(", "));

    for (let index = 0; index < (survey.questions?.length ?? 0); index++) {
      const question = survey.questions![index];
      await this.addNumericQuestion(question, index);
    }
  }

  private async addQuestion(question: Question, index: number) {
    if (index !== 0)
      await this.page.getByRole("button", { name: "+ Add a question" }).click();
    const card = this.page.getByTestId(`${index}-question-card`);
    await this.fillQuestion(card, question);
  }

  private async addNumericQuestion(question: Question, index: number) {
    if (index === 0) {
      // Delete the default question first
      const card = this.page.getByTestId(`${index}-question-card`);
      await card.getByRole("button", { name: "Delete question" }).click();

      // Add numeric question from menu
      await this.page.getByRole("button", { name: "+ Add a question" }).click();
      // Click the chevron down button to open the menu
      await this.page
        .getByRole("button", { name: "Add prefilled question" })
        .click();
      await this.page.getByRole("menuitem", { name: "numeric" }).click();
    } else {
      // Add numeric question from menu
      await this.page.getByRole("button", { name: "+ Add a question" }).click();
      // Click the chevron down button to open the menu
      await this.page
        .getByRole("button", { name: "Add prefilled question" })
        .click();
      await this.page.getByRole("menuitem", { name: "numeric" }).click();
    }
    const card = this.page.getByTestId(`${index}-question-card`);
    await this.fillNumericQuestion(card, question);
  }

  private async fillQuestion(page: Locator, question: Question) {
    await page.getByPlaceholder("Question").click();
    await page.getByPlaceholder("Question").fill(question.title!);
    await page.getByPlaceholder("Description").click();
    await page.getByPlaceholder("Description").fill(question.description!);

    for (let index = 0; index < question.answers.length; index++) {
      const option = question.answers[index];
      await this.addOption(page, option, index);
    }
  }

  private async fillNumericQuestion(page: Locator, question: Question) {
    await page.getByPlaceholder("Question").click();
    await page.getByPlaceholder("Question").fill(question.title!);
    await page.getByPlaceholder("Description").click();
    await page.getByPlaceholder("Description").fill(question.description!);

    // Fill numeric configuration
    if (question.numericPrefix) {
      await page
        .getByRole("textbox", { name: "Prefix" })
        .fill(question.numericPrefix);
    }
    if (question.numericSuffix) {
      await page
        .getByRole("textbox", { name: "Suffix" })
        .fill(question.numericSuffix);
    }
    if (question.numericMin !== undefined) {
      await page
        .getByRole("spinbutton", { name: "Minimum" })
        .fill(question.numericMin.toString());
    }
    if (question.numericMax !== undefined) {
      await page
        .getByRole("spinbutton", { name: "Maximum" })
        .fill(question.numericMax.toString());
    }
  }

  private async addOption(page: Locator, option: Answer, index: number) {
    await page.getByRole("button", { name: "Add an option" }).click();
    const optionInput = page.getByPlaceholder("Option").nth(index);
    expect(optionInput).toBeVisible();
    await optionInput.click();
    await optionInput.fill(option.title);
    await page.press("Tab");
  }

  async save() {
    await this.page
      .getByRole("button", { name: "Save" })
      .click({ force: true });
    await this.page.waitForURL("/yours");
  }

  async delete() {
    const deleteButton = this.page.getByRole("button", {
      name: "Delete",
      exact: true,
    });
    await deleteButton.nth(-1).click();
    this.page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await this.page.waitForURL("/yours");
  }

  async publish() {
    await this.page.getByRole("button", { name: "Publish" }).click();
  }

  async verifySurveyContent(survey: Survey) {
    await expect(this.page.getByRole("textbox", { name: "Title" })).toHaveValue(
      survey.title!
    );
    const participants = survey.participants?.join(", ");
    const participantsInput = await this.page
      .getByRole("textbox", {
        name: "Participants' emails",
      })
      .inputValue();
    await expect(
      this.page.getByRole("textbox", { name: "Participants' emails" })
    ).toHaveValue(survey.participants?.join(", ") ?? "");

    let leftToFind = survey.questions ?? [];

    for (let index = 0; index < (survey.questions?.length ?? 0); index++) {
      const card = this.page.getByTestId(`${index}-question-card`);
      const title = await card.getByPlaceholder("Question").inputValue();
      const question = leftToFind.find((q: Question) => q.title === title);
      expect(question).toBeTruthy();
      leftToFind = leftToFind.filter((q: Question) => q !== question);
      await expect(card.getByPlaceholder("Description")).toHaveValue(
        question!.description!
      );

      let answersToFind = question!.answers;

      for (let index = 0; index < question!.answers.length; index++) {
        const option = await card
          .getByPlaceholder("Option")
          .nth(index)
          .inputValue();
        expect(
          answersToFind.find((a: Answer) => a.title === option)
        ).toBeTruthy();
        answersToFind = answersToFind.filter((a: Answer) => a.title !== option);
      }
    }

    expect(leftToFind.length).toBe(0);
  }

  async verifyNumericSurveyContent(survey: Survey) {
    await expect(this.page.getByRole("textbox", { name: "Title" })).toHaveValue(
      survey.title!
    );
    const participants = survey.participants?.join(", ");
    const participantsInput = await this.page
      .getByRole("textbox", {
        name: "Participants' emails",
      })
      .inputValue();
    await expect(
      this.page.getByRole("textbox", { name: "Participants' emails" })
    ).toHaveValue(survey.participants?.join(", ") ?? "");

    let leftToFind = survey.questions ?? [];

    for (let index = 0; index < (survey.questions?.length ?? 0); index++) {
      const card = this.page.getByTestId(`${index}-question-card`);
      const title = await card.getByPlaceholder("Question").inputValue();
      const question = leftToFind.find((q: Question) => q.title === title);
      expect(question).toBeTruthy();
      leftToFind = leftToFind.filter((q: Question) => q !== question);
      await expect(card.getByPlaceholder("Description")).toHaveValue(
        question!.description!
      );

      // Verify numeric configuration
      if (question!.isNumeric) {
        if (question!.numericPrefix) {
          await expect(
            card.getByRole("textbox", { name: "Prefix" })
          ).toHaveValue(question!.numericPrefix);
        }
        if (question!.numericSuffix) {
          await expect(
            card.getByRole("textbox", { name: "Suffix" })
          ).toHaveValue(question!.numericSuffix);
        }
        if (question!.numericMin !== undefined) {
          await expect(
            card.getByRole("spinbutton", { name: "Minimum" })
          ).toHaveValue(question!.numericMin.toString());
        }
        if (question!.numericMax !== undefined) {
          await expect(
            card.getByRole("spinbutton", { name: "Maximum" })
          ).toHaveValue(question!.numericMax.toString());
        }
      }
    }

    expect(leftToFind.length).toBe(0);
  }

  async update() {
    await this.page
      .getByRole("button", { name: "Update" })
      .click({ force: true });
    await this.page.waitForURL("/yours");
  }

  async deleteQuestion(index: number) {
    const card = this.page.getByTestId(`${index}-question-card`);
    await card.getByRole("button", { name: "Delete question" }).click();
  }

  async verifyQuestionCount(expected: number) {
    const cards = await this.page
      .locator('[data-testid$="-question-card"]')
      .count();
    expect(cards).toBe(expected);
  }

  async deleteAnswer(questionIndex: number, answerIndex: number) {
    const card = this.page.getByTestId(`${questionIndex}-question-card`);
    const answer = card.getByTestId("question-answer-option").nth(answerIndex);
    await expect(answer).toBeVisible();
    await answer.hover();
    await answer.getByLabel("Delete").click();
  }

  async verifyAnswerCount(questionIndex: number, expected: number) {
    const card = this.page.getByTestId(`${questionIndex}-question-card`);
    const answers = await card.getByTestId("question-answer-option").count();
    expect(answers).toBe(expected);
  }
}
