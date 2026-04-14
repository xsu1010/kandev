import { test, expect } from "../../fixtures/test-base";

test.describe("Agent profile deletion", () => {
  test("deleting profile with no active sessions succeeds immediately", async ({
    testPage,
    apiClient,
  }) => {
    test.setTimeout(60_000);

    // Create a test profile to delete
    const { agents } = await apiClient.listAgents();
    const agent = agents[0];
    const profile = await apiClient.createAgentProfile(agent.id, "Delete Me", {
      model: agent.profiles[0].model,
    });

    // Navigate to profile settings page
    await testPage.goto(`/settings/agents/${agent.name}/profiles/${profile.id}`);

    // Wait for the delete card to load (the card title is "Delete profile")
    await expect(testPage.getByText("Delete profile", { exact: true })).toBeVisible({
      timeout: 15_000,
    });

    // Click the delete button inside the delete card
    await testPage.getByRole("button", { name: "Delete", exact: true }).click();

    // Confirmation dialog should appear
    const dialog = testPage.getByRole("alertdialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText("Are you sure you want to delete this profile?")).toBeVisible();

    // Confirm deletion
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();

    // Should redirect to agents settings page (no conflict since no active sessions)
    await expect(testPage).toHaveURL(/\/settings\/agents$/, { timeout: 15_000 });
  });

  test("deleting profile with active task shows conflict dialog and allows cancel", async ({
    testPage,
    apiClient,
    seedData,
  }) => {
    test.setTimeout(90_000);

    // Create a test profile
    const { agents } = await apiClient.listAgents();
    const agent = agents[0];
    const profile = await apiClient.createAgentProfile(agent.id, "Busy Profile", {
      model: agent.profiles[0].model,
    });

    // Create a task using this profile (this creates an active session)
    await apiClient.createTaskWithAgent(
      seedData.workspaceId,
      "Active Task For Profile",
      profile.id,
      {
        description: 'e2e:message("profile test")',
        workflow_id: seedData.workflowId,
        workflow_step_id: seedData.startStepId,
        repository_ids: [seedData.repositoryId],
      },
    );

    // Navigate to profile settings page
    await testPage.goto(`/settings/agents/${agent.name}/profiles/${profile.id}`);

    // Wait for the delete card to load (the card title is "Delete profile")
    await expect(testPage.getByText("Delete profile", { exact: true })).toBeVisible({
      timeout: 15_000,
    });

    // Click the delete button
    await testPage.getByRole("button", { name: "Delete", exact: true }).click();

    // Confirmation dialog should appear first
    const dialog = testPage.getByRole("alertdialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText("Are you sure you want to delete this profile?")).toBeVisible();

    // Confirm to proceed with deletion attempt
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();

    // The dialog should update to show the conflict (active sessions)
    await expect(dialog.getByText("Active Task For Profile")).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText("This profile is currently in use")).toBeVisible();

    // Cancel the deletion
    await dialog.getByRole("button", { name: "Cancel" }).click();

    // Dialog should close and we should still be on the profile page
    await expect(dialog).not.toBeVisible();
    await expect(testPage).toHaveURL(
      new RegExp(`/settings/agents/${agent.name}/profiles/${profile.id}`),
    );
  });

  test("force-deleting profile with active task succeeds after confirmation", async ({
    testPage,
    apiClient,
    seedData,
  }) => {
    test.setTimeout(90_000);

    // Create a test profile
    const { agents } = await apiClient.listAgents();
    const agent = agents[0];
    const profile = await apiClient.createAgentProfile(agent.id, "ForceRemove Profile", {
      model: agent.profiles[0].model,
    });

    // Create a task using this profile
    await apiClient.createTaskWithAgent(seedData.workspaceId, "Task For Force Delete", profile.id, {
      description: 'e2e:message("force delete test")',
      workflow_id: seedData.workflowId,
      workflow_step_id: seedData.startStepId,
      repository_ids: [seedData.repositoryId],
    });

    // Navigate to profile settings page
    await testPage.goto(`/settings/agents/${agent.name}/profiles/${profile.id}`);

    // Wait for the delete card to load (the card title is "Delete profile")
    await expect(testPage.getByText("Delete profile", { exact: true })).toBeVisible({
      timeout: 15_000,
    });

    // Click the delete button
    await testPage.getByRole("button", { name: "Delete", exact: true }).click();

    // Confirmation dialog should appear first
    const dialog = testPage.getByRole("alertdialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });

    // Confirm to proceed with deletion attempt
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();

    // Dialog should update to show the conflict
    await expect(dialog.getByText("Task For Force Delete")).toBeVisible({ timeout: 10_000 });

    // Confirm force deletion
    await dialog.getByRole("button", { name: "Delete Anyway" }).click();

    // Should redirect to agents settings page
    await expect(testPage).toHaveURL(/\/settings\/agents$/, { timeout: 15_000 });
  });
});
