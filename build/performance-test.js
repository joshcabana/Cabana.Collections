#!/usr/bin/env node
/* eslint-disable no-console */
// CABANA performance testing using Lighthouse (headless Chrome required)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(process.cwd(), 'reports');
const URLS = [
  'http://localhost:8000/',
  'http://localhost:8000/products/mens-boxer-brief-black.html',
  'http://localhost:8000/products/womens-set.html',
];

const BUDGETS = {
  performance: 0.9, // 90+
  accessibility: 0.9,
  bestPractices: 0.9,
  seo: 0.9,
};

function runLighthouse(url) {
  const safeName = url.replace(/https?:\/\//, '').replace(/\W+/g, '_');
  const htmlOut = path.join(OUTPUT_DIR, `${safeName}.html`);
  const jsonOut = path.join(OUTPUT_DIR, `${safeName}.json`);

  const cmd = `npx --yes lighthouse ${url} --only-categories=performance,accessibility,best-practices,seo --preset=desktop --quiet --output=json --output-path=${jsonOut} --output=html --output-path=${htmlOut}`;
  execSync(cmd, { stdio: 'inherit' });
  return { jsonOut, htmlOut };
}

function readScores(jsonFile) {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const categories = data.categories || {};
  const scores = {
    performance: categories.performance?.score || 0,
    accessibility: categories.accessibility?.score || 0,
    bestPractices: categories['best-practices']?.score || 0,
    seo: categories.seo?.score || 0,
  };
  return scores;
}

function checkBudgets(scores) {
  const failures = [];
  for (const [k, min] of Object.entries(BUDGETS)) {
    if ((scores[k] || 0) < min) failures.push(`${k}: ${Math.round((scores[k] || 0) * 100)} < ${
      min * 100
    }`);
  }
  return failures;
}

function suggestions(scores) {
  const tips = [];
  if ((scores.performance || 0) < BUDGETS.performance) {
    tips.push('- Consider inlining critical CSS and deferring non-critical CSS');
    tips.push('- Use responsive images (srcset) and ensure WebP/AVIF are served');
    tips.push('- Defer third-party scripts; add async/defer where possible');
  }
  if ((scores.seo || 0) < BUDGETS.seo) tips.push('- Check alt text and meta tags consistency');
  if ((scores.accessibility || 0) < BUDGETS.accessibility)
    tips.push('- Verify ARIA labels and color contrast for text on backgrounds');
  if ((scores.bestPractices || 0) < BUDGETS.bestPractices)
    tips.push('- Ensure HTTPS, no deprecated APIs, and correct image aspect ratios');
  return tips;
}

(function run() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('==> Running Lighthouse performance tests');
  let failed = false;
  for (const url of URLS) {
    try {
      const { jsonOut } = runLighthouse(url);
      const scores = readScores(jsonOut);
      const failures = checkBudgets(scores);
      const display = Object.fromEntries(
        Object.entries(scores).map(([k, v]) => [k, Math.round((v || 0) * 100)])
      );
      console.log(`Scores for ${url}:`, display);
      if (failures.length) {
        failed = true;
        console.log('Budget failures:', failures.join(', '));
        console.log('Suggestions:');
        suggestions(scores).forEach((tip) => console.log(`  ${tip}`));
      }
    } catch (e) {
      failed = true;
      console.error(`Failed to run Lighthouse for ${url}:`, e.message);
    }
  }

  if (failed) {
    console.error('\nOne or more pages failed performance budgets. See reports/ for details.');
    process.exit(1);
  } else {
    console.log('\nAll pages met performance budgets.');
  }
})();


