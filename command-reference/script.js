const search = document.getElementById('search');
const cards = Array.from(document.querySelectorAll('.cmd'));
const sections = Array.from(document.querySelectorAll('section'));
const noResults = document.getElementById('noresults');
const resultCount = document.getElementById('result-count');
const navLinks = Array.from(document.querySelectorAll('nav a'));

/* ---------- Dark/light theme ---------- */
const themeToggle = document.getElementById('theme-toggle');
const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) themeToggle.checked = theme === 'light';
  try { localStorage.setItem('command-reference-theme', theme); } catch {}
};
if (themeToggle) {
  const currentTheme = document.documentElement.dataset.theme || 'dark';
  themeToggle.checked = currentTheme === 'light';
  themeToggle.addEventListener('change', () => applyTheme(themeToggle.checked ? 'light' : 'dark'));
}

/* ---------- Copy-to-clipboard buttons ---------- */
document.querySelectorAll('pre').forEach(pre => {
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.type = 'button';
  btn.textContent = 'Copy';
  btn.addEventListener('click', async () => {
    const code = pre.querySelector('code');
    const text = code ? code.innerText : pre.innerText;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      ta.remove();
    }
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 1500);
  });
  pre.appendChild(btn);
});

/* ---------- Search highlight helpers ---------- */
function clearHighlights(card) {
  card.querySelectorAll('mark').forEach(m => {
    const parent = m.parentNode;
    parent.replaceChild(document.createTextNode(m.textContent), m);
    parent.normalize();
  });
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function highlight(card, q) {
  if (!q) return;
  const rx = new RegExp(escapeRegExp(q), 'gi');
  const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentNode.classList && node.parentNode.classList.contains('copy-btn')) return NodeFilter.FILTER_REJECT;
      return rx.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const targets = [];
  while (walker.nextNode()) targets.push(walker.currentNode);
  targets.forEach(node => {
    const frag = document.createDocumentFragment();
    let last = 0;
    node.nodeValue.replace(rx, (m, idx) => {
      if (idx > last) frag.appendChild(document.createTextNode(node.nodeValue.slice(last, idx)));
      const mark = document.createElement('mark');
      mark.textContent = m;
      frag.appendChild(mark);
      last = idx + m.length;
      return m;
    });
    if (last < node.nodeValue.length) frag.appendChild(document.createTextNode(node.nodeValue.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
}

/* ---------- Search filtering ---------- */
function runSearch() {
  const q = search.value.trim().toLowerCase();
  let visible = 0;

  cards.forEach(card => {
    clearHighlights(card);
    const match = card.textContent.toLowerCase().includes(q);
    card.classList.toggle('hidden', q && !match);
    if (!q || match) {
      visible++;
      if (q) highlight(card, q);
    }
  });

  sections.forEach(sec => {
    const visibleCards = sec.querySelectorAll('.cmd:not(.hidden)').length;
    sec.classList.toggle('hidden', q && visibleCards === 0);
    // While searching, expand any collapsed category that has matches so results show.
    if (q && visibleCards > 0) {
      const block = sec.closest('.cat-block');
      if (block && block.classList.contains('collapsed')) {
        block.classList.remove('collapsed');
        const head = block.querySelector('.cat-head');
        if (head) head.setAttribute('aria-expanded', 'true');
      }
    }
  });

  noResults.classList.toggle('hidden', visible > 0);
  resultCount.textContent = q ? `${visible} command${visible === 1 ? '' : 's'} match “${search.value.trim()}”` : '';
}

search.addEventListener('input', runSearch);

/* ---------- Keyboard shortcuts ---------- */
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== search) {
    e.preventDefault();
    search.focus();
    search.select();
  } else if (e.key === 'Escape' && document.activeElement === search) {
    search.value = '';
    runSearch();
    search.blur();
  }
});

/* ---------- Back-to-top visibility on scroll ---------- */
const toTop = document.getElementById('to-top');

function onScroll() {
  const h = document.documentElement;
  const scrolled = h.scrollTop;
  toTop.classList.toggle('show', scrolled > 400);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Back to top ---------- */
toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- Scrollspy: highlight active nav link ---------- */
const spyTargets = navLinks
  .map(a => document.getElementById(a.getAttribute('href').slice(1)))
  .filter(Boolean);

const spy = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    }
  });
}, { rootMargin: '-10% 0px -75% 0px', threshold: 0 });
spyTargets.forEach(t => spy.observe(t));

