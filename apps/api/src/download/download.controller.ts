import { Controller, Get, Header, NotFoundException, Res } from "@nestjs/common";
import type { Response } from "express";
import { createHash } from "node:crypto";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Public } from "../auth/auth.guards";

const APK_NAME = "hel-calafkaaga.apk";
const WEBSITE_INSTALL_URL = "https://www.helcalafkaaga.com/download";
/** Shown on the install page so users can confirm they have the latest build. */
const APP_BUILD_LABEL = "2026-07-27 · Message on Discover";

function resolveDownloadDir(): string {
  const candidates = [
    join(process.cwd(), "public", "download"),
    join(process.cwd(), "apps", "api", "public", "download"),
    join(__dirname, "..", "..", "public", "download"),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, APK_NAME)) || existsSync(dir)) return dir;
  }
  return candidates[0]!;
}

@Controller("download")
export class DownloadController {
  private apkPath() {
    return join(resolveDownloadDir(), APK_NAME);
  }

  private localMeta() {
    const apk = this.apkPath();
    if (!existsSync(apk)) return null;
    const buf = readFileSync(apk);
    return {
      path: apk,
      size: buf.length,
      sizeMb: (buf.length / (1024 * 1024)).toFixed(1),
      sha256: createHash("sha256").update(buf).digest("hex"),
    };
  }

  @Public()
  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  installPage(@Res() res: Response) {
    const meta = this.localMeta();
    const ready = !!meta;
    const shortHash = meta ? meta.sha256.slice(0, 12) : "pending";
    const href = ready
      ? `/download/${APK_NAME}?v=${shortHash}`
      : WEBSITE_INSTALL_URL;

    res.setHeader("Cache-Control", "no-store");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="Cache-Control" content="no-store" />
  <title>Install Hel Calafkaaga</title>
  <style>
    :root { color-scheme: light; --brand:#a61b2b; --ink:#1a1214; --paper:#faf7f6; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100dvh; font-family: system-ui, sans-serif;
      background: radial-gradient(80% 50% at 20% 0%, #f8e9eb, transparent), var(--paper);
      color: var(--ink); display: grid; place-items: center; padding: 1.5rem;
    }
    main {
      width: min(100%, 26rem); background: #fff; border: 1px solid #e7dcde;
      border-radius: 1.35rem; padding: 1.5rem; box-shadow: 0 18px 40px rgba(28,20,22,.08);
    }
    h1 { font-size: 1.55rem; margin: 0 0 .5rem; }
    p { line-height: 1.5; color: #6b5c5f; }
    .badge {
      display: inline-block; margin: 0 0 .75rem; padding: .35rem .7rem;
      border-radius: 999px; background: #f8e9eb; color: var(--brand);
      font-size: .75rem; font-weight: 700;
    }
    .whats-new {
      margin-top: 1rem; padding: .9rem 1rem; border-radius: 1rem;
      background: #faf7f6; border: 1px solid #e7dcde;
    }
    .whats-new h2 { font-size: .85rem; margin: 0 0 .45rem; color: var(--ink); }
    .whats-new ul { margin: 0; padding-left: 1.1rem; color: #6b5c5f; }
    .whats-new li { margin: .25rem 0; }
    .btn {
      display: block; text-align: center; text-decoration: none; margin-top: 1rem;
      background: var(--brand); color: #fff; font-weight: 700; border-radius: 999px;
      padding: .95rem 1rem;
    }
    .btn[aria-disabled="true"] { opacity: .45; pointer-events: none; }
    ol { padding-left: 1.2rem; color: #6b5c5f; }
    li { margin: .35rem 0; }
    .meta { font-size: .85rem; margin-top: 1rem; }
    a.alt { color: var(--brand); }
    code { font-size: .8em; }
  </style>
</head>
<body>
  <main>
    <div class="badge">Latest build · ${APP_BUILD_LABEL}</div>
    <h1>Install Hel Calafkaaga</h1>
    <p>Android app for halal marriage matchmaking. Tap download, then open the file to install.</p>
    <div class="whats-new">
      <h2>What's new</h2>
      <ul>
        <li><strong>Message</strong> button on Discover — chat without mutual likes</li>
        <li>Start chat API: <code>POST /matches/start-chat</code></li>
        <li>Build id: <code>${shortHash}</code></li>
      </ul>
    </div>
    <a class="btn" href="${href}" ${ready ? "" : 'aria-disabled="true"'}>
      ${ready ? `Download APK (${meta!.sizeMb} MB)` : "APK not uploaded yet"}
    </a>
    <p class="meta"><strong>On your phone:</strong></p>
    <ol>
      <li>Open this page in Chrome / Samsung Internet</li>
      <li>Tap <em>Download APK</em></li>
      <li>Allow install from this browser if asked</li>
      <li>Open the downloaded file → Install (replace old app if asked)</li>
    </ol>
    <p class="meta">Package: <code>com.telcalafkaaga.app</code></p>
    <p class="meta">Also on website: <a class="alt" href="${WEBSITE_INSTALL_URL}">helcalafkaaga.com/download</a></p>
  </main>
</body>
</html>`);
  }

  @Public()
  @Get(APK_NAME)
  downloadApk(@Res() res: Response) {
    const meta = this.localMeta();
    if (!meta) {
      throw new NotFoundException(
        "APK not found. Redeploy with apps/api/public/download/hel-calafkaaga.apk included."
      );
    }
    res.setHeader("Content-Type", "application/vnd.android.package-archive");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${APK_NAME}"`
    );
    res.setHeader("Content-Length", String(meta.size));
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-APK-SHA256", meta.sha256);
    createReadStream(meta.path).pipe(res);
  }

  @Public()
  @Get("status")
  status() {
    const meta = this.localMeta();
    return {
      buildLabel: APP_BUILD_LABEL,
      localApkReady: !!meta,
      localSize: meta?.size ?? null,
      localSha256: meta?.sha256 ?? null,
      downloadUrl: `/download/${APK_NAME}`,
      websiteInstall: WEBSITE_INSTALL_URL,
      installPage: "/download",
      whatsNew: [
        "Message button on Discover",
        "Chat without mutual likes",
        "POST /matches/start-chat",
      ],
    };
  }
}
