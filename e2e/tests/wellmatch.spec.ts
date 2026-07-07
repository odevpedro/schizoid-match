import { test, expect } from '@playwright/test';

test.describe('WellMatch E2E Happy Path', () => {
  const emailA = `user_a_${Date.now()}@test.com`;
  const emailB = `user_b_${Date.now()}@test.com`;
  const password = 'Test@123456';
  const nameA = 'Alice';
  const nameB = 'Bob';

  async function registerUser(page: any, email: string, name: string) {
    await page.goto('/');
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i]', { timeout: 10000 });
    await page.fill('input[type="email"], input[placeholder*="email" i]', email);
    await page.fill('input[type="password"], input[placeholder*="senha" i], input[placeholder*="password" i]', password);
    await page.fill('input[placeholder*="nome" i], input[placeholder*="name" i]', name);
    await page.click('button:has-text("Criar conta"), button:has-text("Register"), button:has-text("Registrar")');
    await page.waitForURL(/onboarding|Onboarding|intro/i, { timeout: 15000 });
  }

  async function completeOnboarding(page: any) {
    // Step 1: Intro - click continuar/começar
    await page.waitForTimeout(2000);
    const continueBtn = page.locator('button:has-text("Continuar"), button:has-text("Começar"), button:has-text("Next"), button:has-text("Próximo")');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }

    // Step 2: Intent - select friendship
    const friendshipChip = page.locator('text=Amizade, text=friendship, text=Amizades');
    if (await friendshipChip.isVisible()) {
      await friendshipChip.click();
      await page.waitForTimeout(500);
    }
    let next = page.locator('button:has-text("Continuar"), button:has-text("Next"), button:has-text("Próximo")');
    if (await next.isVisible()) await next.click();
    await page.waitForTimeout(1000);

    // Step 3: Goals - select some
    const goalChip = page.locator('text=caminhar, text=walk, text=Andar, text=Caminhar').first();
    if (await goalChip.isVisible()) {
      await goalChip.click();
      await page.waitForTimeout(500);
    }
    next = page.locator('button:has-text("Continuar"), button:has-text("Next"), button:has-text("Próximo")');
    if (await next.isVisible()) await next.click();
    await page.waitForTimeout(1000);

    // Step 4: Activities
    const activityChip = page.locator('text=yoga, text=caminhada, text=walking').first();
    if (await activityChip.isVisible()) {
      await activityChip.click();
      await page.waitForTimeout(500);
    }
    next = page.locator('button:has-text("Continuar"), button:has-text("Next"), button:has-text("Próximo")');
    if (await next.isVisible()) await next.click();
    await page.waitForTimeout(1000);

    // Step 5: Availability
    const availChip = page.locator('text=manhã, text=morning, text=tarde, text=afternoon').first();
    if (await availChip.isVisible()) {
      await availChip.click();
      await page.waitForTimeout(500);
    }
    next = page.locator('button:has-text("Continuar"), button:has-text("Next"), button:has-text("Próximo")');
    if (await next.isVisible()) await next.click();
    await page.waitForTimeout(1000);

    // Step 6: Intensity
    const intensityChip = page.locator('text=moderado, text=moderate').first();
    if (await intensityChip.isVisible()) {
      await intensityChip.click();
      await page.waitForTimeout(500);
    }
    next = page.locator('button:has-text("Continuar"), button:has-text("Next"), button:has-text("Próximo")');
    if (await next.isVisible()) await next.click();
    await page.waitForTimeout(1000);

    // Step 7: Privacy
    const privacyToggle = page.locator('input[type="checkbox"], input[type="switch"], [role="switch"]').first();
    if (await privacyToggle.isVisible()) {
      await privacyToggle.click();
      await page.waitForTimeout(500);
    }
    next = page.locator('button:has-text("Continuar"), button:has-text("Next"), button:has-text("Próximo")');
    if (await next.isVisible()) await next.click();
    await page.waitForTimeout(1000);

    // Step 8: Source
    const sourceBtn = page.locator('text=manual, text=Manual').first();
    if (await sourceBtn.isVisible()) {
      await sourceBtn.click();
      await page.waitForTimeout(500);
    }
    next = page.locator('button:has-text("Continuar"), button:has-text("Next"), button:has-text("Próximo"), button:has-text("Concluir")');
    if (await next.isVisible()) await next.click();
    await page.waitForTimeout(1000);

    // Step 9: Completed - click final button
    const finishBtn = page.locator('button:has-text("Concluir"), button:has-text("Começar"), button:has-text("Ir para o app")');
    if (await finishBtn.isVisible()) {
      await finishBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  async function loginUser(page: any, email: string) {
    await page.goto('/');
    await page.waitForSelector('input[type="email"], input[placeholder*="email" i]', { timeout: 10000 });
    await page.fill('input[type="email"], input[placeholder*="email" i]', email);
    await page.fill('input[type="password"], input[placeholder*="senha" i], input[placeholder*="password" i]', password);
    await page.click('button:has-text("Entrar"), button:has-text("Login"), button:has-text("Log in")');
    await page.waitForTimeout(5000);
  }

  async function goToMatchScreen(page: any) {
    const matchTab = page.locator('text=Match, text=Explorar, text=Descobrir').first();
    if (await matchTab.isVisible()) {
      await matchTab.click();
      await page.waitForTimeout(3000);
    }
  }

  async function swipeRightOnFirstUser(page: any) {
    await page.waitForTimeout(2000);
    const likeBtn = page.locator('button[aria-label*="like" i], button[aria-label*="curtir" i], [data-testid="swipe-like"], button:has-text("Like"), button:has-text("Curtir")').first();
    if (await likeBtn.isVisible()) {
      await likeBtn.click();
      await page.waitForTimeout(2000);
    }
  }

  async function navigateToMessages(page: any) {
    const messagesTab = page.locator('text=Mensagens, text=Messages, text=Chat').first();
    if (await messagesTab.isVisible()) {
      await messagesTab.click();
      await page.waitForTimeout(3000);
    }
  }

  async function openFirstChat(page: any) {
    const firstMatch = page.locator('[data-testid="match-item"], [data-testid="conversation-item"], .match-item, .conversation-item').first();
    if (await firstMatch.isVisible()) {
      await firstMatch.click();
      await page.waitForTimeout(2000);
    } else {
      // Try clicking any clickable match/conversation row
      const anyConversation = page.locator('text=Alice, text=Bob').first();
      if (await anyConversation.isVisible()) {
        await anyConversation.click();
        await page.waitForTimeout(2000);
      }
    }
  }

  async function sendMessage(page: any, text: string) {
    const input = page.locator('input[placeholder*="mensagem" i], input[placeholder*="message" i], textarea[placeholder*="mensagem" i], textarea[placeholder*="message" i]').first();
    if (await input.isVisible()) {
      await input.fill(text);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }
  }

  test('Complete happy path: register -> onboard -> match -> chat', async ({ browser }) => {
    const context = await browser.newContext();
    const pageA = await context.newPage();

    // 1. Register first user
    await registerUser(pageA, emailA, nameA);

    // 2. Complete onboarding for first user
    await completeOnboarding(pageA);

    // 3. Logout
    const logoutBtn = pageA.locator('button:has-text("Sair"), button:has-text("Logout"), button:has-text("Log out")').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await pageA.waitForTimeout(2000);
    }

    // 4. Register second user in a new page
    const pageB = await context.newPage();
    await registerUser(pageB, emailB, nameB);

    // 5. Complete onboarding for second user
    await completeOnboarding(pageB);

    // 6. Go to match screen for second user
    await goToMatchScreen(pageB);

    // 7. Swipe right on the first user
    await swipeRightOnFirstUser(pageB);

    // 8. Logout second user
    const logoutBtnB = pageB.locator('button:has-text("Sair"), button:has-text("Logout"), button:has-text("Log out")').first();
    if (await logoutBtnB.isVisible()) {
      await logoutBtnB.click();
      await pageB.waitForTimeout(2000);
    }

    // 9. Login as first user
    await loginUser(pageA, emailA);

    // 10. Go to match screen
    await goToMatchScreen(pageA);

    // 11. Swipe right on the second user (creating a match)
    await swipeRightOnFirstUser(pageA);

    // 12. Navigate to messages
    await navigateToMessages(pageA);

    // 13. Verify match appears in messages list
    const matchText = pageA.locator(`text=${nameB}, text=Bob`).first();
    await expect(matchText).toBeVisible({ timeout: 10000 });

    // 14. Open chat and send a message
    await openFirstChat(pageA);
    const messageText = `Oi, tudo bem? ${Date.now()}`;
    await sendMessage(pageA, messageText);

    // 15. Verify message appears in chat
    const sentMessage = pageA.locator(`text=${messageText}`).first();
    await expect(sentMessage).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});