/* ---------- Command tree + structured examples ---------- */
const treeData = [
  { cat: 'dbt', label: 'dbt', groups: [
    { name: 'Run & build', label: 'run / build / compile', target: 'dbt-run', commands: [
      { name: 'dbt run', desc: 'Executes the SQL for your models, creating or replacing tables/views in the target warehouse — the core command of any dbt project.', steps: [
        { note: 'Run a single model and everything it depends on (+ prefix = upstream)', cmd: 'dbt run --select +int_rrd_defence_combined' },
        { note: 'Full-refresh an incremental model after a logic change', cmd: 'dbt run --select rrd_agent_master_defense --full-refresh' },
        { note: 'Run the whole staging layer against the UAT target before prod', cmd: 'dbt run --target uat --select staging.*' },
        { note: 'Run everything except one slow model', cmd: 'dbt run --exclude tag:slow' },
      ]},
      { name: 'dbt build', desc: 'Runs models, tests, snapshots, and seeds together in dependency order. If a model\u2019s tests fail, downstream models are skipped — ideal for CI and scheduled jobs.', steps: [
        { note: 'Nightly job: build the whole pipeline, stop on first failure', cmd: 'dbt build --fail-fast' },
        { note: 'Build one mart plus its upstream, with tests gating each step', cmd: 'dbt build --select +rrd_agent_master_defense' },
        { note: 'Build against prod with thread parallelism', cmd: 'dbt build --target prod --threads 8' },
      ]},
      { name: 'dbt compile', desc: 'Renders Jinja/macros into raw SQL under target/ without running it — great for inspecting exactly what dbt will send to the warehouse.', steps: [
        { note: 'Compile one model to debug a macro', cmd: 'dbt compile --select int_rrd_defence_combined' },
        { note: 'Then open the rendered SQL', cmd: 'cat target/compiled/**/int_rrd_defence_combined.sql' },
      ]},
    ]},
    { name: 'Test & validate', label: 'test / debug', target: 'dbt-test', commands: [
      { name: 'dbt test', desc: 'Runs data-quality tests (schema tests like unique/not_null and singular SQL tests) against already-built models.', steps: [
        { note: 'Validate grain and business rules on the base model', cmd: 'dbt test --select int_rrd_defence_agent_base' },
        { note: 'Run one specific singular test', cmd: 'dbt test --select test_mtd_gte_ftd_nop' },
        { note: 'Store failing rows in the warehouse for debugging', cmd: 'dbt test --store-failures --select rrd_agent_master_defense' },
      ]},
      { name: 'dbt debug', desc: 'Checks your setup: profile, warehouse connection, and project validity. The first thing to run when something won\u2019t connect.', steps: [
        { note: 'Confirm the UAT connection works before a deployment', cmd: 'dbt debug --target uat' },
        { note: 'Show which profiles.yml and config dbt is using', cmd: 'dbt debug --config-dir' },
      ]},
    ]},
    { name: 'Data & packages', label: 'seed / snapshot / deps', target: 'dbt-seed', commands: [
      { name: 'dbt seed', desc: 'Loads CSV files from the seeds/ directory into the warehouse as tables. Used for small, version-controlled lookup/reference data.', steps: [
        { note: 'Load a designation-role mapping CSV', cmd: 'dbt seed --select defence_designation_lookup' },
        { note: 'Reload all seeds, replacing existing tables', cmd: 'dbt seed --full-refresh' },
      ]},
      { name: 'dbt snapshot', desc: 'Captures slowly changing dimensions (Type 2 history) by recording how rows change over time.', steps: [
        { note: 'Track changes to agent geo-hierarchy assignments', cmd: 'dbt snapshot --select defence_agent_hierarchy_snapshot' },
      ]},
      { name: 'dbt deps', desc: 'Installs packages listed in packages.yml (e.g. dbt_utils) into dbt_packages/. Run after cloning or updating dependencies.', steps: [
        { note: 'First step after cloning the repo on a new machine', cmd: 'dbt deps' },
      ]},
    ]},
    { name: 'Docs, listing & sources', label: 'docs / ls / source', target: 'dbt-docs', commands: [
      { name: 'dbt docs generate', desc: 'Build the documentation site (lineage graph, column docs, tests).', steps: [
        { note: 'Generate the docs artifacts', cmd: 'dbt docs generate' },
        { note: 'Generate including compiled catalog stats', cmd: 'dbt docs generate --no-compile' },
      ]},
      { name: 'dbt docs serve', desc: 'Serve the generated docs locally in a browser.', steps: [
        { note: 'Serve on a chosen port and open the lineage DAG', cmd: 'dbt docs serve --port 8080' },
      ]},
      { name: 'dbt ls', desc: 'List resources matching a selector without running them — handy for verifying what a --select will touch.', steps: [
        { note: 'List everything downstream of staging', cmd: 'dbt ls --select staging.*+' },
        { note: "Models tagged 'defence' that are also marts", cmd: 'dbt ls --select tag:defence,mart.*' },
        { note: 'Preview what a scheduled run will execute', cmd: 'dbt ls --select +rrd_agent_master_defense --resource-type model' },
      ]},
      { name: 'dbt source freshness', desc: 'Check how fresh the configured source tables are against their loaded_at thresholds.', steps: [
        { note: 'Run freshness checks on all sources', cmd: 'dbt source freshness' },
        { note: 'Check freshness for one source only', cmd: 'dbt source freshness --select source:raw_defence' },
      ]},
    ]},
    { name: "Project Setup & Utilities", label: "init / clean / parse / show / retry / clone / run-operation", target: "dbt-util", commands: [
      { name: "dbt init", desc: "Scaffolds a new dbt project and walks you through creating a connection profile.", steps: [
        { note: "Create a new project in a new folder", cmd: "dbt init my_project" },
        { note: "Scaffold without touching your existing profiles.yml", cmd: "dbt init my_project --skip-profile-setup" },
      ]},
      { name: "dbt clean", desc: "Deletes the folders listed under clean-targets in dbt_project.yml, usually target/ and dbt_packages/.", steps: [
        { note: "Remove compiled artifacts and installed packages", cmd: "dbt clean" },
        { note: "Start from a clean slate, then reinstall packages", cmd: "dbt clean && dbt deps" },
      ]},
      { name: "dbt parse", desc: "Parses the project and writes target/manifest.json without connecting to the warehouse. Quick way to catch YAML and Jinja errors.", steps: [
        { note: "Validate the project structure and refs", cmd: "dbt parse" },
        { note: "Ignore the partial-parse cache after changing dbt_project.yml", cmd: "dbt parse --no-partial-parse" },
      ]},
      { name: "dbt show", desc: "Previews the result of a model or an inline query in the terminal without materializing anything.", steps: [
        { note: "Peek at 10 rows from a model", cmd: "dbt show --select rrd_agent_master_defense --limit 10" },
        { note: "Run an ad-hoc query with ref()", cmd: "dbt show --inline \"select count(*) as n from {{ ref('int_rrd_defence_combined') }}\"" },
      ]},
      { name: "dbt retry", desc: "Re-runs the previous dbt command, starting from the nodes that failed or were skipped (dbt 1.6+).", steps: [
        { note: "Resume after a failed build without redoing the successful models", cmd: "dbt retry" },
      ]},
      { name: "dbt clone", desc: "Creates copies of nodes from a previous run's state as views or tables in your target schema (dbt 1.6+). Useful for cheap dev environments.", steps: [
        { note: "Clone prod models into your dev schema using saved prod artifacts", cmd: "dbt clone --state prod-artifacts --select rrd_agent_master_defense" },
      ]},
      { name: "dbt run-operation", desc: "Runs a macro directly from the command line, for example to grant permissions or clean up old tables.", steps: [
        { note: "Run a macro with no arguments", cmd: "dbt run-operation grant_select_on_marts" },
        { note: "Pass arguments to the macro as YAML", cmd: "dbt run-operation grant_select --args '{role: reporting}'" },
      ]},
    ]},
  ]},
  { cat: 'git', label: 'git', groups: [
    { name: 'Start & stage', label: 'clone / init / status / add', target: 'git-clone', commands: [
      { name: 'git clone', desc: 'Copy a remote repository to your machine.', steps: [
        { note: "Clone the team's dbt project over SSH", cmd: 'git clone git@github.com:acme/seller-app-defence.git' },
        { note: 'Clone into a specific folder name', cmd: 'git clone git@github.com:acme/seller-app-defence.git defence' },
        { note: 'Shallow clone (latest commit only, faster)', cmd: 'git clone --depth 1 git@github.com:acme/seller-app-defence.git' },
      ]},
      { name: 'git init', desc: 'Initialize a brand-new repo in the current folder.', steps: [
        { note: 'Start tracking an existing folder with Git', cmd: 'cd my-project && git init' },
        { note: 'Initialize with main as the default branch', cmd: 'git init -b main' },
      ]},
      { name: 'git status', desc: 'Show which files changed in the working tree and staging area.', steps: [
        { note: 'See the full working-tree state', cmd: 'git status' },
        { note: 'Compact one-line-per-file view', cmd: 'git status -sb' },
      ]},
      { name: 'git add', desc: 'Stage specific files for the next commit. Prefer naming files over "git add ." to avoid committing unrelated changes.', steps: [
        { note: 'Stage just the two models you edited', cmd: 'git add models/mart/rrd_agent_master_defense.sql models/mart/schema.yml' },
        { note: 'Interactively choose hunks to stage', cmd: 'git add -p' },
      ]},
    ]},
    { name: 'Commit', label: 'commit', target: 'git-commit', commands: [
      { name: 'git commit', desc: 'Records staged changes as a snapshot with a message describing the change.', steps: [
        { note: 'Commit with a clear, scoped message', cmd: 'git commit -m "fix: correct MTD/FTD grain in defence agent base model"' },
        { note: 'Stage all tracked changes and commit in one step', cmd: 'git commit -am "chore: bump dbt_utils version"' },
        { note: 'Add forgotten files to the last commit (before pushing)', cmd: 'git commit --amend --no-edit' },
      ]},
    ]},
    { name: 'Branching', label: 'branch / checkout / switch', target: 'git-branch', commands: [
      { name: 'git branch', desc: 'Create, list, and delete branches.', steps: [
        { note: 'List all branches (local + remote), marking current', cmd: 'git branch -a' },
        { note: 'Delete a merged local branch', cmd: 'git branch -d feature/defence-combined-mart' },
      ]},
      { name: 'git checkout', desc: 'Classic way to create and move between branches (also restores files).', steps: [
        { note: 'Create and switch to a feature branch', cmd: 'git checkout -b feature/defence-combined-mart' },
        { note: 'Discard local changes to one file', cmd: 'git checkout -- models/mart/schema.yml' },
      ]},
      { name: 'git switch', desc: 'Modern, safer branch switching (no accidental file restores).', steps: [
        { note: 'Create and switch in one step', cmd: 'git switch -c feature/defence-combined-mart' },
        { note: 'Go back to main', cmd: 'git switch main' },
      ]},
    ]},
    { name: 'Integrate branches', label: 'merge / rebase', target: 'git-merge', commands: [
      { name: 'git merge', desc: 'Integrate another branch, preserving history with a merge commit.', steps: [
        { note: 'Merge a finished feature into main', cmd: 'git switch main && git merge feature/defence-combined-mart' },
        { note: 'Force a merge commit even for fast-forwards', cmd: 'git merge --no-ff feature/defence-combined-mart' },
      ]},
      { name: 'git rebase', desc: 'Replay your commits on top of another branch for a linear history.', steps: [
        { note: 'Rebase onto the latest main before a PR', cmd: 'git switch feature/defence-combined-mart && git rebase main' },
        { note: 'Clean up / squash your last 3 commits interactively', cmd: 'git rebase -i HEAD~3' },
      ]},
    ]},
    { name: 'Sync with remote', label: 'push / pull / fetch', target: 'git-remote', commands: [
      { name: 'git push', desc: 'Upload your commits to the remote.', steps: [
        { note: 'Push a new branch and set upstream tracking', cmd: 'git push -u origin feature/defence-combined-mart' },
        { note: 'Push tags along with commits', cmd: 'git push --follow-tags' },
      ]},
      { name: 'git pull', desc: 'Fetch and integrate remote changes into your current branch.', steps: [
        { note: 'Update your current branch from the remote', cmd: 'git pull' },
        { note: 'Pull with rebase to keep history linear', cmd: 'git pull --rebase origin main' },
      ]},
      { name: 'git fetch', desc: 'Download remote changes without merging them in.', steps: [
        { note: 'Get the latest without touching your working copy', cmd: 'git fetch origin' },
        { note: 'Fetch and prune deleted remote branches', cmd: 'git fetch --prune' },
      ]},
    ]},
    { name: 'Inspect history', label: 'log / diff', target: 'git-log', commands: [
      { name: 'git log', desc: 'View commit history.', steps: [
        { note: 'Compact, graphical history', cmd: 'git log --oneline --graph --decorate -15' },
        { note: 'Show commits that touched one file', cmd: 'git log --follow -- models/mart/rrd_agent_master_defense.sql' },
      ]},
      { name: 'git diff', desc: 'Inspect exactly what changed between versions or in your working tree.', steps: [
        { note: 'See unstaged changes to a model', cmd: 'git diff models/mart/rrd_agent_master_defense.sql' },
        { note: 'See what is staged for commit', cmd: 'git diff --staged' },
        { note: 'Compare two branches', cmd: 'git diff main..feature/defence-combined-mart' },
      ]},
    ]},
    { name: 'Shelve work', label: 'stash', target: 'git-stash', commands: [
      { name: 'git stash', desc: 'Temporarily shelve uncommitted changes so you can switch context, then restore them later.', steps: [
        { note: 'Stash WIP with a label to fix a bug on main', cmd: 'git stash push -m "wip defence mart"' },
        { note: 'List what is currently stashed', cmd: 'git stash list' },
        { note: 'Reapply the most recent stash and drop it', cmd: 'git stash pop' },
      ]},
    ]},
    { name: 'Undo changes', label: 'reset / revert', target: 'git-reset', commands: [
      { name: 'git reset', desc: 'Move the branch pointer (use with care — can discard commits).', steps: [
        { note: 'Unstage a file but keep the edits', cmd: 'git reset HEAD models/mart/schema.yml' },
        { note: 'Discard the last commit but keep the changes staged', cmd: 'git reset --soft HEAD~1' },
        { note: 'Throw away the last commit AND its changes (dangerous)', cmd: 'git reset --hard HEAD~1' },
      ]},
      { name: 'git revert', desc: 'Add a new commit that reverses another — safe for shared branches.', steps: [
        { note: 'Safely undo a pushed commit', cmd: 'git revert a1b2c3d' },
      ]},
    ]},
    { name: 'Advanced workflows', label: 'worktree / cherry-pick', target: 'git-worktree', commands: [
      { name: 'git worktree', desc: 'Check out multiple branches in separate folders at once.', steps: [
        { note: 'Work on a hotfix without disturbing your main checkout', cmd: 'git worktree add ../hotfix-dir -b hotfix/urgent main' },
        { note: 'List existing worktrees', cmd: 'git worktree list' },
        { note: 'Remove a worktree when done', cmd: 'git worktree remove ../hotfix-dir' },
      ]},
      { name: 'git cherry-pick', desc: 'Copy a single commit onto the current branch.', steps: [
        { note: 'Apply just one commit from another branch', cmd: 'git cherry-pick a1b2c3d' },
        { note: 'Cherry-pick a range of commits', cmd: 'git cherry-pick a1b2c3d^..e4f5g6h' },
      ]},
    ]},
    { name: "Inspect & Recover", label: "show / blame / reflog / bisect", target: "git-inspect", commands: [
      { name: "git show", desc: "Displays a commit (message and diff) or a file as it was at a given commit.", steps: [
        { note: "Show the latest commit", cmd: "git show HEAD" },
        { note: "Summarise files changed in a commit", cmd: "git show --stat a1b2c3d" },
        { note: "View a file as it was two commits ago", cmd: "git show HEAD~2:models/mart/schema.yml" },
      ]},
      { name: "git blame", desc: "Shows who last changed each line of a file and in which commit.", steps: [
        { note: "Annotate a whole file", cmd: "git blame models/mart/rrd_agent_master_defense.sql" },
        { note: "Limit to lines 40-60 and ignore whitespace changes", cmd: "git blame -w -L 40,60 models/mart/rrd_agent_master_defense.sql" },
      ]},
      { name: "git reflog", desc: "Lists where HEAD and branches have pointed recently. Lets you recover commits after a bad reset, rebase or deleted branch.", steps: [
        { note: "See recent HEAD movements", cmd: "git reflog" },
        { note: "Recreate a lost branch from a reflog entry", cmd: "git branch recovered HEAD@{3}" },
      ]},
      { name: "git bisect", desc: "Binary-searches your history to find the commit that introduced a bug.", steps: [
        { note: "Start and mark the current commit as broken", cmd: "git bisect start\ngit bisect bad" },
        { note: "Mark a known-good commit; Git checks out the midpoint", cmd: "git bisect good v1.2.0" },
        { note: "Automate the search with a test script", cmd: "git bisect run ./scripts/check.sh" },
        { note: "Finish and return to your branch", cmd: "git bisect reset" },
      ]},
    ]},
    { name: "Files, Tags, Remotes & Config", label: "restore / rm / mv / tag / remote / config / clean", target: "git-files", commands: [
      { name: "git restore", desc: "Discards working-tree changes or unstages files. Replaces the file-level uses of git checkout and git reset.", steps: [
        { note: "Discard unstaged edits to a file", cmd: "git restore models/mart/schema.yml" },
        { note: "Unstage a file but keep the edits", cmd: "git restore --staged models/mart/schema.yml" },
        { note: "Bring back a file from an earlier commit", cmd: "git restore --source=HEAD~1 models/mart/schema.yml" },
      ]},
      { name: "git rm", desc: "Removes a file from the working tree and the index.", steps: [
        { note: "Stop tracking a file but keep it on disk", cmd: "git rm --cached .env" },
        { note: "Delete a tracked folder", cmd: "git rm -r old_models/" },
      ]},
      { name: "git mv", desc: "Renames or moves a file and stages the change in one step.", steps: [
        { note: "Rename a model file", cmd: "git mv models/staging/stg_agent.sql models/staging/stg_defence_agent.sql" },
      ]},
      { name: "git tag", desc: "Marks a specific commit, usually for a release.", steps: [
        { note: "Create an annotated tag", cmd: "git tag -a v1.4.0 -m \"Release 1.4.0\"" },
        { note: "List tags", cmd: "git tag -l \"v1.*\"" },
        { note: "Push one tag to the remote", cmd: "git push origin v1.4.0" },
        { note: "Delete a tag locally", cmd: "git tag -d v1.4.0" },
      ]},
      { name: "git remote", desc: "Manages the remote repositories your clone talks to.", steps: [
        { note: "Show remotes and their URLs", cmd: "git remote -v" },
        { note: "Add a second remote called upstream", cmd: "git remote add upstream git@github.com:acme/seller-app-defence.git" },
        { note: "Change the URL of origin", cmd: "git remote set-url origin git@github.com:acme/new-name.git" },
        { note: "Drop local references to branches deleted on the remote", cmd: "git remote prune origin" },
      ]},
      { name: "git config", desc: "Reads and sets Git options at the repo, user (--global) or system level.", steps: [
        { note: "Set your identity", cmd: "git config --global user.name \"Your Name\"\ngit config --global user.email you@example.com" },
        { note: "Create a shortcut", cmd: "git config --global alias.st status" },
        { note: "See every setting and the file it came from", cmd: "git config --list --show-origin" },
      ]},
      { name: "git clean", desc: "Deletes untracked files. Deleted files cannot be recovered, so preview first.", steps: [
        { note: "Dry run: list what would be removed", cmd: "git clean -n -d" },
        { note: "Remove untracked files and folders", cmd: "git clean -fd" },
      ]},
    ]},
  ]},
  { cat: 'linux', label: 'linux', groups: [
    { name: 'Navigation', label: 'pwd / cd / ls', target: 'lx-nav', commands: [
      { name: 'pwd', desc: 'Print the absolute path of the current working directory.', steps: [
        { note: 'Where am I right now?', cmd: 'pwd' },
      ]},
      { name: 'cd', desc: 'Change the current directory.', steps: [
        { note: 'Move into a project folder', cmd: 'cd dbt/defence_agent_master' },
        { note: 'Jump back to the previous directory', cmd: 'cd -' },
        { note: 'Go straight to your home directory', cmd: 'cd ~' },
      ]},
      { name: 'ls', desc: 'List directory contents.', steps: [
        { note: 'Long listing, human sizes, including hidden files', cmd: 'ls -lah' },
        { note: 'Sort by most recently modified', cmd: 'ls -lt' },
        { note: 'List only directories', cmd: 'ls -d */' },
      ]},
    ]},
    { name: 'Files & directories', label: 'mkdir / cp / mv / rm / touch', target: 'lx-files', commands: [
      { name: 'mkdir', desc: 'Create directories.', steps: [
        { note: 'Create nested dirs, no error if they exist', cmd: 'mkdir -p models/intermediate/defence' },
      ]},
      { name: 'cp', desc: 'Copy files and folders.', steps: [
        { note: 'Back up a file before editing', cmd: 'cp profiles.yml profiles.yml.bak' },
        { note: 'Copy a whole folder recursively', cmd: 'cp -r seeds/ seeds_backup/' },
      ]},
      { name: 'mv', desc: 'Move or rename files and folders.', steps: [
        { note: 'Rename a model into the staging folder', cmd: 'mv old_model.sql staging/stg_model.sql' },
        { note: 'Move all CSVs into the seeds dir', cmd: 'mv *.csv seeds/' },
      ]},
      { name: 'rm', desc: 'Delete files and folders.', steps: [
        { note: 'Delete logs with a confirmation prompt', cmd: 'rm -i target/*.log' },
        { note: 'Remove a dir tree (double-check the path!)', cmd: 'rm -rf target/' },
      ]},
      { name: 'touch', desc: 'Create an empty file, or update a file\u2019s timestamp.', steps: [
        { note: 'Create a new model file', cmd: 'touch models/new_model.sql' },
      ]},
    ]},
    { name: 'Viewing text', label: 'cat / less / head / tail', target: 'lx-view', commands: [
      { name: 'cat', desc: 'Print a whole file to the terminal.', steps: [
        { note: 'Print the project config', cmd: 'cat dbt_project.yml' },
        { note: 'Concatenate two files into one', cmd: 'cat part1.sql part2.sql > combined.sql' },
      ]},
      { name: 'less', desc: 'Page through a file interactively (q to quit, / to search).', steps: [
        { note: 'Page through compiled SQL', cmd: 'less target/compiled/defence/int_combined.sql' },
      ]},
      { name: 'head', desc: 'Peek at the start of a file.', steps: [
        { note: 'First 20 lines of a doc', cmd: "head -20 'docs/SOURCE DDL.txt'" },
      ]},
      { name: 'tail', desc: 'Peek at the end of a file, or follow a growing log.', steps: [
        { note: 'Live-follow a running dbt job', cmd: 'tail -f logs/dbt.log' },
        { note: 'Last 100 lines of a log', cmd: 'tail -n 100 logs/dbt.log' },
      ]},
    ]},
    { name: 'Searching', label: 'grep / find', target: 'lx-search', commands: [
      { name: 'grep', desc: 'Search file contents by pattern.', steps: [
        { note: 'Recursively find every model referencing a source', cmd: 'grep -rn "rrd_defence_agents" models/' },
        { note: 'Case-insensitive search, show only filenames', cmd: 'grep -ril "full_refresh" models/' },
      ]},
      { name: 'find', desc: 'Locate files by name, type, size, or age.', steps: [
        { note: 'SQL files modified in the last day', cmd: 'find models/ -name "*.sql" -mtime -1' },
        { note: 'Find and delete compiled artifacts', cmd: 'find target/ -name "*.sql" -delete' },
        { note: 'Run a command on each match', cmd: 'find models/ -name "*.sql" -exec wc -l {} +' },
      ]},
    ]},
    { name: 'Permissions', label: 'chmod / chown', target: 'lx-perm', commands: [
      { name: 'chmod', desc: 'Change file permission bits.', steps: [
        { note: 'Make the deployment script executable', cmd: 'chmod +x defence_agent_master_deployement.sh' },
        { note: 'Give owner read/write, group read (0640)', cmd: 'chmod 640 profiles.yml' },
      ]},
      { name: 'chown', desc: 'Change file ownership (usually needs sudo).', steps: [
        { note: 'Give the service account ownership of the logs dir', cmd: 'sudo chown -R dbtuser:dbtuser /opt/dbt/logs' },
      ]},
    ]},
    { name: 'Processes', label: 'ps / top / kill / & / nohup', target: 'lx-proc', commands: [
      { name: 'ps', desc: 'Snapshot of running processes.', steps: [
        { note: 'Find a stuck dbt process', cmd: 'ps aux | grep dbt' },
      ]},
      { name: 'top', desc: 'Monitor CPU/memory usage live (q to quit).', steps: [
        { note: 'Watch resource usage in real time', cmd: 'top' },
        { note: 'Sort by memory (press M inside, or use htop)', cmd: 'htop' },
      ]},
      { name: 'kill', desc: 'Send a signal to a process by PID.', steps: [
        { note: 'Ask a process to stop gracefully', cmd: 'kill 48213' },
        { note: 'Force-kill a hung job', cmd: 'kill -9 48213' },
      ]},
      { name: '&', desc: 'Run a job in the background of the current shell.', steps: [
        { note: 'Background a long build', cmd: 'dbt build --target prod &' },
        { note: 'List background jobs in this shell', cmd: 'jobs' },
      ]},
      { name: 'nohup', desc: 'Run a job that keeps going after you log out.', steps: [
        { note: 'Run a long dbt build, logging to a file', cmd: 'nohup dbt build --target prod > run.log 2>&1 &' },
      ]},
    ]},
    { name: 'Networking', label: 'curl / wget / ssh / ping', target: 'lx-net', commands: [
      { name: 'curl', desc: 'Make HTTP requests from the command line.', steps: [
        { note: 'Test an endpoint is reachable (headers only)', cmd: 'curl -I https://my-warehouse.example.com' },
        { note: 'POST JSON to an API', cmd: 'curl -X POST -H "Content-Type: application/json" -d \'{"ok":true}\' https://api.example.com/hook' },
      ]},
      { name: 'wget', desc: 'Download files over HTTP/FTP.', steps: [
        { note: 'Download a reference file', cmd: 'wget https://example.com/reference-data.csv' },
        { note: 'Resume an interrupted download', cmd: 'wget -c https://example.com/big-dump.sql.gz' },
      ]},
      { name: 'ssh', desc: 'Open a secure shell on a remote server.', steps: [
        { note: 'SSH into the deployment server', cmd: 'ssh dbtuser@etl-prod-01' },
        { note: 'Run one command remotely without a login shell', cmd: 'ssh dbtuser@etl-prod-01 "dbt --version"' },
      ]},
      { name: 'ping', desc: 'Test connectivity and latency to a host.', steps: [
        { note: 'Send 4 packets then stop', cmd: 'ping -c 4 etl-prod-01' },
      ]},
    ]},
    { name: 'Archives & transfer', label: 'tar / gzip / scp / rsync', target: 'lx-archive', commands: [
      { name: 'tar', desc: 'Bundle many files into one archive (and compress).', steps: [
        { note: 'Archive and gzip the project for backup', cmd: 'tar -czf defence_backup.tar.gz dbt/defence_agent_master' },
        { note: 'Extract an archive', cmd: 'tar -xzf defence_backup.tar.gz' },
      ]},
      { name: 'gzip', desc: 'Compress a single file in place.', steps: [
        { note: 'Compress a log file', cmd: 'gzip run.log' },
        { note: 'Decompress it again', cmd: 'gunzip run.log.gz' },
      ]},
      { name: 'scp', desc: 'Copy files between machines over SSH.', steps: [
        { note: 'Copy a backup to a remote host', cmd: 'scp defence_backup.tar.gz dbtuser@etl-prod-01:/backups/' },
        { note: 'Pull a file down from the server', cmd: 'scp dbtuser@etl-prod-01:/opt/dbt/logs/dbt.log .' },
      ]},
      { name: 'rsync', desc: 'Efficiently sync folders, transferring only changes.', steps: [
        { note: 'Mirror a folder to the server, deleting extras', cmd: 'rsync -avz --delete ./target/ dbtuser@etl-prod-01:/opt/dbt/target/' },
        { note: 'Preview what would change (dry run)', cmd: 'rsync -avzn ./target/ dbtuser@etl-prod-01:/opt/dbt/target/' },
      ]},
    ]},
    { name: 'Disk & system', label: 'df / du / free / env / export', target: 'lx-disk', commands: [
      { name: 'df', desc: 'Report free disk space per filesystem.', steps: [
        { note: 'Free space per mounted filesystem', cmd: 'df -h' },
      ]},
      { name: 'du', desc: 'Measure directory and file sizes.', steps: [
        { note: 'How big is the compiled output?', cmd: 'du -sh target/' },
        { note: 'Largest subfolders, sorted', cmd: 'du -h --max-depth=1 . | sort -h' },
      ]},
      { name: 'free', desc: 'Show memory usage.', steps: [
        { note: 'Show available RAM in human units', cmd: 'free -h' },
      ]},
      { name: 'env', desc: 'Inspect the current environment variables.', steps: [
        { note: 'Confirm dbt-related vars are set', cmd: 'env | grep DBT' },
      ]},
      { name: 'export', desc: 'Set an environment variable for this shell and its children.', steps: [
        { note: 'Set a password a dbt profile reads', cmd: "export DBT_PWD='secret'" },
        { note: 'Persist it by adding to your shell profile', cmd: "echo 'export DBT_PWD=secret' >> ~/.bashrc" },
      ]},
    ]},
    { name: 'Editing text', label: 'nano / vim', target: 'lx-edit', commands: [
      { name: 'nano', desc: 'Beginner-friendly terminal text editor. Shortcuts are listed along the bottom (^ means Ctrl).', steps: [
        { note: 'Open (or create) a file to edit', cmd: 'nano models/mart/schema.yml' },
        { note: 'Save with Ctrl+O, then quit with Ctrl+X', cmd: '# ^O  write out   ·   ^X  exit' },
        { note: 'Open straight at a specific line', cmd: 'nano +42 logs/dbt.log' },
        { note: 'Edit a protected file as root', cmd: 'sudo nano /etc/hosts' },
      ]},
      { name: 'vim', desc: 'Powerful modal editor available on nearly every server. Press i to type, Esc to leave insert mode.', steps: [
        { note: 'Open a file', cmd: 'vim profiles.yml' },
        { note: 'Save and quit (from normal mode)', cmd: ':wq' },
        { note: 'Quit without saving', cmd: ':q!' },
      ]},
    ]},
    { name: 'Text processing', label: 'sed / awk / cut / sort / uniq / wc', target: 'lx-text', commands: [
      { name: 'sed', desc: 'Stream editor for find-and-replace and line edits.', steps: [
        { note: 'Replace a schema name in-place, keeping a .bak backup', cmd: "sed -i.bak 's/old_schema/new_schema/g' models/sources.yml" },
        { note: 'Print only lines 10\u201320 of a file', cmd: "sed -n '10,20p' logs/dbt.log" },
      ]},
      { name: 'awk', desc: 'Field-aware text processor, great for columnar/CSV data.', steps: [
        { note: 'Print the 2nd comma-separated column', cmd: "awk -F',' '{print $2}' seeds/agents.csv" },
        { note: 'Sum a numeric column', cmd: "awk -F',' '{s+=$3} END{print s}' seeds/nop.csv" },
      ]},
      { name: 'cut', desc: 'Extract specific columns or character ranges.', steps: [
        { note: 'Pull columns 1 and 3 from a TSV', cmd: 'cut -f1,3 export.tsv' },
        { note: 'Grab the first 8 characters of each line', cmd: 'cut -c1-8 ids.txt' },
      ]},
      { name: 'sort', desc: 'Sort lines of text.', steps: [
        { note: 'Sort numerically, descending', cmd: 'sort -nr nop_counts.txt' },
        { note: 'Sort a CSV by its 2nd column', cmd: "sort -t',' -k2 agents.csv" },
      ]},
      { name: 'uniq', desc: 'Collapse or count adjacent duplicate lines (sort first).', steps: [
        { note: 'Count how many times each value appears', cmd: 'sort agents.csv | uniq -c | sort -nr' },
      ]},
      { name: 'wc', desc: 'Count lines, words, and bytes.', steps: [
        { note: 'Count rows (minus header) in a CSV', cmd: 'wc -l seeds/agents.csv' },
      ]},
    ]},
    { name: 'Shell helpers', label: 'man / which / history / ln / xargs', target: 'lx-misc', commands: [
      { name: 'man', desc: 'Open the manual page for a command (q to quit).', steps: [
        { note: 'Read the rsync manual', cmd: 'man rsync' },
      ]},
      { name: 'which', desc: 'Show the full path of the binary a command resolves to.', steps: [
        { note: 'Which dbt am I actually running?', cmd: 'which dbt' },
      ]},
      { name: 'history', desc: 'Show or search previously run commands.', steps: [
        { note: 'Find a past dbt run command', cmd: 'history | grep "dbt run"' },
        { note: 'Re-run command number 512', cmd: '!512' },
      ]},
      { name: 'ln', desc: 'Create links between files (usually symbolic).', steps: [
        { note: 'Symlink a shared profiles file into ~/.dbt', cmd: 'ln -s /opt/dbt/profiles.yml ~/.dbt/profiles.yml' },
      ]},
      { name: 'xargs', desc: 'Turn piped input into arguments for another command.', steps: [
        { note: 'Delete every .log file find locates', cmd: 'find . -name "*.log" | xargs rm -f' },
        { note: 'grep across a filtered file list', cmd: 'find models -name "*.sql" | xargs grep -l "full_refresh"' },
      ]},
    ]},
    { name: "System & Services", label: "sudo / systemctl / journalctl / crontab / lsof / ss / watch / uname", target: "lx-sys", commands: [
      { name: "sudo", desc: "Runs a command with another user's privileges, normally root.", steps: [
        { note: "Run one command as root", cmd: "sudo apt update" },
        { note: "Run as a different user", cmd: "sudo -u postgres psql" },
        { note: "Re-run the previous command as root", cmd: "sudo !!" },
      ]},
      { name: "whoami / uname / uptime / date", desc: "Quick facts about the current user, OS, machine load and time.", steps: [
        { note: "Current user", cmd: "whoami" },
        { note: "Kernel and architecture", cmd: "uname -a" },
        { note: "How long the machine has been up, and load average", cmd: "uptime" },
        { note: "ISO date for filenames", cmd: "date +%F" },
      ]},
      { name: "systemctl", desc: "Starts, stops and inspects services on systems that use systemd.", steps: [
        { note: "Check a service", cmd: "systemctl status nginx" },
        { note: "Restart it", cmd: "sudo systemctl restart nginx" },
        { note: "Start now and on every boot", cmd: "sudo systemctl enable --now nginx" },
      ]},
      { name: "journalctl", desc: "Reads logs collected by systemd.", steps: [
        { note: "Logs for one service from the last hour", cmd: "journalctl -u nginx --since \"1 hour ago\"" },
        { note: "Follow logs live", cmd: "journalctl -u nginx -f" },
        { note: "Only errors from the current boot", cmd: "journalctl -p err -b" },
      ]},
      { name: "crontab", desc: "Schedules commands to run at fixed times.", steps: [
        { note: "List your jobs", cmd: "crontab -l" },
        { note: "Edit your jobs", cmd: "crontab -e" },
        { note: "Example entry: nightly build at 02:00, logging output", cmd: "0 2 * * * cd /opt/dbt && dbt build >> /var/log/dbt_nightly.log 2>&1" },
      ]},
      { name: "lsof", desc: "Lists open files, including network sockets, and the process that owns each.", steps: [
        { note: "Which process is using port 8080?", cmd: "lsof -i :8080" },
        { note: "Files opened by a given process", cmd: "lsof -p 1234" },
      ]},
      { name: "ss", desc: "Shows network sockets. Modern replacement for netstat on Linux.", steps: [
        { note: "Listening TCP/UDP ports with process names", cmd: "sudo ss -tulpn" },
      ]},
      { name: "watch", desc: "Re-runs a command every few seconds and shows the output. Not installed by default on macOS.", steps: [
        { note: "Watch free disk space every 5 seconds", cmd: "watch -n 5 df -h" },
      ]},
    ]},
    { name: "Everyday Utilities", label: "tree / stat / diff / tee / jq / zip / alias / dig", target: "lx-util", commands: [
      { name: "tree", desc: "Prints a directory as an indented tree. Install with brew or apt if missing.", steps: [
        { note: "Two levels deep", cmd: "tree -L 2" },
        { note: "Skip noisy folders", cmd: "tree -I \"target|dbt_packages|.git\"" },
      ]},
      { name: "stat", desc: "Shows detailed file info: size, permissions, owner, timestamps.", steps: [
        { note: "Full details", cmd: "stat run.sh" },
        { note: "Octal permissions and owner (Linux)", cmd: "stat -c '%a %U' run.sh" },
      ]},
      { name: "diff", desc: "Compares two files or folders line by line.", steps: [
        { note: "Unified diff of two files", cmd: "diff -u old.sql new.sql" },
        { note: "List files that differ between two folders", cmd: "diff -rq models_old/ models/" },
      ]},
      { name: "tee", desc: "Copies input to both the screen and a file.", steps: [
        { note: "Watch a build and save the log", cmd: "dbt build 2>&1 | tee build.log" },
        { note: "Append to a root-owned file", cmd: "echo \"10.0.0.5 db.internal\" | sudo tee -a /etc/hosts" },
      ]},
      { name: "jq", desc: "Parses and filters JSON on the command line.", steps: [
        { note: "Pretty-print a JSON file", cmd: "jq . target/run_results.json" },
        { note: "List dbt nodes that errored", cmd: "jq -r '.results[] | select(.status==\"error\") | .unique_id' target/run_results.json" },
      ]},
      { name: "zip / unzip", desc: "Creates and extracts .zip archives, which Windows users can open directly.", steps: [
        { note: "Zip a folder", cmd: "zip -r backup.zip models/" },
        { note: "List contents without extracting", cmd: "unzip -l backup.zip" },
        { note: "Extract into a folder", cmd: "unzip backup.zip -d restore/" },
      ]},
      { name: "alias", desc: "Defines a shortcut for a longer command. Add it to ~/.zshrc or ~/.bashrc to keep it.", steps: [
        { note: "Shortcut for a detailed listing", cmd: "alias ll='ls -lah'" },
        { note: "Shortcut for git status", cmd: "alias gs='git status'" },
        { note: "Remove an alias", cmd: "unalias gs" },
      ]},
      { name: "dig", desc: "Queries DNS records.", steps: [
        { note: "Just the IP address", cmd: "dig example.com +short" },
        { note: "Mail servers", cmd: "dig MX example.com" },
      ]},
    ]},
  ]},
];

