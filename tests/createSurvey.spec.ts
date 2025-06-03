import Answer from "@/model/Answer";
import Question from "@/model/Question";
import Survey from "@/model/Survey";
import { test, expect, Page, Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
});

async function auth(page: Page) {
  await page.goto("http://localhost:3000/");
  await page.getByRole("link", { name: "Log In" }).click();
  await page.getByRole("button", { name: "test sign in" }).click();
}

async function createSurvey(page: Page) {
  await page.goto("http://localhost:3000/yours");
  await page.getByRole("button", { name: "New survey" }).click();
}

async function addQuestion(page: Page, question: Question, index: number) {
  await page.getByRole("button", { name: "+ Add a question" }).click();
  const card = await page.getByTestId(`${index}-question-card`);
  await fillQuestion(card, question);
}

async function fillQuestion(page: Locator, question: Question) {
  await page.getByRole("textbox", { name: "Question" }).click();
  await page.getByRole("textbox", { name: "Question" }).fill(question.title!);
  await page.getByRole("textbox", { name: "Description" }).click();
  await page
    .getByRole("textbox", { name: "Description" })
    .fill(question.description!);

  for (let index = 0; index < question.answers.length; index++) {
    const option = question.answers[index];
    await addOption(page, option, index);
  }
}

async function addOption(page: Locator, option: Answer, index: number) {
  await page.getByRole("button", { name: "+ Add an option" }).click();
  await page.getByRole("textbox", { name: "Option" }).nth(index).click();
  await page
    .getByRole("textbox", { name: "Option" })
    .nth(index)
    .fill(option.title);
  await page.press("Tab");
  //   await page.getByRole("textbox", { name: "Option" }).press("Enter");
  // await page
  //   .locator("form")
  //   .filter({ hasText: "New surveyTitle*Participants" })
  //   .click();
}

async function fillSurvey(page: Page, survey: Survey) {
  if (!survey.title || !survey.description || !survey.participants)
    throw new Error("Survey is not defined");
  await page.getByRole("textbox", { name: "Title" }).click();
  await page.getByRole("textbox", { name: "Title" }).fill(survey.title);
  await page.getByRole("textbox", { name: "Participants' emails" }).click();
  await page
    .getByRole("textbox", { name: "Participants' emails" })
    .fill(survey.participants?.join(", "));

  for (let index = 0; index < (survey.questions?.length ?? 0); index++) {
    const question = survey.questions![index];

    await addQuestion(page, question, index);
  }
}

function sampleSurvey() {
  const survey = new Survey();
  survey.title = "Test survey";
  survey.description = "Test survey description";
  survey.participants = ["XXXXXXXXXXXXX"];
  survey.questions = ["who", "why", "how"].map((q) => {
    const question = new Question();
    question.title = q;
    question.description = q + "Desctiprion";
    question.answers = ["Underaged", "Adult", "Senior"].map((a) => {
      const answer = new Answer();
      answer.title = q + a;
      return answer;
    });
    return question;
  });

  return survey;
}

test("create a survey", async ({ page }) => {
  await auth(page);

  const survey = sampleSurvey();

  await createSurvey(page);
  await fillSurvey(page, survey);
  await page
    .getByRole("button", { name: "Create Survey" })
    .click({ force: true });
  await expect(page.getByText(survey.title!)).toBeVisible();
});

async function compare(page: Page, survey: Survey) {
  await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
    survey.title!
  );
  await expect(
    page.getByRole("textbox", { name: "Participants' emails" })
  ).toHaveValue(survey.participants?.join(", ") ?? "");

  for (let index = 0; index < (survey.questions?.length ?? 0); index++) {
    const card = await page.getByTestId(`${index}-question-card`);
    const title = await page
      .getByRole("textbox", { name: "Question" })
      .inputValue();
    const question = survey.questions?.find(
      (question) => question.title === title
    );
    expect(question).toBeTruthy();
    await expect(
      card.getByRole("textbox", { name: "Description" })
    ).toHaveValue(question!.description!);

    for (let index = 0; index < question!.answers.length; index++) {
      const option = await page
        .getByRole("textbox", { name: "Option" })
        .inputValue();
      expect(
        question!.answers.find((answer) => answer.title === option)
      ).toBeTruthy();
    }
  }
}

test("check survey has saved", async ({ page }) => {
  await auth(page);

  const survey = sampleSurvey();

  await page.getByRole("link", { name: survey.title! }).click();
  await compare(page, survey);
});
