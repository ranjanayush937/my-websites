# AWS for Data Engineer Interviews

A static site for preparing for data engineer interviews (about 4 years of experience). It has service pages, 121 interview questions with model answers, design walkthroughs and comparison tables. It works on laptop and phone, with search, dark/light theme and copy buttons on code. No build step.

## View locally

Open `index.html` in a browser, or run `python3 -m http.server` in this folder.

## Host on GitHub Pages

Push the folder to a repo, then Settings > Pages > deploy from the branch. Navigation uses `#/page-id` URLs, so no server config is needed.

## What is inside

- **Interview Prep:** how to prepare, service comparisons, batch/streaming/lake design walkthroughs, scenario questions.
- **Service pages:** overview, use cases, practical examples, pricing, best practices and interview questions. Each carries a priority badge (Must know, Important, Good to know).
- **All interview Q&A:** every question in one list for revision.

## Add or edit content

- Files: `index.html`, `style.css`, `app.js`, `registry.js` (shell); `data/*.js` (content).
- Add a service: add an object to `services` in the category file under `data/`:

```js
{
  id: 'rds', name: 'Amazon RDS', short: 'One-line summary.', overview: 'Paragraph.',
  whenToUse: [], concepts: [], useCases: [],
  examples: [{ title: '', desc: '', lang: 'bash', code: '' }],
  pricing: '', tips: [], related: ['vpc'],
  interview: [{ q: 'Question?', a: 'Answer.\n\nSecond paragraph.' }]
}
```

- Add questions or a priority to an existing service without editing it, in `data/interview-core.js` or `data/interview-data.js`:

```js
AWSGUIDE.extra({ s3: { priority: 'must', interview: [{ q: '...', a: '...' }] } });
```

- Priority values: `must`, `imp`, `good`.
- Free-form pages (comparisons, designs) use `sections: [{ title, text, list, ordered, table: {head, rows}, code: {lang, code} }]`. See `data/interview-prep.js`.
- A new category file needs a `<script>` tag in `index.html`, after `registry.js` and before `app.js`.
- In text fields, wrap words in backticks to show inline code.