(function renderDropdowns() {
  const catSel = document.getElementById('dd-cat');
  const groupSel = document.getElementById('dd-group');
  const cmdSel = document.getElementById('dd-cmd');
  const panel = document.getElementById('example-panel');
  if (!catSel || !groupSel || !cmdSel || !panel) return;

  const mk = (tag, cls, txt) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  };

  function option(value, label, disabled) {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = label;
    if (disabled) { o.disabled = true; o.selected = true; }
    return o;
  }

  function showEmpty(msg) {
    panel.innerHTML = '';
    panel.appendChild(mk('div', 'ep-empty', msg || 'Select a command above to see a structured example.'));
  }

  // Jump to a command card: expand its category, scroll to it, flash for 0.5s.
  function highlightCard(card) {
    // Solid highlight held for 1s, then a quick fade. Uses inline styles so it
    // still shows even when prefers-reduced-motion disables @keyframes.
    card.style.transition = 'none';
    card.style.borderColor = 'var(--accent)';
    card.style.boxShadow = '0 0 0 3px rgba(88,166,255,.6)';
    card.style.background = 'rgba(88,166,255,.16)';
    setTimeout(() => {
      card.style.transition = 'box-shadow .35s ease, border-color .35s ease, background .35s ease';
      card.style.borderColor = '';
      card.style.boxShadow = '';
      card.style.background = '';
      setTimeout(() => { card.style.transition = ''; }, 400);
    }, 1000);
  }

  function jumpToCard(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    // The target may be a <section> (use its first card) or a .cmd card itself.
    const card = el.classList.contains('cmd') ? el : (el.querySelector('.cmd') || el);

    // Expand EVERY collapsed category wrapper above the card so it is visible.
    let anc = card.parentElement;
    while (anc) {
      if (anc.classList && anc.classList.contains('cat-block')) {
        anc.classList.remove('collapsed');
        const head = anc.querySelector('.cat-head');
        if (head) head.setAttribute('aria-expanded', 'true');
      }
      anc = anc.parentElement;
    }
    // Switch to the tab that owns this card.
    const owner = card.closest('.cat-block');
    if (owner && window.__setTab) {
      const c = ['dbt', 'git', 'linux'].find(x => owner.classList.contains('cat-' + x));
      if (c) window.__setTab(c);
    }

    // Force the card painted even if reveal-on-scroll left it at opacity:0.
    // Also reveal every card in the target section so layout heights are final
    // before we measure (avoids a stale scroll target).
    const host = card.closest('section') || card;
    host.querySelectorAll('.cmd').forEach(c => {
      c.classList.add('reveal', 'shown');
      c.style.opacity = '1';
      c.style.transform = 'none';
    });

    const headerH = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--header-h')) || 64;

    // Let the just-expanded category lay out, then jump to the card using a
    // manually computed absolute position. The jump is INSTANT: the target can
    // be a full page away, and the page's global `scroll-behavior: smooth` would
    // otherwise turn it into a slow ~1s glide that looks like nothing happened.
    // We temporarily override that CSS to guarantee an immediate jump.
    setTimeout(() => {
      const htmlEl = document.documentElement;
      const prev = htmlEl.style.scrollBehavior;
      htmlEl.style.scrollBehavior = 'auto';
      const rect = card.getBoundingClientRect();
      const targetY = Math.max(0, window.scrollY + rect.top - headerH - 24);
      window.scrollTo(0, targetY);
      htmlEl.style.scrollBehavior = prev;
      highlightCard(card);
    }, 100);
  }

  function showExample(cmd, group) {
    panel.innerHTML = '';
    const head = mk('div', 'ep-head');
    const title = mk('h4', 'ep-link', cmd.name);
    title.setAttribute('role', 'button');
    title.setAttribute('tabindex', '0');
    title.title = 'Open this command in the reference below';
    const go = () => jumpToCard(group.target);
    title.addEventListener('click', go);
    title.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    head.appendChild(title);
    const path = mk('span', 'ep-path', `${group.name} · ${group.label}`);
    head.appendChild(path);
    panel.appendChild(head);

    const body = mk('div', 'ep-body');
    if (cmd.desc) body.appendChild(mk('p', 'ep-desc', cmd.desc));

    // Dedicated, obvious jump control.
    const jumpBtn = mk('button', 'ep-jump', 'Go to this command in the reference ↓');
    jumpBtn.type = 'button';
    jumpBtn.addEventListener('click', () => jumpToCard(group.target));
    body.appendChild(jumpBtn);

    cmd.steps.forEach((step, i) => {
      const row = mk('div', 'ex-step');
      row.appendChild(mk('span', 'ex-num', String(i + 1)));
      row.appendChild(mk('span', 'ex-note', step.note));
      const code = mk('div', 'ex-cmd');
      code.textContent = step.cmd;
      // click-to-copy
      const copy = mk('button', 'copy-btn', 'Copy');
      copy.type = 'button';
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(step.cmd); }
        catch {
          const ta = document.createElement('textarea');
          ta.value = step.cmd; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch {}
          ta.remove();
        }
        copy.textContent = 'Copied!'; copy.classList.add('copied');
        setTimeout(() => { copy.textContent = 'Copy'; copy.classList.remove('copied'); }, 1500);
      });
      code.appendChild(copy);
      row.appendChild(code);
      body.appendChild(row);
    });
    panel.appendChild(body);
  }

  // --- Populate category dropdown ---
  catSel.appendChild(option('', 'Choose a category…', true));
  treeData.forEach((cat, i) => catSel.appendChild(option(String(i), cat.label)));

  function resetSelect(sel, placeholder) {
    sel.innerHTML = '';
    sel.appendChild(option('', placeholder, true));
    sel.disabled = true;
  }
  resetSelect(groupSel, 'Choose a group…');
  resetSelect(cmdSel, 'Choose a command…');

  catSel.addEventListener('change', () => {
    const cat = treeData[catSel.value];
    resetSelect(groupSel, 'Choose a group…');
    resetSelect(cmdSel, 'Choose a command…');
    showEmpty();
    if (!cat) return;
    cat.groups.forEach((g, i) => groupSel.appendChild(option(String(i), g.name + ' — ' + g.label)));
    groupSel.disabled = false;
  });

  groupSel.addEventListener('change', () => {
    const cat = treeData[catSel.value];
    const group = cat && cat.groups[groupSel.value];
    resetSelect(cmdSel, 'Choose a command…');
    showEmpty();
    if (!group) return;
    group.commands.forEach((c, i) => cmdSel.appendChild(option(String(i), c.name)));
    cmdSel.disabled = false;
  });

  cmdSel.addEventListener('change', () => {
    const cat = treeData[catSel.value];
    const group = cat && cat.groups[groupSel.value];
    const cmd = group && group.commands[cmdSel.value];
    if (cmd) showExample(cmd, group);
    else showEmpty();
  });
})();

