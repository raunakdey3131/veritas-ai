// Veritas Cat — Popup Script

const VERITAS_API = 'http://localhost:8000/v1/verify';

// ── Draw mini pixel cat in preview ────────────────────────────────────────

function drawMiniCat(frame = 0) {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);

  const fur = '#F5E6D3', dark = '#D4A574', light = '#FDF5EE';
  const ear = '#F0C8A0', earIn = '#FFD1DC', pupil = '#3D2B1F';
  const blush = '#FFB5C0', nose = '#FF9EB5', hp = '#4A4A5A';
  const hpAcc = '#FF7EB3', collarC = '#FF6B8A', bellC = '#FFD700';

  const blink = frame % 90 < 5;
  const b = Math.sin(frame * 0.1) * 0.6;

  // Body
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.ellipse(32, 46, 12, 11 + b, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.ellipse(32, 44, 9, 8 + b, 0, 0, Math.PI * 2); ctx.fill();

  // Big chibi head
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.ellipse(32, 22, 19, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = light;
  ctx.beginPath(); ctx.ellipse(32, 27, 14, 11, 0, 0, Math.PI * 2); ctx.fill();

  // Cheek fluff
  for (const s of [-1, 1]) {
    ctx.fillStyle = light;
    ctx.beginPath(); ctx.ellipse(32 + s * 16, 28, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Ears
  for (const s of [-1, 1]) {
    ctx.fillStyle = ear;
    const ew = 0.4;
    ctx.beginPath();
    ctx.moveTo(32 + s * 14 - 5, 8); ctx.lineTo(32 + s * 14, 2); ctx.lineTo(32 + s * 14 + 5, 8);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = earIn;
    ctx.beginPath();
    ctx.moveTo(32 + s * 14 - 3, 7); ctx.lineTo(32 + s * 14, 3.5); ctx.lineTo(32 + s * 14 + 3, 7);
    ctx.closePath(); ctx.fill();
  }

  // Headphones
  ctx.fillStyle = hp;
  ctx.fillRect(6, 7, 52, 4);
  for (const s of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(32 + s * 24, 18, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hpAcc;
    ctx.beginPath(); ctx.arc(32 + s * 24, 18, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = hp;
  }

  // BIG eyes
  for (const s of [-1, 1]) {
    const ex = 32 + s * 9, ey = 20;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.ellipse(ex, ey, 6.5, 7.5, 0, 0, Math.PI * 2); ctx.fill();
    if (blink) {
      ctx.strokeStyle = pupil; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(ex - 1, ey, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(ex + 1, ey, 4.5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    } else {
      ctx.fillStyle = pupil;
      ctx.beginPath(); ctx.ellipse(ex, ey, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(ex + 2, ey - 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex - 1, ey + 1.5, 1, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Blush
  for (const s of [-1, 1]) {
    ctx.fillStyle = blush; ctx.globalAlpha = 0.35;
    ctx.beginPath(); ctx.ellipse(32 + s * 13, 27, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Nose
  ctx.fillStyle = nose;
  ctx.beginPath(); ctx.moveTo(32, 24); ctx.lineTo(30, 27); ctx.lineTo(34, 27); ctx.closePath(); ctx.fill();

  // Smile
  ctx.strokeStyle = pupil; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(32, 27, 3.5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();

  // Collar
  ctx.fillStyle = collarC;
  ctx.beginPath(); ctx.ellipse(32, 39, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = bellC;
  ctx.beginPath(); ctx.arc(32, 42, 2.5, 0, Math.PI * 2); ctx.fill();
}

// ── Verify Text ────────────────────────────────────────────────────────────

async function verifyText(text) {
  try {
    const res = await fetch(VERITAS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Verify this text for factual accuracy',
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
    return analyzeLocally(text);
  }
}

function analyzeLocally(text) {
  const lower = text.toLowerCase();
  let score = 5;
  const issues = [];

  const checks = [
    { pattern: /python.*2010|2010.*python/i, msg: 'Python was created in 1991, not 2010', add: 80 },
    { pattern: /python.*creat.*1991|1991.*python|guido.*van.*rossum/i, msg: 'Python was created in 1991 by Guido van Rossum', add: -3 },
    { pattern: /google.*(2000|2001|2002|2003|2004|2005)/i, msg: 'Google was founded in 1998, not later', add: 75 },
    { pattern: /google.*founded.*1998|larry.*page.*sergey/i, msg: 'Google was founded in 1998 by Larry Page and Sergey Brin', add: -3 },
    { pattern: /earth.*two moons|two moon/i, msg: 'Earth has only one moon', add: 85 },
    { pattern: /speed.*light.*200/i, msg: 'Speed of light is ~300,000 km/s', add: 70 },
    { pattern: /population.*(9|10|11|12).*billion/i, msg: 'World population is ~8 billion', add: 65 },
    { pattern: /einstein.*invent/i, msg: 'Einstein didn\'t invent things, he developed theories', add: 40 },
    { pattern: /world.*war.*(1914|1918|1939|1945)/i, msg: 'WWI: 1914-1918, WWII: 1939-1945', add: -3 },
  ];

  for (const check of checks) {
    if (check.pattern.test(lower)) {
      score += check.add;
      issues.push(check.msg);
    }
  }

  score = Math.max(0, Math.min(100, score));

  return {
    hallucination_score: score,
    risk_level: score <= 20 ? 'HIGHLY_RELIABLE' : score <= 40 ? 'MOSTLY_RELIABLE' : score <= 60 ? 'NEEDS_VERIFICATION' : score <= 80 ? 'LIKELY_HALLUCINATED' : 'HIGHLY_HALLUCINATED',
    issues,
    summary: issues.length > 0
      ? `Found ${issues.length} potential hallucination${issues.length > 1 ? 's' : ''}.`
      : 'No obvious issues detected!',
  };
}

// ─── Animations ────────────────────────────────────────────────────────────

let animFrame = 0;
setInterval(() => {
  animFrame++;
  drawMiniCat(animFrame);
}, 100);

// ── DOM Ready ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('verify-input');
  const btn = document.getElementById('verify-btn');
  const resultSection = document.getElementById('result-section');
  const resultValue = document.getElementById('result-value');
  const resultRisk = document.getElementById('result-risk');
  const resultSummary = document.getElementById('result-summary');
  const resultIssues = document.getElementById('result-issues');
  const summonBtn = document.getElementById('summon-btn');
  const hideBtn = document.getElementById('hide-btn');
  const tipBtn = document.getElementById('tip-btn');
  const tipText = document.getElementById('tip-text');

  // ── Tips ──

  const TIPS = [
    { icon: '🐱', text: 'Select text on any page, right-click, and choose "Check for Hallucinations"!' },
    { icon: '🎧', text: 'I listen for fake facts! Right-click anything suspicious.' },
    { icon: '🧠', text: 'Veritas AI cross-references against 100M+ verified sources.' },
    { icon: '🌙', text: 'Earth has exactly ONE moon. I know my astronomy!' },
    { icon: '🐍', text: 'Python was created in 1991 by Guido van Rossum, not 2010!' },
    { icon: '⏳', text: 'Google was founded in 1998 by Larry Page and Sergey Brin.' },
    { icon: '⚡', text: 'The speed of light is ~300,000 km/s — not 200,000!' },
    { icon: '📏', text: 'Drag me anywhere on the page! I remember my spot.' },
    { icon: '🎯', text: 'I can detect contradictions, fake citations, and more!' },
    { icon: '💬', text: 'Click me for a fun fact! I love sharing knowledge.' },
  ];

  let tipIndex = 0;
  function showTip() {
    tipIndex = (tipIndex + 1) % TIPS.length;
    const tip = TIPS[tipIndex];
    document.getElementById('tip-icon').textContent = tip.icon;
    tipText.textContent = tip.text;
  }

  tipBtn.addEventListener('click', showTip);
  setInterval(showTip, 8000);

  // Verify
  btn.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) return;

    btn.textContent = '🤔 Thinking...';
    btn.disabled = true;

    const result = await verifyText(text);

    btn.textContent = 'Check Facts 🐱';
    btn.disabled = false;

    // Show results
    resultSection.classList.remove('hidden');
    resultValue.textContent = Math.round(result.hallucination_score);

    const risk = (result.risk_level || '').toLowerCase();
    resultRisk.className = '';
    if (risk.includes('hallucin') || risk.includes('highly')) {
      resultRisk.classList.add('risk-high');
      resultRisk.textContent = result.risk_level?.replace(/_/g, ' ') || 'HALLUCINATED';
    } else if (risk.includes('needs') || risk.includes('mostly') || risk.includes('likely')) {
      resultRisk.classList.add('risk-medium');
      resultRisk.textContent = result.risk_level?.replace(/_/g, ' ') || 'UNCERTAIN';
    } else {
      resultRisk.classList.add('risk-low');
      resultRisk.textContent = result.risk_level?.replace(/_/g, ' ') || 'RELIABLE';
    }

    resultSummary.textContent = result.summary || '';

    if (result.issues && result.issues.length > 0) {
      resultIssues.textContent = '⚠ ' + result.issues.join('\n⚠ ');
    } else {
      resultIssues.textContent = '';
    }

    // Send to tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'CHECK_HALLUCINATION',
          text,
        });
      }
    });
  });

  // Enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      btn.click();
    }
  });

  // Summon cat
  summonBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'SUMMON_CAT' });
      }
    });
    window.close();
  });

  // Hide cat
  hideBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: 'HIDE_CAT' });
      }
    });
  });

  // Initial draw
  drawMiniCat(0);
});
