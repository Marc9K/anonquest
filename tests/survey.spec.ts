import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { YoursPage } from "./pages/YoursPage";
import { EditingSurveyPage } from "./pages/EditingSurveyPage";
import { AnsweringSurveyPage } from "./pages/AnsweringSurveyPage";
import { ViewingResultsPage } from "./pages/ViewingResultsPage";
import Survey from "@/model/Survey";
import Question from "@/model/Question";
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

test.describe.serial("Survey lifecycle", () => {
  const survey = sampleSurvey(1, 2);

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
    for (const question of survey.questions!) {
      await expect(answeringPage.page.getByText(question.title!)).toBeVisible();
      const options = await answeringPage.page
        .getByRole("combobox")
        .evaluate((select) =>
          Array.from((select as HTMLSelectElement).options)
            .map((option) => option.value)
            .filter((option) => option !== "")
        );
      for (const answer of question.answers!) {
        expect(options).toContain(answer.title!);
      }
      await answeringPage.page.getByRole("combobox").selectOption(options[0]);
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
    await viewingPage.expectQuestionResults(survey.questions![0].title!, {
      Red: 1,
      Blue: 0,
    });
  });
});
