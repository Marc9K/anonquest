import Answer from "@/model/Answer";
import Question from "@/model/Question";
import Survey from "@/model/Survey";
import { test, expect, Page, Locator } from "@playwright/test";

function sampleSurvey(questions: number = 3, options: number = 3) {
  const sampleQuestions = [
    {
      question: "What is your favorite color?",
      description: "Choose one from the available colors.",
      options: ["Red", "Blue", "Green", "Yellow"],
    },
    {
      question: "What is your preferred contact method?",
      description: "Select how you would like to be contacted.",
      options: ["Email", "Phone", "SMS"],
    },
    {
      question: "Which days are you available?",
      description: "Select one or more days.",
      options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    },
    {
      question: "What is your highest level of education?",
      description: "Select the most applicable level.",
      options: ["High School", "Bachelor's", "Master's", "PhD"],
    },
    {
      question: "Which language do you prefer?",
      description: "Choose the language you are most comfortable with.",
      options: ["English", "Spanish", "French", "German"],
    },
    {
      question: "What is your employment status?",
      description: "Select your current employment situation.",
      options: ["Employed", "Unemployed", "Student", "Retired"],
    },
    {
      question: "How often do you exercise?",
      description: "Select the frequency that best describes your routine.",
      options: ["Daily", "A few times a week", "Rarely", "Never"],
    },
    {
      question: "What device do you use most?",
      description: "Select the device you use the most.",
      options: ["Smartphone", "Laptop", "Tablet", "Desktop"],
    },
    {
      question: "Which social media platforms do you use?",
      description: "Select all that apply.",
      options: ["Facebook", "Twitter", "Instagram", "LinkedIn", "None"],
    },
    {
      question: "What is your preferred mode of transport?",
      description: "Choose your primary method of transportation.",
      options: ["Car", "Bicycle", "Public Transit", "Walking"],
    },
  ].slice(0, questions);

  const sampleEmails = [
    "2test@test.com",
    "alice@gmail.com",
    "bob@gmail.com",
    "carol@gmail.com",
    "dave@gmail.com",
    "eve@gmail.com",
    "frank@gmail.com",
    "grace@gmail.com",
    "heidi@gmail.com",
    "ivan@gmail.com",
    "judy@gmail.com",
    "karen@gmail.com",
    "leo@gmail.com",
    "mallory@gmail.com",
    "nancy@gmail.com",
    "oscar@gmail.com",
    "peggy@gmail.com",
    "trent@gmail.com",
    "victor@gmail.com",
    "walter@yahoo.com",
    "zoe@outlook.com",
  ];

  const survey = new Survey();
  survey.title = "Test survey";
  survey.description = "Test survey description";
  survey.participants = sampleEmails;
  survey.questions = sampleQuestions.map((q) => {
    const question = new Question();
    question.title = q.question;
    question.description = q.description;
    question.answers = q.options.slice(0, options).map((a) => {
      const answer = new Answer();
      answer.title = a;
      return answer;
    });
    return question;
  });

  return survey;
}

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000");
});

async function logout(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: "Yours" }).click();
  await page.getByRole("button", { name: "Sign Out" }).click();
}

async function auth(page: Page, profile: number = 0) {
  const buttons = ["test sign in", "test2 sign in"];
  await page.goto("http://localhost:3000/");
  await page.getByRole("link", { name: "Log In" }).click();
  await page
    .getByRole("button", { name: buttons[profile] })
    .waitFor({ state: "attached" });
  await page
    .getByRole("button", { name: buttons[profile] })
    .click({ force: true });
  await page.waitForURL("/yours");
}

async function createSurvey(page: Page) {
  await page.goto("http://localhost:3000/yours");
  await page.getByRole("button", { name: "New survey" }).click();
  await page.waitForURL("/survey");
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

async function compare(page: Page, survey: Survey) {
  await expect(page.getByRole("textbox", { name: "Title" })).toHaveValue(
    survey.title!
  );
  await expect(
    page.getByRole("textbox", { name: "Participants' emails" })
  ).toHaveValue(survey.participants?.join(", ") ?? "");

  let leftToFind = survey.questions ?? [];

  for (let index = 0; index < (survey.questions?.length ?? 0); index++) {
    const card = page.getByTestId(`${index}-question-card`);
    const title = await card
      .getByRole("textbox", { name: "Question" })
      .inputValue();
    const question = leftToFind.find((question) => question.title === title);
    expect(question).toBeTruthy();
    leftToFind = leftToFind.filter((q) => q !== question);
    await expect(
      card.getByRole("textbox", { name: "Description" })
    ).toHaveValue(question!.description!);

    let answersToFond = question!.answers;

    for (let index = 0; index < question!.answers.length; index++) {
      const option = await card
        .getByRole("textbox", { name: "Option" })
        .nth(index)
        .inputValue();
      expect(
        answersToFond.find((answer) => answer.title === option)
      ).toBeTruthy();
      answersToFond = answersToFond.filter((answer) => answer.title !== option);
    }
  }

  expect(leftToFind.length).toBe(0);
}

test.describe.serial("creates and deletes a simple survey", () => {
  const survey = sampleSurvey(1, 2);
  test("create a survey", async ({ page }) => {
    await auth(page);

    await createSurvey(page);
    await fillSurvey(page, survey);
    await page.getByRole("button", { name: "Save" }).click({ force: true });
    await page.waitForURL("/yours");
    await expect(page.getByText(survey.title!)).toBeVisible();
  });
  test("check survey has saved", async ({ page }) => {
    await auth(page);

    await page.getByRole("link", { name: survey.title! }).click();
    await page.waitForURL("/survey/*");
    await compare(page, survey);
  });
  test("deletes survey", async ({ page }) => {
    await auth(page);

    await page.getByRole("link", { name: survey.title! }).click();
    const deleteButton = page.getByRole("button", {
      name: "Delete",
      exact: true,
    });
    await deleteButton.nth(-1).click();
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await page.waitForURL("/yours");
    await expect(
      page.getByRole("link", { name: survey.title! })
    ).not.toBeVisible();
    await expect(page).toHaveURL(/\/yours$/);
  });
});

test.describe.serial("creates, assigns and deletes a simple survey", () => {
  const survey = sampleSurvey(1, 2);
  test("create a survey", async ({ page }) => {
    await auth(page);

    await createSurvey(page);
    await fillSurvey(page, survey);
    await page.getByRole("button", { name: "Save" }).click({ force: true });
    await page.waitForURL("/yours");
    await expect(page.getByText(survey.title!)).toBeVisible();
  });
  test("check survey has saved", async ({ page }) => {
    await auth(page);
    await expect(page.getByRole("button", { name: "Publish" })).toBeVisible();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByRole("button", { name: "Close and view results" })).toBeVisible();
  });
  test("check survey is accessable to assignees", async ({ page }) => {
    await auth(page, 1);
    await page.getByRole("tab", { name: "as participant" }).click();
    await page.getByRole("link", { name: survey.title! }).click();
    await expect(page.getByText(survey.title!)).toBeVisible();
    await expect(page.getByText("By test@test.org")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
  });
  test("deletes survey", async ({ page }) => {
    await auth(page);

    await page.getByRole("link", { name: survey.title! }).click();
    const deleteButton = page.getByRole("button", {
      name: "Delete",
      exact: true,
    });
    await deleteButton.nth(-1).click();
    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await expect(
      page.getByRole("link", { name: survey.title! })
    ).not.toBeVisible();
    await expect(page).toHaveURL(/\/yours$/);
  });
});
