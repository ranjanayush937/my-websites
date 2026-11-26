# Databricks for Data Engineer Interviews

A static site for preparing for Databricks data engineer interviews (about 4 years of experience). It has 22 pages and 118 interview questions with model answers, PySpark coding patterns, design walkthroughs and comparison tables. It uses the same design as `../aws-guide` and `../azure-guide`, works on laptop and phone, and needs no build step.

## View locally

Open `index.html` in a browser, or run `python3 -m http.server` in this folder.

## Host on GitHub Pages

Push the folder to the repo and enable Pages. Navigation uses `#/page-id` URLs, so no server config is needed. The root `index.html` lists folders that contain an `index.html`, so this guide appears automatically.

## Contents

- **Interview Prep:** how to prepare, comparisons, medallion batch / streaming / CDC designs, scenario questions.
- **Platform & Governance:** architecture, compute, Unity Catalog, Databricks SQL.
- **Delta Lake & Spark:** Delta fundamentals, performance and maintenance, Spark internals, Spark tuning, PySpark coding patterns.
- **Pipelines & Orchestration:** Auto Loader, Structured Streaming, Delta Live Tables, Workflows.
- **Operations & Delivery:** CI/CD with Asset Bundles, security and networking, cost and monitoring.

## Add or edit content

Content lives in `data/*.js` and calls `GUIDE.add({ id, title, order, services: [...] })`. A page looks like:

```js
{
  id: 'delta-lake', name: 'Delta Lake fundamentals', priority: 'must',   // must | imp | good
  short: 'One-line summary.', overview: 'Paragraph.',
  whenToUse: [], concepts: [], useCases: [],
  examples: [{ title: '', desc: '', lang: 'sql', code: `...` }],
  pricing: '', tips: [], related: ['spark-internals'],
  interview: [{ q: 'Question?', a: 'Answer.\n\nSecond paragraph.' }]
}
```

Free-form pages use `sections: [{ title, text, list, ordered, table: {head, rows}, code: {lang, code} }]`. Wrap words in backticks in text fields to show inline code. A new data file needs a `<script>` tag in `index.html` after `registry.js`.

## Accuracy note

Databricks changes quickly (for example Delta Live Tables is becoming Lakeflow Declarative Pipelines, and liquid clustering and serverless features keep evolving). Check syntax and defaults against the current documentation before relying on them.
