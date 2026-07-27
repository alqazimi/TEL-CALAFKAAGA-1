import { Controller, Get, Header, Res } from "@nestjs/common";
import type { Response } from "express";
import { createReadStream, existsSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Public } from "../auth/auth.guards";

const APK_NAME = "hel-calafkaaga.apk";
/** Canonical APK host — Vercel updates reliably; Render Docker images often lag. */
const WEBSITE_APK_URL =
  "https://www.helcalafkaaga.com/download/hel-calafkaaga.apk";
const WEBSITE_INSTALL_URL = "https://www.helcalafkaaga.com/download";

function resolveDownloadDir(): string {
  const candidates = [
    join(process.cwd(), "public", "download"),
    join(process.cwd(), "apps", "api", "public", "download"),
    // Compiled: dist/ → ../public/download
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

  @Public()
  @Get()
  @Header("Content-Type", "text/html; charset=utf-8")
  installPage(@Res() res: Response) {
    const apk = this.apkPath();
    const readyLocal = existsSync(apk);
    const sizeMb = readyLocal
      ? (statSync(apk).size / (1024 * 1024)).toFixed(1)
      : null;
    // Always offer the website APK so installs stay current even if this
    // Render instance still has an older file baked into the Docker image.
    const downloadHref = WEBSITE_APK_URL;
    const sizeLabel = sizeMb ? ` (~${sizeMb} MB)` : "";

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
    .btn {
      display: block; text-align: center; text-decoration: none; margin-top: 1rem;
      background: var(--brand); color: #fff; font-weight: 700; border-radius: 999px;
      padding: .95rem 1rem;
    }
    ol { padding-left: 1.2rem; color: #6b5c5f; }
    li { margin: .35rem 0; }
    .meta { font-size: .85rem; margin-top: 1rem; }
    a.alt { color: var(--brand); }
  </style>
</head>
<body>
  <main>
    <h1>Install Hel Calafkaaga</h1>
    <p>Android app for halal marriage matchmaking. Tap download, then open the file to install.</p>
    <a class="btn" href="${downloadHref}">
      Download APK${sizeLabel}
    </a>
    <p class="meta"><strong>On your phone:</strong></p>
    <ol>
      <li>Open this page in Chrome / Samsung Internet</li>
      <li>Tap <em>Download APK</em></li>
      <li>Allow install from this browser if asked</li>
      <li>Open the downloaded file → Install</li>
    </ol>
    <p class="meta">Package: <code>com.telcalafkaaga.app</code></p>
    <p class="meta">Also: <a class="alt" href="${WEBSITE_INSTALL_URL}">${WEBSITE_INSTALL_URL.replace("https://", "")}</a></p>
  </main>
</body>
</html>`);
  }

  @Public()
  @Get(APK_NAME)
  downloadApk(@Res() res: Response) {
    // Prefer the website file so phones always get the latest APK even when
    // this Render container still has a stale baked-in copy.
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(302, WEBSITE_APK_URL);
  }

  /** Ops helper: compare local vs expected without downloading the APK. */
  @Public()
  @Get("status")
  status() {
    const apk = this.apkPath();
    const ready = existsSync(apk);
    let sha256: string | null = null;
    let size: number | null = null;
    if (ready) {
      const buf = readFileSync(apk);
      size = buf.length;
      sha256 = createHash("sha256").update(buf).digest("hex");
    }
    return {
      localApkReady: ready,
      localSize: size,
      localSha256: sha256,
      canonicalApkUrl: WEBSITE_APK_URL,
      installPage: "/download",
    };
  }
}
