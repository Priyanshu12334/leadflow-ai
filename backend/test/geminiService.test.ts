import assert from "node:assert/strict";
import test from "node:test";
import { buildLeadEmailPrompt, generateEmail, parseGeneratedEmail, validateGeneratedEmail } from "../src/services/geminiService.js";
import type { Lead } from "../src/types/domain.js";

function testLead(overrides: Partial<Lead> = {}): Lead {
  return {
    rowNumber: 2,
    name: "Maya Chen",
    email: "maya@example.test",
    company: "Northstar Robotics",
    website: "",
    context: "",
    status: "New",
    draftId: "",
    messageId: "",
    threadId: "",
    statusColumn: null,
    draftIdColumn: null,
    messageIdColumn: null,
    threadIdColumn: null,
    spreadsheetId: "sheet-id-123456789",
    sheetName: "Sheet1",
    validationErrors: [],
    ...overrides,
  };
}

test("email prompt includes actual non-empty sheet labels and values with context-aware, low-pressure guidance", () => {
  const prompt = buildLeadEmailPrompt(testLead({
    sheetData: [
      { column: "Name", value: "Maya Chen" },
      { column: "Company", value: "Northstar Robotics" },
      { column: "Product Interest", value: "Inventory analytics" },
      { column: "Lead Source", value: "Industry webinar" },
      { column: "Notes", value: "Comparing reporting options" },
    ],
  }));

  assert.match(prompt, /"column":"Product Interest","value":"Inventory analytics"/);
  assert.match(prompt, /"column":"Lead Source","value":"Industry webinar"/);
  assert.match(prompt, /Keep every next step in writing by email/);
  assert.match(prompt, /Never propose or request a phone call, video call, meeting, demo, chat, or any meeting duration/);
  assert.match(prompt, /if a specific product or service interest is clear, offer relevant information or options/);
  assert.match(prompt, /has no project-price catalogue or quote calculator/);
  assert.match(prompt, /If the row lacks useful context, write a neutral follow-up/);
  assert.match(prompt, /Never invent a conversation, requirement, promise, result, discount/);
  assert.match(prompt, /Best regards,.*line break and "The Team"/);
  assert.match(prompt, /Never use a placeholder such as \[Your Name\]/);
});

test("email prompt omits empty or missing sheet fields", () => {
  const prompt = buildLeadEmailPrompt(testLead({
    name: "",
    company: "",
    sheetData: [
      { column: "Product Interest", value: " " },
      { column: "Inquiry", value: "Need a quote for two warehouses" },
    ],
  }));

  assert.match(prompt, /"column":"Inquiry","value":"Need a quote for two warehouses"/);
  assert.doesNotMatch(prompt, /"column":"Product Interest"/);
  assert.doesNotMatch(prompt, /"value":"undefined"/);
});

test("generated email validation rejects placeholders and raw spreadsheet label lines", () => {
  const lead = testLead({ sheetData: [{ column: "Product Interest", value: "Inventory analytics" }] });

  assert.throws(
    () => validateGeneratedEmail({ subject: "Following up", body: "Hi [Name], I can share more." }, lead),
    /placeholder or missing-value text/,
  );
  assert.throws(
    () => validateGeneratedEmail({ subject: "Following up", body: "Best regards, [Your Name]" }, lead),
    /placeholder or missing-value text/,
  );
  assert.throws(
    () => validateGeneratedEmail({ subject: "Following up", body: "Hi Maya, your request is undefined." }, lead),
    /placeholder or missing-value text/,
  );
  assert.throws(
    () => validateGeneratedEmail({ subject: "Following up", body: "Product Interest: Inventory analytics" }, lead),
    /spreadsheet column label/,
  );
  assert.deepEqual(
    validateGeneratedEmail({ subject: "  Inventory analytics follow-up  ", body: "  Hi Maya, reply with any questions.  " }, lead),
    { subject: "Inventory analytics follow-up", body: "Hi Maya, reply with any questions." },
  );
});

test("generated email path rejects call, meeting, demo, and duration requests plus unsupported generic claims", () => {
  const lead = testLead();
  assert.throws(
    () => validateGeneratedEmail({
      subject: "Let's discuss",
      body: "Our team specializes in building custom, high-performing web solutions. Are you available for a 15-minute call?",
    }, lead),
    /unsupported generic sales copy/,
  );
  assert.throws(
    () => validateGeneratedEmail({
      subject: "A quick follow-up",
      body: "Would you be open to a 15-minute call next week?",
    }, lead),
    /contains a call, meeting, demo, chat, or duration/,
  );
  for (const body of [
    "Would you be open to a video call?",
    "Can we arrange a meeting next week?",
    "Would a demo help?",
    "Are you available for 10 minutes?",
  ]) {
    assert.throws(
      () => validateGeneratedEmail({ subject: "A quick follow-up", body }, lead),
      /contains a call, meeting, demo, chat, or duration/,
    );
  }
});

test("generated response parsing keeps a clean neutral-signoff draft body", () => {
  const lead = testLead({ sheetData: [{ column: "Product Interest", value: "Inventory analytics" }] });
  const email = parseGeneratedEmail(JSON.stringify({
    subject: "Following up on inventory analytics",
    body: "Hi Maya, reply with any questions.\n\nBest regards,\nThe Team",
  }), lead);

  assert.equal(email.subject, "Following up on inventory analytics");
  assert.match(email.body, /Best regards,\nThe Team/);
});

test("active generateEmail path sends the row-personalized prompt and validates the returned response", async () => {
  const lead = testLead({
    sheetData: [
      { column: "Product Interest", value: "Inventory analytics" },
      { column: "Notes", value: "Comparing reporting options" },
    ],
  });
  let sentPrompt = "";
  const email = await generateEmail(lead, async (_model, contents) => {
    sentPrompt = contents;
    return { text: JSON.stringify({
      subject: "Following up on inventory analytics",
      body: "Hi Maya, I am following up on your interest in inventory analytics and your note about comparing reporting options. Reply with any questions or requirements you would like to clarify. I can share relevant information based on what would be most useful. Best regards,\nThe Team",
    }) };
  });

  assert.match(sentPrompt, /Inventory analytics/);
  assert.match(sentPrompt, /Comparing reporting options/);
  assert.equal(email.subject, "Following up on inventory analytics");
  assert.match(email.body, /Best regards,\nThe Team/);
});
