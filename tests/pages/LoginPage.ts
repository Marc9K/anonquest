import { Page } from "@playwright/test";

export class LoginPage {
  static readonly profiles = [
    { button: "test sign in", email: "test@test.org" },
    { button: "test2 sign in", email: "2test@test.com" },
  ];

  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("http://localhost:3000/");
    await this.page.getByRole("link", { name: "Log In" }).click();
  }

  async signInAs(profile: number = 0) {
    await this.page
      .getByRole("button", { name: LoginPage.profiles[profile].button })
      .waitFor({ state: "attached" });
    await this.page
      .getByRole("button", { name: LoginPage.profiles[profile].button })
      .click({ force: true });
    await this.page.waitForURL("/yours");
  }

  async signOut() {
    await this.page.goto("/");
    await this.page.getByRole("link", { name: "Yours" }).click();
    await this.page.getByRole("button", { name: "Sign Out" }).click();
  }
}