/* ---------- Collapsible command sections ---------- */
(function makeCategoriesCollapsible() {
  // Collapse only at the top category level (dbt / git / linux). A single
  // category may span several <section> elements (e.g. linux), so group all
  // sections sharing a category badge under one collapsible wrapper.
  const main = document.querySelector('main');
  const sections = Array.from(main.querySelectorAll(':scope > section'));

  const catOf = (sec) => {
    const badge = sec.querySelector(':scope > h2 .badge');
    if (!badge) return null;
    return ['dbt', 'git', 'linux'].find(c => badge.classList.contains(c)) || null;
  };

  // Build ordered [cat, [sections...]] groups from consecutive sections.
  const groups = [];
  sections.forEach(sec => {
    const cat = catOf(sec);
    if (!cat) return; // skip the Command Explorer section
    const last = groups[groups.length - 1];
    if (last && last.cat === cat) last.secs.push(sec);
    else groups.push({ cat: cat, secs: [sec] });
  });

  groups.forEach(group => {
    const first = group.secs[0];

    // Wrapper that holds the category header + all its sections.
    const wrap = document.createElement('div');
    wrap.className = `cat-block cat-${group.cat}`;
    first.parentNode.insertBefore(wrap, first);

    // Category header bar.
    const header = document.createElement('div');
    header.className = 'cat-head';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'true');

    const badge = document.createElement('span');
    badge.className = `badge ${group.cat}`;
    badge.textContent = group.cat;
    const title = document.createElement('span');
    title.className = 'cat-title';
    title.textContent = { dbt: 'dbt', git: 'Git', linux: 'Linux' }[group.cat];
    const twist = document.createElement('span');
    twist.className = 'sec-twist';
    twist.textContent = '▾';

    header.appendChild(badge);
    header.appendChild(title);
    header.appendChild(twist);
    wrap.appendChild(header);

    // Body holds the sections; move them in order.
    const body = document.createElement('div');
    body.className = 'cat-body';
    group.secs.forEach(sec => body.appendChild(sec));
    wrap.appendChild(body);

    const toggle = () => {
      const collapsed = wrap.classList.toggle('collapsed');
      header.setAttribute('aria-expanded', String(!collapsed));
    };
    header.addEventListener('click', toggle);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
})();

/* ---------- Category tabs ---------- */
(function categoryTabs() {
  const CATS = ['dbt', 'git', 'linux'];
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const blocks = {};
  CATS.forEach(c => { const b = document.querySelector('.cat-block.cat-' + c); if (b) blocks[c] = b; });
  // Tag each sidebar group with its category so only the active one shows.
  let cur = null;
  document.querySelectorAll('nav > *').forEach(el => {
    if (el.tagName === 'H3') {
      const t = el.textContent.trim().toLowerCase();
      cur = blocks[t] ? t : null;
    }
    if (cur) el.dataset.cat = cur;
  });
  tabs.forEach(t => {
    const b = blocks[t.dataset.cat];
    const n = t.querySelector('.tab-count');
    if (b && n) n.textContent = b.querySelectorAll('.cmd').length;
  });
  function setTab(cat) {
    if (!blocks[cat]) return;
    tabs.forEach(t => {
      const on = t.dataset.cat === cat;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    CATS.forEach(c => { if (blocks[c]) blocks[c].classList.toggle('tab-hidden', c !== cat); });
    document.querySelectorAll('nav [data-cat]').forEach(el => el.classList.toggle('tab-hidden', el.dataset.cat !== cat));
    try { localStorage.setItem('command-reference-tab', cat); } catch {}
  }
  window.__setTab = setTab;
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => {
      setTab(t.dataset.cat);
      // If the reader is deep in the page, bring the top of the new tab into view.
      const top = blocks[t.dataset.cat].getBoundingClientRect().top + window.scrollY - 150;
      if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
    });
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      next.focus(); setTab(next.dataset.cat);
    });
  });
  // While searching, show matches from every category.
  function syncSearch() {
    const searching = search.value.trim() !== '';
    document.body.classList.toggle('searching', searching);
    CATS.forEach(c => {
      const b = blocks[c];
      if (b) b.classList.toggle('no-match', searching && !b.querySelector('.cmd:not(.hidden)'));
    });
  }
  search.addEventListener('input', syncSearch);
  search.addEventListener('keyup', syncSearch);
  // Pick the starting tab: URL hash > last used > dbt.
  function fromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const el = id && document.getElementById(id);
    const owner = el && el.closest('.cat-block');
    const c = owner && CATS.find(x => owner.classList.contains('cat-' + x));
    if (c) { setTab(c); setTimeout(() => el.scrollIntoView(), 50); }
  }
  let saved = null;
  try { saved = localStorage.getItem('command-reference-tab'); } catch {}
  setTab(blocks[saved] ? saved : 'dbt');
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
/* ---------- Readable examples: separate comments from commands ---------- */
(function formatExamples() {
  document.querySelectorAll('pre.example code').forEach(code => {
    const lines = code.textContent.replace(/\s+$/, '').split('\n');
    code.textContent = '';
    lines.forEach(line => {
      if (!line.trim()) return; // spacing now comes from CSS margins
      const d = document.createElement('span');
      d.className = /^\s*#/.test(line) ? 'ln note' : 'ln cmdline';
      d.textContent = line;
      code.appendChild(d);
    });
  });
})();
/* ---------- Reveal cards on scroll ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  cards.forEach(c => c.classList.add('reveal'));
  const reveal = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('shown');
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
  cards.forEach(c => reveal.observe(c));
}
