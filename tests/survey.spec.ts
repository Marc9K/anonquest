import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { YoursPage } from "./pages/YoursPage";
import { EditingSurveyPage } from "./pages/EditingSurveyPage";
import { AnsweringSurveyPage } from "./pages/AnsweringSurveyPage";
import { ViewingResultsPage } from "./pages/ViewingResultsPage";
import Survey from "@/model/Survey";
import Question, { QuestionType } from "@/model/Question";
import Answer from "@/model/Answer";

function sampleSurvey(questions: number = 3, options: number = 3): Survey {
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
  ].slice(0, questions);

  const sampleEmails = [
    "2test@test.com",
    "alice@gmail.com",
    "bob@gmail.com",
    "carol@gmail.com",
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

function sampleSurveyWithNumeric(): Survey {
  const sampleEmails = [
    "2test@test.com",
    "alice@gmail.com",
    "bob@gmail.com",
    "carol@gmail.com",
  ];

  const survey = new Survey();
  survey.title = "Test survey with numeric";
  survey.description = "Test survey with numeric questions";
  survey.participants = sampleEmails;

  // Create 4 numeric questions with different configurations
  const numericQuestions = [
    {
      title: "How many years of experience do you have?",
      description: "Enter your years of experience",
      type: QuestionType.NUMERIC,
      prefix: "",
      suffix: "years",
      min: undefined,
      max: undefined,
    },
    {
      title: "What is your minimum salary requirement?",
      description: "Enter your minimum salary",
      type: QuestionType.NUMERIC,
      prefix: "$",
      suffix: "",
      min: 30000,
      max: undefined,
    },
    {
      title: "How many hours per week do you work?",
      description: "Enter your weekly hours",
      type: QuestionType.NUMERIC,
      prefix: "",
      suffix: "hours",
      min: undefined,
      max: 80,
    },
    {
      title: "What is your age?",
      description: "Enter your age",
      type: QuestionType.NUMERIC,
      prefix: "",
      suffix: "years old",
      min: 18,
      max: 65,
    },
  ];

  survey.questions = numericQuestions.map((q) => {
    const question = new Question();
    question.title = q.title;
    question.description = q.description;
    question.type = q.type;
    question.numericPrefix = q.prefix;
    question.numericSuffix = q.suffix;
    question.numericMin = q.min;
    question.numericMax = q.max;
    question.answers = []; // Numeric questions start with no predefined answers
    return question;
  });

  return survey;
}

test.describe.serial("Survey lifecycle", () => {
  const survey = sampleSurvey();

  test("create a survey", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(0);

    const yoursPage = new YoursPage(page);
    const editingPage = await yoursPage.createNewSurvey();
    await editingPage.fillSurvey(survey);
    await editingPage.save();
    await expect(yoursPage.getSurveyCard(survey.title!)).toBeVisible();
  });

  test("verify survey content", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(0);

    const yoursPage = new YoursPage(page);
    const editingPage = (await yoursPage.openSurvey(
      survey.title!
    )) as EditingSurveyPage;
    await editingPage.verifySurveyContent(survey);
  });

  test("researcher can update survey: delete question, delete answer, reorder", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(0);

    const yoursPage = new YoursPage(page);
    let editingPage = (await yoursPage.openSurvey(
      survey.title!
    )) as EditingSurveyPage;

    const initialQuestionCount = survey.questions!.length;
    await editingPage.deleteQuestion(0);
    survey.questions = survey.questions!.slice(1);
    await editingPage.update();
    editingPage = (await yoursPage.openSurvey(
      survey.title!
    )) as EditingSurveyPage;
    await editingPage.verifyQuestionCount(initialQuestionCount - 1);

    const questionToEdit = 0;
    const initialAnswerCount = survey.questions![questionToEdit].answers.length;
    await editingPage.deleteAnswer(questionToEdit, 0);
    survey.questions![questionToEdit].answers =
      survey.questions![questionToEdit].answers!.slice(1);
    await editingPage.update();
    editingPage = (await yoursPage.openSurvey(
      survey.title!
    )) as EditingSurveyPage;
    await editingPage.verifyAnswerCount(questionToEdit, initialAnswerCount - 1);

    // TODO:Drag to reorder questions
  });

  test("publish survey", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(0);

    const yoursPage = new YoursPage(page);
    await yoursPage.publishSurvey(survey.title!);
    await expect(
      yoursPage
        .getSurveyCard(survey.title!)
        .getByRole("button", { name: "View results" })
    ).toBeVisible();
  });

  test("participant can access", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(1);

    const yoursPage = new YoursPage(page);
    await yoursPage.switchToParticipantView();
    await expect(
      yoursPage
        .getSurveyCard(survey.title!)
        .getByRole("button", { name: "Refuse" })
    ).toBeVisible();
    const answeringPage = (await yoursPage.openSurvey(
      survey.title!
    )) as AnsweringSurveyPage;
    await answeringPage.expectTitle(survey.title!);
    await answeringPage.expectOwnerEmail(LoginPage.profiles[0].email);
    await answeringPage.expectSubmitButton();
    for (let i = 0; i < survey.questions!.length; i++) {
      const question = survey.questions![i];
      const questionCard = answeringPage.page.getByTestId(`question-card-${i}`);
      await expect(questionCard.getByText(question.title!)).toBeVisible();
      const combobox = questionCard.getByRole("combobox");
      const options = await combobox.evaluate((select) =>
        Array.from((select as HTMLSelectElement).options)
          .map((option) => option.value)
          .filter((option) => option !== "")
      );
      for (const answer of question.answers!) {
        expect(options).toContain(answer.title!);
      }
      await combobox.selectOption(options[0]);
    }
    await answeringPage.submit();
  });

  test("researcher can view results", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(0);

    const yoursPage = new YoursPage(page);
    await yoursPage.switchToAdminView();
    await yoursPage.finishSurvey(survey.title!);
    await expect(
      yoursPage
        .getSurveyCard(survey.title!)
        .getByRole("button", { name: "View results" })
    ).toBeVisible();
    const viewingPage = (await yoursPage.openSurvey(
      survey.title!
    )) as ViewingResultsPage;
    await viewingPage.expectTitle(survey.title!);
    for (let i = 0; i < survey.questions!.length; i++) {
      const question = survey.questions![i];
      const results = question.answers!.reduce((acc, answer) => {
        acc[answer.title!] = 0;
        return acc;
      }, {} as Record<string, number>);
      results[question.answers![0].title!] = 1;
      await viewingPage.expectQuestionResults(question.title!, results);
    }
  });
});

