import {existsSync, readFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {validateEpisode} from "./schema.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

export function runPreflight({dir, production = false}) {
  const episodePath = join(dir, "episode.json");
  const generationPath = join(dir, "generation-plan.json");
  if (!existsSync(episodePath)) throw new Error(`缺少 ${episodePath}`);
  if (!existsSync(generationPath)) throw new Error(`缺少 ${generationPath}`);

  const episode = readJson(episodePath);
  const generationPlan = readJson(generationPath);
  const series = readJson(join(HERE, "story", "series.json"));
  const state = readJson(join(HERE, "story", "state.json"));
  const template = readJson(join(HERE, "template.json"));
  const result = validateEpisode(episode, {series, state, template, generationPlan});

  const productionBlockers = [];
  if (episode.status !== "approved-for-generation") productionBlockers.push("episode.status 不是 approved-for-generation");
  if (generationPlan.paidExecutionAllowed !== true) productionBlockers.push("generation-plan.paidExecutionAllowed 不是 true");
  if (template.production.paidGenerationAllowed !== true) productionBlockers.push("template.production.paidGenerationAllowed 不是 true");

  const approvalPath = join(dir, template.production.approvalFile);
  if (!existsSync(approvalPath)) {
    productionBlockers.push(`缺少用户审批文件: ${approvalPath}`);
  } else {
    const approval = readJson(approvalPath);
    if (approval.approvalPhrase !== template.production.requiredApprovalPhrase) productionBlockers.push("审批语句不匹配");
    if (approval.episodeHash !== result.episodeHash) productionBlockers.push("审批 episodeHash 与当前 episode 不一致");
    if (approval.approved !== true) productionBlockers.push("approval.approved 不是 true");
  }

  const report = {
    designPass: result.ok,
    productionReady: result.ok && productionBlockers.length === 0,
    mode: production ? "production" : "design-only",
    episodeId: episode.episodeId,
    episodeHash: result.episodeHash,
    totalMs: result.totalMs,
    renderFrames: result.renderFrames,
    targetFrames: result.targetFrames,
    trueVideoCoverage: Number((result.trueVideoCoverage ?? 0).toFixed(4)),
    remotionEnhancedCoverage: Number((result.remotionEnhancedCoverage ?? 0).toFixed(4)),
    dynamicCoverage: Number((result.trueVideoCoverage ?? 0).toFixed(4)),
    plannedVideoSeconds: result.plannedVideoSeconds,
    paidCallsAttempted: false,
    errors: result.errors,
    warnings: result.warnings,
    productionBlockers,
  };

  if (!result.ok || (production && productionBlockers.length)) {
    const error = new Error(JSON.stringify(report, null, 2));
    error.report = report;
    throw error;
  }
  return report;
}

if (process.argv[1] && process.argv[1].endsWith("preflight.mjs")) {
  const input = process.argv[2];
  if (!input) throw new Error("用法: node templates/chinese-drama/preflight.mjs <episode-dir> [--production]");
  const report = runPreflight({dir: resolve(input), production: process.argv.includes("--production")});
  console.log(JSON.stringify(report, null, 2));
}
