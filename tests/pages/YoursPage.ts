import { Page } from "@playwright/test";
import { SurveyStatus } from "@/model/SurveyStatus";
import { EditingSurveyPage } from "./EditingSurveyPage";
import { AnsweringSurveyPage } from "./AnsweringSurveyPage";
import { ViewingResultsPage } from "./ViewingResultsPage";

export class YoursPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("http://localhost:3000/yours");
  }

  async createNewSurvey() {
    await this.page.getByRole("button", { name: "New survey" }).click();
    await this.page.waitForURL("/survey");
    return new EditingSurveyPage(this.page);
  }

  async openSurvey(title: string) {
    const status = await this.getSurveyStatus(title);
    await this.getSurveyCard(title).click();
    await this.page.waitForURL("/survey/*");
    switch (status) {
      case SurveyStatus.PENDING:
        return new EditingSurveyPage(this.page);
      case SurveyStatus.ACTIVE:
        return new AnsweringSurveyPage(this.page);
      case SurveyStatus.CLOSED:
        return new ViewingResultsPage(this.page);
      default:
        throw new Error(`Unknown survey status: ${status}`);
    }
  }

  private async getSurveyStatus(title: string): Promise<SurveyStatus> {
    const card = this.getSurveyCard(title);

    if (await card.getByRole("button", { name: "Publish" }).isVisible()) {
      return SurveyStatus.PENDING;
    }
    if (await card.getByRole("button", { name: "Refuse" }).isVisible()) {
      return SurveyStatus.ACTIVE;
    }
    if (await card.getByRole("button", { name: "View results" }).isVisible()) {
      return SurveyStatus.CLOSED;
    }

    throw new Error(`Could not determine status for survey: ${title}`);
  }

  getSurveyCard(title: string) {
    return this.page.getByRole("link", { name: title });
  }

  async switchToParticipantView() {
    await this.page.getByRole("tab", { name: "as participant" }).click();
  }

  async switchToAdminView() {
    await this.page.getByRole("tab", { name: "as researcher" }).click();
  }

  async finishSurvey(title: string) {
    await this.getSurveyCard(title)
      .getByRole("button", { name: "Close and view results" })
      .click();
  }

  async publishSurvey(title: string) {
    await this.getSurveyCard(title)
      .getByRole("button", { name: "Publish" })
      .click();
  }
}