test.describe.serial("Numeric survey lifecycle", () => {
  const numericSurvey = sampleSurveyWithNumeric();

  test("create a numeric survey", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(0);

    const yoursPage = new YoursPage(page);
    const editingPage = await yoursPage.createNewSurvey();
    await editingPage.fillNumericSurvey(numericSurvey);
    await editingPage.save();
    await expect(yoursPage.getSurveyCard(numericSurvey.title!)).toBeVisible();
  });

  test("verify numeric survey content", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(0);

    const yoursPage = new YoursPage(page);
    const editingPage = (await yoursPage.openSurvey(
      numericSurvey.title!
    )) as EditingSurveyPage;
    await editingPage.verifyNumericSurveyContent(numericSurvey);
  });

  test("publish numeric survey", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(0);

    const yoursPage = new YoursPage(page);
    await yoursPage.publishSurvey(numericSurvey.title!);
    await expect(
      yoursPage
        .getSurveyCard(numericSurvey.title!)
        .getByRole("button", { name: "View results" })
    ).toBeVisible();
  });

  test("participant can access numeric survey", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(1);

    const yoursPage = new YoursPage(page);
    await yoursPage.switchToParticipantView();
    await expect(
      yoursPage
        .getSurveyCard(numericSurvey.title!)
        .getByRole("button", { name: "Refuse" })
    ).toBeVisible();
    const answeringPage = (await yoursPage.openSurvey(
      numericSurvey.title!
    )) as AnsweringSurveyPage;
    await answeringPage.expectTitle(numericSurvey.title!);
    await answeringPage.expectOwnerEmail(LoginPage.profiles[0].email);
    await answeringPage.expectSubmitButton();

    // Test numeric questions
    for (let i = 0; i < numericSurvey.questions!.length; i++) {
      const question = numericSurvey.questions![i];
      const questionCard = answeringPage.page.getByTestId(`question-card-${i}`);
      await expect(questionCard.getByText(question.title!)).toBeVisible();

      // Check for numeric input
      const numericInput = questionCard.getByTestId(
        `numeric-input-${question.title}`
      );
      await expect(numericInput).toBeVisible();

      // Check prefix and suffix if present
      if (question.numericPrefix) {
        await expect(
          questionCard.getByText(question.numericPrefix)
        ).toBeVisible();
      }
      if (question.numericSuffix) {
        await expect(
          questionCard.getByText(question.numericSuffix)
        ).toBeVisible();
      }

      // Enter a valid number
      const testValue =
        question.numericMin !== undefined ? question.numericMin + 5 : 25;
      await numericInput.fill(testValue.toString());
    }
    await answeringPage.submit();
  });

  test("researcher can view numeric results", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signInAs(0);

    const yoursPage = new YoursPage(page);
    await yoursPage.switchToAdminView();
    await yoursPage.finishSurvey(numericSurvey.title!);
    await expect(
      yoursPage
        .getSurveyCard(numericSurvey.title!)
        .getByRole("button", { name: "View results" })
    ).toBeVisible();
    const viewingPage = (await yoursPage.openSurvey(
      numericSurvey.title!
    )) as ViewingResultsPage;
    await viewingPage.expectTitle(numericSurvey.title!);

    // Verify numeric results
    for (let i = 0; i < numericSurvey.questions!.length; i++) {
      const question = numericSurvey.questions![i];
      const testValue =
        question.numericMin !== undefined ? question.numericMin + 5 : 25;
      const results = { [testValue.toString()]: 1 };
      await viewingPage.expectQuestionResults(question.title!, results);
    }
  });
});
