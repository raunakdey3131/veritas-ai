// Veritas Cat — Background Service Worker
// Handles context menus, API communication, tab events

const VERITAS_API = 'http://localhost:8000/v1/verify';

// ── Context Menu ───────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'check-hallucination',
    title: '🐱 Check for Hallucinations',
    contexts: ['selection'],
  });

  chrome.contextMenus.create({
    id: 'summon-cat',
    title: '🐱 Summon Veritas Cat',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'check-hallucination' && info.selectionText) {
    // Send selected text to content script for analysis
    chrome.tabs.sendMessage(tab.id, {
      type: 'CHECK_HALLUCINATION',
      text: info.selectionText,
    });
  }

  if (info.menuItemId === 'summon-cat') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SUMMON_CAT',
    });
  }
});

// ── Verify via API ─────────────────────────────────────────────────────────
async function verifyText(text) {
  try {
    const res = await fetch(VERITAS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Verify this statement for facts',
        response: text,
        options: {
          check_citations: false,
          check_contradictions: true,
          estimate_uncertainty: true,
          retrieve_evidence: true,
          max_claims: 5,
        },
      }),
    });
    return await res.json();
  } catch {
    // Fallback demo analysis
    return analyzeLocally(text);
  }
}

function analyzeLocally(text) {
  const lower = text.toLowerCase();
  let score = 5;
  let issues = [];

  // Simple heuristic checks
  const knownFacts = [
    { pattern: /1991.*python|python.*1991|guido van rossum/i, correction: 'Python was created in 1991 by Guido van Rossum', reliable: true },
    { pattern: /1998.*google|google.*1998|larry page.*sergey|sergey.*larry/i, correction: 'Google was founded in 1998 by Larry Page and Sergey Brin', reliable: true },
    { pattern: /earth.*two moons|two moons.*earth/i, correction: 'Earth has exactly one moon', reliable: false },
    { pattern: /python.*2010/i, correction: 'Python was released in 1991, not 2010', reliable: false },
    { pattern: /speed of light.*200/i, correction: 'Speed of light is ~300,000 km/s', reliable: false },
  ];

  for (const fact of knownFacts) {
    if (fact.pattern.test(lower)) {
      if (fact.reliable) {
        score = Math.max(0, score - 3);
      } else {
        score = Math.min(100, score + 75);
        issues.push(fact.correction);
      }
    }
  }

  return {
    hallucination_score: score,
    risk_level: score < 30 ? 'HIGHLY_RELIABLE' : score < 60 ? 'NEEDS_VERIFICATION' : 'LIKELY_HALLUCINATED',
    issues,
    summary: issues.length > 0
      ? `Hmm, I found ${issues.length} issue${issues.length > 1 ? 's' : ''}! ${issues[0]}`
      : 'This looks reliable! Meow~',
  };
}

// ── Message Handler ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VERIFY_TEXT') {
    verifyText(message.text).then(sendResponse);
    return true; // Keep channel open for async
  }
});
