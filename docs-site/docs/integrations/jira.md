BrowserStack / TM / ADO → normalize into FailureContext → render Jira template → create issue

1) What data sources we have (and what each gives us)
A) BrowserStack Automate (most important)

From a failed build or session, Automate can give you:

Build name, build id, status, duration

Session name, session id, status

Capabilities: browser/os/device

Public URL

Artifacts: video/logs/screenshot/console/network (depends on what’s enabled)

✅ You’re already fetching builds successfully (27 builds), and you already have public_url in your logs.

Next step is: for a given build, fetch sessions, then fetch session details.

B) BrowserStack Test Management (TM)

TM gives you:

test case name/id, status

run id, project id

sometimes linked defects (if you use that)

folder path, owner, tags (depending on usage)

Use TM mainly for:

test naming consistency

mapping “failed test case → metadata”

C) Azure DevOps pipeline run (if your runner is ADO)

This is where you get:

repo name

branch/ref

commit sha

pipeline run URL

build number

This becomes your traceability:

“this defect came from pipeline run X on branch Y commit Z”

D) Local repo (optional)

If you’re scanning repos under Documents/Axis-Workspace, you can get:

file path of the spec

last commit touching the file (optional)

helpful for linking “test file” in the defect

But this is optional — you can ship without it.

2) The key: define a single FailureContext object

In your main process, create a normalized object that everything maps into.

```typescript
type FailureContext = {
  source: "automate" | "tm";
  createdAt: string; // ISO
  axisRunId?: string;

  test?: {
    name?: string;
    id?: string;
    filePath?: string;
    tags?: string[];
  };

  automate?: {
    buildName?: string;
    buildHashedId?: string;
    buildUrl?: string;

    sessionName?: string;
    sessionHashedId?: string;
    sessionUrl?: string;

    status?: string;
    durationSec?: number;

    caps?: {
      os?: string;
      osVersion?: string;
      browser?: string;
      browserVersion?: string;
      device?: string;
      realMobile?: boolean;
    };

    artifacts?: {
      videoUrl?: string;
      logsUrl?: string;
      consoleUrl?: string;
      networkUrl?: string; // HAR if available
      screenshotUrl?: string;
    };

    error?: {
      message?: string;
      stack?: string;
    };
  };

  ado?: {
    pipelineRunId?: string;
    pipelineRunUrl?: string;
    repo?: string;
    branch?: string;
    commit?: string;
  };
};
```


This is the “truth object”. Jira is just one output format of it.

3) How do we actually populate it?
Step 1 — From UI selection, we always start with an identifier

User clicks “Create Jira Bug” from either:

a Build row (has build hashed_id / public_url)

a Session row (has session hashed_id)

a TM test case (has test case id + project)

Axis already has these IDs because you’re listing builds / test cases.

Step 2 — Enrichment calls happen in main process

When user clicks “Create Jira Bug”:

call buildFailureContext(input) in main

main calls:

Automate API: get build + sessions + session details

TM API: get test case details (if starting from TM)

ADO API: get run details (if you have correlation key)

Then main returns a fully populated FailureContext to renderer for preview.

4) Where do error message / stack come from?

There are 3 ways (use in this order):

✅ Best: pull from runner output (ADO logs)

Your ADO pipeline knows the actual test failure output (Playwright/JUnit).
So you can:

store it as artifact (JUnit XML / JSON)

or expose it via ADO logs

Axis can fetch run logs + parse out failure summary.

✅ Good: pull from BrowserStack session logs

Automate often provides:

console logs

session logs

sometimes error reason
Even if you can’t extract a perfect stack, you can link logs/video.

✅ Acceptable for v1: just include evidence links + test name

Dev can open the video/logs and see the failure.

So v1 does:

summary + expected/actual

links to session evidence

no fancy parsing

5) How do we get commit / branch / pipeline run URL?

This is solved by correlation key (you already planned this).

In your ADO pipeline, set BrowserStack build name like:

```
Axis|adoRun=<RUN_ID>|repo=<REPO>|branch=<BRANCH>
```

Then Axis:

reads build name

extracts adoRunId/repo/branch

uses ADO API to fetch run URL + commit

This gives you traceability for Jira automatically.

6) Jira defect creation becomes simple

Once you have FailureContext, Jira creation is just:

summary = ...

description = renderTemplate(FailureContext)

labels = ['axis', 'automation', <component>]

optional fields = priority/component/etc

What to implement first (fastest path)
V1 (works immediately)

Add “Create Jira Bug” button on failure detail

Build FailureContext with:

test name (from TM or session)

BrowserStack build/session public_url

caps (browser/os/device if available)

Render description template with links only

Create Jira issue

No parsing. No attachments. Still huge value.