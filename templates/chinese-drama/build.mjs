// chinese-drama 安全构建闸门。
//
// 默认模式只执行本地、只读的 design preflight，并以错误退出，避免通用构建器误写
// manifest/catalog。production 除了模板 preflight，还必须把虚构角色设定、
// generation plan 与外部钉住的审批文件逐一做 SHA-256 绑定。
// 任何 fal/TTS/媒体执行适配器都只能在全部校验完成后动态导入。
import {createHash} from "node:crypto";
import {existsSync, lstatSync, readFileSync, realpathSync} from "node:fs";
import {dirname, isAbsolute, join, relative, resolve, sep} from "node:path";
import {pathToFileURL} from "node:url";
import {runPreflight} from "./preflight.mjs";

const BUILD_MODE_ENV = "CHINESE_DRAMA_BUILD_MODE";
const APPROVAL_HASH_ENV = "CHINESE_DRAMA_APPROVAL_SHA256";
const DESIGN_ONLY = "design-only";
const PRODUCTION = "production";
const KEYFRAME_PHASE = "keyframes";
const I2V_PHASE = "i2v";
const PAID_ADAPTER_RELATIVE_PATH = "scripts/fal-video-adapter.mjs";

function failGate(message) {
  throw new Error(`[chinese-drama safety gate] ${message}`);
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || !value.trim()) failGate(`${label} 必须是非空字符串`);
  return value.trim();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeSha256(value, label) {
  const raw = nonEmptyString(value, label).toLowerCase();
  const hex = raw.startsWith("sha256:") ? raw.slice("sha256:".length) : raw;
  if (!/^[a-f0-9]{64}$/.test(hex)) failGate(`${label} 必须是 64 位 SHA-256（可带 sha256: 前缀）`);
  return hex;
}

function expectSha256(actual, expected, label) {
  const normalized = normalizeSha256(expected, label);
  if (actual !== normalized) failGate(`${label} 不匹配：期望 ${normalized}，实际 ${actual}`);
}

function assertInside(root, target, label) {
  const rel = relative(root, target);
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    failGate(`${label} 必须位于工作区内且不能指向工作区根目录`);
  }
}

function rejectSymlinkPath(root, target, label) {
  const rel = relative(root, target);
  let cursor = root;
  for (const part of rel.split(sep)) {
    cursor = join(cursor, part);
    if (existsSync(cursor) && lstatSync(cursor).isSymbolicLink()) {
      failGate(`${label} 禁止经过符号链接：${cursor}`);
    }
  }
}

function resolvePlannedPath(root, base, candidate, label) {
  const input = nonEmptyString(candidate, label);
  if (isAbsolute(input)) failGate(`${label} 必须是相对路径，禁止绝对路径`);
  const target = resolve(base, input);
  assertInside(root, target, label);
  assertInside(base, target, `${label}（相对所属目录）`);
  rejectSymlinkPath(root, target, label);
  return target;
}

function requireUnderDirectory(target, directory, label) {
  assertInside(resolve(directory), target, label);
}

function resolveInputFile(root, base, candidate, label) {
  const target = resolvePlannedPath(root, base, candidate, label);
  if (!existsSync(target)) failGate(`${label} 不存在：${candidate}`);
  if (!lstatSync(target).isFile()) failGate(`${label} 必须是普通文件：${candidate}`);
  const real = realpathSync(target);
  assertInside(root, real, `${label} 实际路径`);
  return real;
}

function resolveKnownInput(root, target, label) {
  return resolveInputFile(root, root, relative(root, resolve(target)), label);
}

function readJsonInput(root, target, label) {
  const path = resolveKnownInput(root, target, label);
  const raw = readFileSync(path);
  let data;
  try {
    data = JSON.parse(raw.toString("utf8"));
  } catch (error) {
    failGate(`${label} 不是合法 JSON：${error.message}`);
  }
  return {path, raw, hash: sha256(raw), data};
}

function getBuildMode() {
  const mode = (process.env[BUILD_MODE_ENV] || DESIGN_ONLY).trim().toLowerCase();
  if (mode !== DESIGN_ONLY && mode !== PRODUCTION) {
    failGate(`${BUILD_MODE_ENV} 只允许 ${DESIGN_ONLY} 或 ${PRODUCTION}，当前为 ${mode}`);
  }
  return mode;
}

function finiteNonNegative(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    failGate(`${label} 必须是非负有限数字`);
  }
  return value;
}

function validateGenerationPlan({root, dir, episode, generationPlan, template}) {
  if (!generationPlan || typeof generationPlan !== "object" || Array.isArray(generationPlan)) {
    failGate("generation-plan.json 顶层必须是对象");
  }
  if (generationPlan.provider !== "fal.ai") failGate("generation-plan.provider 只允许 fal.ai");
  if (!Array.isArray(generationPlan.assets) || generationPlan.assets.length === 0) {
    failGate("generation-plan.assets 必须是非空数组");
  }

  const allowedImageModels = new Set([
    template.image?.keyframeModel,
    template.image?.keyframeTextModel,
    template.image?.emptySceneModel,
    template.image?.economyEditModel,
    "fal-ai/flux-pro/kontext",
  ].filter(Boolean));
  const allowedVideoModels = new Set([
    template.video?.primaryModel,
    template.video?.economyModel,
  ].filter(Boolean));
  const ids = new Set();
  const outputs = new Set();
  const keyframes = new Map();
  const videos = [];
  let multiPersonKeyframes = 0;

  for (const [index, asset] of generationPlan.assets.entries()) {
    const label = `generation-plan.assets[${index}]`;
    if (!asset || typeof asset !== "object" || Array.isArray(asset)) failGate(`${label} 必须是对象`);
    const id = nonEmptyString(asset.id, `${label}.id`);
    if (ids.has(id)) failGate(`generation-plan asset id 重复：${id}`);
    ids.add(id);
    if (asset.kind !== "keyframe" && asset.kind !== "ai-video") {
      failGate(`${label}.kind=${asset.kind} 未列入付费 kind 白名单`);
    }
    const output = nonEmptyString(asset.output, `${label}.output`);
    const outputPath = resolvePlannedPath(root, dir, output, `${label}.output`);
    requireUnderDirectory(
      outputPath,
      join(dir, "assets", asset.kind === "keyframe" ? "keyframes" : "clips"),
      `${label}.output 目录`,
    );
    if (outputs.has(outputPath)) failGate(`generation-plan output 重复：${output}`);
    outputs.add(outputPath);
    if (existsSync(outputPath) && !lstatSync(outputPath).isFile()) {
      failGate(`${label}.output 已存在但不是普通文件：${output}`);
    }
    nonEmptyString(asset.prompt, `${label}.prompt`);
    if (asset.maxAttempts !== 1) failGate(`${label}.maxAttempts 必须显式且严格等于 1`);

    if (asset.kind === "keyframe") {
      if (!allowedImageModels.has(asset.model)) failGate(`${label}.model 不在模板图像模型白名单：${asset.model}`);
      if (!Number.isInteger(asset.characterCount) || asset.characterCount < 0 || asset.characterCount > 4) {
        failGate(`${label}.characterCount 必须是 0–4 的整数`);
      }
      if (asset.characterCount <= 1 && asset.model !== "fal-ai/flux-pro/kontext") {
        failGate(`${label}: 0/1 人关键帧必须使用 fal-ai/flux-pro/kontext`);
      }
      if (asset.characterCount >= 2) {
        multiPersonKeyframes += 1;
        if (asset.model !== "fal-ai/nano-banana-pro/edit") {
          failGate(`${label}: 多人关键帧必须使用 fal-ai/nano-banana-pro/edit`);
        }
      }
      if (!Array.isArray(asset.dependsOn)) failGate(`${label}.dependsOn 必须显式为数组`);
      if (!Array.isArray(asset.referenceInputs) || asset.referenceInputs.length === 0) {
        failGate(`${label}.referenceInputs 必须是非空数组`);
      }
      for (const [referenceIndex, reference] of asset.referenceInputs.entries()) {
        const value = nonEmptyString(reference, `${label}.referenceInputs[${referenceIndex}]`);
        if (!/^(identity|canonical|asset):[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)?$/.test(value)) {
          failGate(`${label}.referenceInputs[${referenceIndex}] 格式非法：${value}`);
        }
      }
      const value = {...asset, outputPath};
      keyframes.set(id, value);
    } else {
      if (!allowedVideoModels.has(asset.model)) failGate(`${label}.model 不在模板视频模型白名单：${asset.model}`);
      const maxClipSeconds = template.video?.maxClipSeconds ?? 5;
      if (!Number.isInteger(asset.durationSec) || asset.durationSec < 3 || asset.durationSec > maxClipSeconds) {
        failGate(`${label}.durationSec 必须是 3–${maxClipSeconds} 秒整数`);
      }
      if (asset.generateAudio !== false) failGate(`${label}.generateAudio 必须显式且严格等于 false`);
      nonEmptyString(asset.keyframeId, `${label}.keyframeId`);
      videos.push({...asset, outputPath});
    }
  }

  const maxMultiPersonKeyframes = template.image?.maxMultiPersonKeyframesPerEpisode ?? 1;
  if (multiPersonKeyframes > maxMultiPersonKeyframes) {
    failGate(`多人关键帧 ${multiPersonKeyframes} 张，超过模板上限 ${maxMultiPersonKeyframes} 张`);
  }

  const assetOrder = new Map(generationPlan.assets.map((asset, index) => [asset.id, index]));
  for (const [keyframeId, keyframe] of keyframes) {
    const dependencySet = new Set();
    for (const dependencyId of keyframe.dependsOn) {
      nonEmptyString(dependencyId, `${keyframeId}.dependsOn`);
      if (dependencySet.has(dependencyId)) failGate(`${keyframeId}.dependsOn 重复：${dependencyId}`);
      dependencySet.add(dependencyId);
      if (!keyframes.has(dependencyId)) failGate(`${keyframeId}.dependsOn 引用了非关键帧或不存在的资产：${dependencyId}`);
      if (assetOrder.get(dependencyId) >= assetOrder.get(keyframeId)) {
        failGate(`${keyframeId}.dependsOn=${dependencyId} 必须排在当前关键帧之前`);
      }
    }
    for (const reference of keyframe.referenceInputs) {
      if (!reference.startsWith("asset:")) continue;
      const referencedId = reference.slice("asset:".length);
      if (!dependencySet.has(referencedId)) failGate(`${keyframeId} 引用 ${reference} 时必须同时列入 dependsOn`);
    }
  }

  for (const video of videos) {
    if (!keyframes.has(video.keyframeId)) failGate(`${video.id}.keyframeId 引用了不存在的 keyframe：${video.keyframeId}`);
  }
  const budget = episode.budget || {};
  if (keyframes.size > budget.maxPaidKeyframes) failGate(`关键帧数量 ${keyframes.size} 超预算 ${budget.maxPaidKeyframes}`);
  if (videos.length > budget.maxPaidVideoClips) failGate(`AI 视频数量 ${videos.length} 超预算 ${budget.maxPaidVideoClips}`);
  const videoSeconds = videos.reduce((sum, asset) => sum + asset.durationSec, 0);
  if (videoSeconds > budget.maxGeneratedVideoSeconds + 0.001) {
    failGate(`AI 视频秒数 ${videoSeconds} 超预算 ${budget.maxGeneratedVideoSeconds}`);
  }
  if (budget.maxPaidAttemptsPerAsset !== 1 || budget.automaticPaidRetries !== 0) {
    failGate("episode budget 必须保持 maxPaidAttemptsPerAsset=1 且 automaticPaidRetries=0");
  }
  if (template.production?.automaticPaidRetries !== 0) failGate("template.production.automaticPaidRetries 必须严格等于 0");

  const cost = generationPlan.costEstimate;
  if (!cost || typeof cost !== "object" || Array.isArray(cost)) failGate("generation-plan.costEstimate 必须是对象");
  if (cost.automaticRetries !== 0) failGate("generation-plan.costEstimate.automaticRetries 必须严格等于 0");
  const plannedVideoUsd = finiteNonNegative(cost.plannedVideoUsd, "costEstimate.plannedVideoUsd");
  const plannedKeyframeUsd = finiteNonNegative(cost.plannedKeyframeCeilingUsd, "costEstimate.plannedKeyframeCeilingUsd");
  const firstPassUsd = finiteNonNegative(cost.firstPassCeilingUsd, "costEstimate.firstPassCeilingUsd");
  const costVideoSeconds = finiteNonNegative(cost.plannedVideoSeconds, "costEstimate.plannedVideoSeconds");
  if (Math.abs(costVideoSeconds - videoSeconds) > 0.001) {
    failGate(`costEstimate.plannedVideoSeconds=${cost.plannedVideoSeconds} 与素材计划 ${videoSeconds} 不一致`);
  }
  if (plannedVideoUsd + plannedKeyframeUsd > firstPassUsd + 0.001) {
    failGate("costEstimate.firstPassCeilingUsd 小于视频与关键帧预算之和");
  }
  if (firstPassUsd > budget.maxUsdFirstPass + 0.001) {
    failGate(`首轮成本上限 $${firstPassUsd} 超过 episode budget $${budget.maxUsdFirstPass}`);
  }

  const videoById = new Map(videos.map((asset) => [asset.id, asset]));
  const modernAnchorShots = [];
  const audioOutputs = new Map();
  const audioOutputPaths = new Set();
  for (const [index, shot] of (episode.shots || []).entries()) {
    const shotAssetPath = resolvePlannedPath(root, dir, shot.asset, `episode.shots[${index}].asset`);
    const shotAssetDirectory = shot.sourceType === "real-video"
      ? join(dir, "assets", "anchor")
      : shot.sourceType === "still-fallback"
        ? join(dir, "assets", "keyframes")
        : join(dir, "assets", "clips");
    requireUnderDirectory(shotAssetPath, shotAssetDirectory, `episode.shots[${index}].asset 目录`);
    if (shot.fallbackAsset) {
      const fallbackPath = resolvePlannedPath(root, dir, shot.fallbackAsset, `episode.shots[${index}].fallbackAsset`);
      requireUnderDirectory(fallbackPath, join(dir, "assets", "keyframes"), `episode.shots[${index}].fallbackAsset 目录`);
    }
    if (shot.audio?.dialogueAsset) {
      const audioPath = resolvePlannedPath(root, dir, shot.audio.dialogueAsset, `episode.shots[${index}].audio.dialogueAsset`);
      requireUnderDirectory(audioPath, join(dir, "audio"), `episode.shots[${index}].audio.dialogueAsset 目录`);
      if (audioOutputPaths.has(audioPath)) failGate(`dialogueAsset 输出路径重复：${shot.audio.dialogueAsset}`);
      audioOutputPaths.add(audioPath);
      audioOutputs.set(shot.id, audioPath);
    }
    if (shot.role === "modern-anchor") modernAnchorShots.push(shot);
    if (shot.sourceType === "ai-video") {
      const plannedVideo = videoById.get(shot.generationPromptId);
      const plannedKeyframe = plannedVideo && keyframes.get(plannedVideo.keyframeId);
      if (!plannedVideo || !plannedKeyframe || shot.fallbackAsset !== plannedKeyframe.output) {
        failGate(`${shot.id}: AI 视频、generationPromptId、keyframeId 与 fallbackAsset 未形成同一条绑定链`);
      }
    }
  }
  if (
    modernAnchorShots.length !== 1 ||
    modernAnchorShots[0].sourceType !== "ai-video" ||
    modernAnchorShots[0].asset !== episode.modernAnchor?.asset ||
    modernAnchorShots[0].audio?.originalClipAudio !== false
  ) {
    failGate("必须且只能有一条虚构林晚 modern-anchor AI shot，并关闭模型原声");
  }
  const localOutputs = new Set();
  for (const [index, operation] of (generationPlan.localPostprocess || []).entries()) {
    const label = `generation-plan.localPostprocess[${index}]`;
    if (operation.kind !== "local-no-api" || operation.paidCostUsd !== 0) {
      failGate(`${label} 只允许 paidCostUsd=0 的 local-no-api`);
    }
    const inputPath = resolvePlannedPath(root, dir, operation.input, `${label}.input`);
    const outputPath = resolvePlannedPath(root, dir, operation.output, `${label}.output`);
    requireUnderDirectory(inputPath, join(dir, "assets", "clips"), `${label}.input 目录`);
    requireUnderDirectory(outputPath, join(dir, "assets", "clips"), `${label}.output 目录`);
    if (outputs.has(outputPath) || localOutputs.has(outputPath)) failGate(`${label}.output 与其他媒体输出冲突`);
    localOutputs.add(outputPath);
  }
  return {keyframes, videos, audioOutputs};
}

function validateApprovedKeyframes({root, dir, approval, generationTrust, canonicalVersion}) {
  const requiredIds = [...new Set(generationTrust.videos.map((asset) => asset.keyframeId))].sort();
  if (requiredIds.length === 0) return {files: [], aggregateHash: sha256("[]")};
  if (!Array.isArray(approval.approvedKeyframes)) {
    failGate("I2V 前必须提供 approval.approvedKeyframes 逐张人工验脸记录");
  }
  const approvals = new Map();
  for (const [index, item] of approval.approvedKeyframes.entries()) {
    const label = `approval.approvedKeyframes[${index}]`;
    const id = nonEmptyString(item?.id, `${label}.id`);
    if (approvals.has(id)) failGate(`approvedKeyframes id 重复：${id}`);
    if (item.status !== "approved") failGate(`${label}.status 必须严格等于 approved`);
    if (item.canonicalVersion !== canonicalVersion) failGate(`${label}.canonicalVersion 与当前系列版本不一致`);
    nonEmptyString(item.approvedBy, `${label}.approvedBy`);
    const approvedAt = Date.parse(nonEmptyString(item.approvedAt, `${label}.approvedAt`));
    if (!Number.isFinite(approvedAt) || approvedAt > Date.now() + 5 * 60 * 1000) failGate(`${label}.approvedAt 无效或位于未来`);
    approvals.set(id, item);
  }

  const files = [];
  for (const id of requiredIds) {
    const planned = generationTrust.keyframes.get(id);
    const approved = approvals.get(id);
    if (!approved) failGate(`缺少关键帧人工验脸审批：${id}`);
    const path = resolveInputFile(root, dir, planned.output, `approved keyframe ${id}`);
    if (approved.path !== planned.output) failGate(`approved keyframe ${id}.path 与 generation-plan.output 不一致`);
    const actualHash = sha256(readFileSync(path));
    expectSha256(actualHash, approved.sha256, `approved keyframe ${id}.sha256`);
    files.push({id, path, relativePath: planned.output, sha256: actualHash});
  }
  const attestations = files.map(({id, relativePath, sha256: hash}) => ({id, path: relativePath, sha256: hash}));
  return {files, aggregateHash: sha256(JSON.stringify(attestations))};
}

function executionScopeFor(episode, generationTrust, phase) {
  const capabilities = new Set();
  const allowedAssetIds = [];
  const allowedAudioShotIds = [];
  if (phase === KEYFRAME_PHASE) {
    for (const asset of generationTrust.keyframes.values()) {
      if (!existsSync(asset.outputPath)) {
        capabilities.add("fal-image");
        allowedAssetIds.push(asset.id);
      }
    }
  } else {
    for (const asset of generationTrust.videos) {
      if (existsSync(asset.outputPath)) {
        failGate(`I2V 输出已存在但未纳入本次人工 hash 审批，拒绝消费或覆盖：${asset.output}`);
      }
      capabilities.add("fal-video");
      allowedAssetIds.push(asset.id);
    }
    for (const shot of episode.shots || []) {
      const audio = shot?.audio;
      if (!audio?.dialogueAsset || audio.originalClipAudio === true) continue;
      const outputPath = generationTrust.audioOutputs.get(shot.id);
      if (existsSync(outputPath)) {
        failGate(`TTS 输出已存在但未纳入本次人工 hash 审批，拒绝消费或覆盖：${audio.dialogueAsset}`);
      }
      capabilities.add("tts");
      allowedAudioShotIds.push(shot.id);
    }
  }
  return {
    capabilities: [...capabilities].sort(),
    allowedAssetIds: allowedAssetIds.sort(),
    allowedAudioShotIds: allowedAudioShotIds.sort(),
  };
}

function requireCapabilities(approval, required) {
  if (!Array.isArray(approval.capabilities)) failGate("approval.capabilities 必须是数组");
  const approved = new Set(approval.capabilities.map((value) => String(value).trim().toLowerCase()));
  const missing = required.filter((capability) => !approved.has(capability));
  if (missing.length) failGate(`approval.capabilities 缺少：${missing.join(", ")}`);
  const unexpected = [...approved].filter((capability) => !required.includes(capability));
  if (unexpected.length) failGate(`approval.capabilities 含本阶段不允许的额外能力：${unexpected.join(", ")}`);
}

function approvalHashValue(approval, topLevelName, nestedNames = []) {
  if (approval[topLevelName] != null) return approval[topLevelName];
  for (const containerName of ["hashes", "artifacts"]) {
    const container = approval[containerName];
    if (!container || typeof container !== "object") continue;
    for (const name of nestedNames) {
      if (container[name] != null) return container[name];
    }
  }
  return undefined;
}

function validateApproval({
  approval,
  expectedPhrase,
  videoId,
  phase,
  report,
  episodeFile,
  generationFile,
  templateFile,
  characterCanonicalFile,
  identityVersion,
  keyframesHash,
  capabilities,
}) {
  if (approval.approved !== true) failGate("approval.approved 必须严格等于 true");
  if (approval.paidExecutionAllowed !== true) failGate("approval.paidExecutionAllowed 必须严格等于 true");
  if (approval.phase !== phase) failGate(`approval.phase 必须严格等于 ${phase}`);
  if (approval.approvalPhrase !== expectedPhrase) failGate("approval.approvalPhrase 与模板要求不一致");
  const approvedVideoId = approval.episodeId ?? approval.videoId;
  if (approvedVideoId !== videoId) failGate(`approval.episodeId/videoId=${approvedVideoId} 与 ${videoId} 不一致`);
  if (approval.identityVersion !== identityVersion) failGate("approval.identityVersion 与虚构林晚身份版本不一致");
  nonEmptyString(approval.approverId ?? approval.approvedBy, "approval.approverId/approvedBy");
  const approvedAt = Date.parse(nonEmptyString(approval.approvedAt, "approval.approvedAt"));
  if (!Number.isFinite(approvedAt) || approvedAt > Date.now() + 5 * 60 * 1000) {
    failGate("approval.approvedAt 无效或位于未来");
  }
  if (approval.expiresAt != null) {
    const expiresAt = Date.parse(nonEmptyString(approval.expiresAt, "approval.expiresAt"));
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) failGate("approval.expiresAt 无效或已过期");
  }

  expectSha256(report.episodeHash, approval.episodeHash, "approval.episodeHash");
  expectSha256(
    episodeFile.hash,
    approvalHashValue(approval, "episodeFileSha256", ["episodeFile", "episodeRaw"]),
    "approval.episodeFileSha256",
  );
  expectSha256(
    generationFile.hash,
    approvalHashValue(approval, "generationPlanSha256", ["generationPlan", "generation-plan"]),
    "approval.generationPlanSha256",
  );
  expectSha256(
    templateFile.hash,
    approvalHashValue(approval, "templateSha256", ["template"]),
    "approval.templateSha256",
  );
  expectSha256(
    characterCanonicalFile.hash,
    approvalHashValue(approval, "characterCanonicalSha256", ["characterCanonical", "linwanCanonical"]),
    "approval.characterCanonicalSha256",
  );
  if (phase === I2V_PHASE) {
    expectSha256(
      keyframesHash,
      approvalHashValue(approval, "keyframesAggregateSha256", ["approvedKeyframes", "keyframes"]),
      "approval.keyframesAggregateSha256",
    );
  }
  requireCapabilities(approval, capabilities);
}

function assertSnapshotUnchanged(snapshot) {
  for (const item of snapshot) {
    if (!existsSync(item.path) || lstatSync(item.path).isSymbolicLink() || !lstatSync(item.path).isFile()) {
      failGate(`${item.label} 在 preflight 后消失、变成链接或不再是普通文件`);
    }
    const current = sha256(readFileSync(item.path));
    if (current !== item.hash) failGate(`${item.label} 在 preflight 后发生变化`);
  }
}

function productionTrustPreflight({videoId, realDir, root, report}) {
  const episodeFile = readJsonInput(root, join(realDir, "episode.json"), "episode.json");
  const generationFile = readJsonInput(root, join(realDir, "generation-plan.json"), "generation-plan.json");
  const templateFile = readJsonInput(root, join(root, "templates", "chinese-drama", "template.json"), "template.json");
  const characterId = nonEmptyString(templateFile.data?.modernAnchor?.characterId, "template.modernAnchor.characterId");
  const identityVersion = nonEmptyString(templateFile.data?.modernAnchor?.identityVersion, "template.modernAnchor.identityVersion");
  if (!/^[a-z0-9][a-z0-9-]*$/.test(characterId)) failGate("template.modernAnchor.characterId 格式非法");
  if (templateFile.data?.modernAnchor?.fictionalIdentity !== true) failGate("modernAnchor 必须是完全虚构身份");
  const characterCanonicalPath = resolveKnownInput(
    root,
    join(root, "templates", "chinese-drama", "characters", characterId, "canonical.md"),
    "虚构林晚 canonical",
  );
  const characterCanonicalRaw = readFileSync(characterCanonicalPath);
  const characterCanonicalFile = {path: characterCanonicalPath, hash: sha256(characterCanonicalRaw)};
  const generationTrust = validateGenerationPlan({
    root,
    dir: realDir,
    episode: episodeFile.data,
    generationPlan: generationFile.data,
    template: templateFile.data,
  });

  if (episodeFile.data.episodeId !== videoId || generationFile.data.episodeId !== videoId) {
    failGate("episode.json / generation-plan.json 的 episodeId 与构建 videoId 不一致");
  }
  if (episodeFile.data.modernAnchor?.characterId !== characterId || episodeFile.data.modernAnchor?.fictionalIdentity !== true) {
    failGate("episode.modernAnchor 必须绑定模板中的虚构林晚角色");
  }
  if (generationFile.data.paidExecutionAllowed !== true) {
    failGate("generation-plan.paidExecutionAllowed 必须由人工显式改为 true");
  }
  if (templateFile.data.production?.paidGenerationAllowed !== true) {
    failGate("template.production.paidGenerationAllowed 必须由人工显式改为 true");
  }

  const approvalPath = resolveInputFile(
    root,
    realDir,
    templateFile.data.production.approvalFile,
    "template.production.approvalFile",
  );
  if (dirname(approvalPath) !== realDir) failGate("审批文件必须直接位于 episode 目录，禁止放入任何媒体输出目录");
  const approvalRaw = readFileSync(approvalPath);
  const approvalHash = sha256(approvalRaw);
  const expectedApprovalHash = process.env[APPROVAL_HASH_ENV];
  if (!expectedApprovalHash) failGate(`production 必须从外部显式提供 ${APPROVAL_HASH_ENV}`);
  expectSha256(approvalHash, expectedApprovalHash, APPROVAL_HASH_ENV);

  let approval;
  try {
    approval = JSON.parse(approvalRaw.toString("utf8"));
  } catch (error) {
    failGate(`审批文件不是合法 JSON：${error.message}`);
  }
  const phase = approval?.phase;
  if (phase !== KEYFRAME_PHASE && phase !== I2V_PHASE) {
    failGate(`approval.phase 只允许 ${KEYFRAME_PHASE} 或 ${I2V_PHASE}`);
  }
  const keyframeTrust = phase === I2V_PHASE
    ? validateApprovedKeyframes({
        root,
        dir: realDir,
        approval,
        generationTrust,
        canonicalVersion: `${episodeFile.data.seriesId}@${episodeFile.data.storyVersion}`,
      })
    : {files: [], aggregateHash: null};
  const executionScope = executionScopeFor(episodeFile.data, generationTrust, phase);
  validateApproval({
    approval,
    expectedPhrase: templateFile.data.production.requiredApprovalPhrase,
    videoId,
    phase,
    report,
    episodeFile,
    generationFile,
    templateFile,
    characterCanonicalFile,
    identityVersion,
    keyframesHash: keyframeTrust.aggregateHash,
    capabilities: executionScope.capabilities,
  });

  const snapshot = [
    {label: "episode.json", path: episodeFile.path, hash: episodeFile.hash},
    {label: "generation-plan.json", path: generationFile.path, hash: generationFile.hash},
    {label: "template.json", path: templateFile.path, hash: templateFile.hash},
    {label: "虚构林晚 canonical", path: characterCanonicalFile.path, hash: characterCanonicalFile.hash},
    {label: "审批文件", path: approvalPath, hash: approvalHash},
    ...keyframeTrust.files.map((item) => ({
      label: `approved keyframe ${item.id}`,
      path: item.path,
      hash: item.sha256,
    })),
  ];
  const paidAssetById = new Map([
    ...generationTrust.keyframes.entries(),
    ...generationTrust.videos.map((asset) => [asset.id, asset]),
  ]);
  const outputPaths = Object.fromEntries([
    ...executionScope.allowedAssetIds.map((id) => [id, paidAssetById.get(id).outputPath]),
    ...executionScope.allowedAudioShotIds.map((id) => [`audio:${id}`, generationTrust.audioOutputs.get(id)]),
  ]);
  return {
    root,
    realDir,
    approval,
    approvalHash,
    phase,
    capabilities: executionScope.capabilities,
    allowedAssetIds: executionScope.allowedAssetIds,
    allowedAudioShotIds: executionScope.allowedAudioShotIds,
    outputPaths,
    snapshot,
    report,
    episode: episodeFile.data,
    generationPlan: generationFile.data,
  };
}

function printDesignOnlyReport(report) {
  console.log("\n[chinese-drama] DESIGN-ONLY（安全默认）");
  console.log(`  episode: ${report.episodeId}`);
  console.log(`  episodeHash: ${report.episodeHash}`);
  console.log(`  duration/dynamic: ${report.totalMs}ms/${Math.round(report.dynamicCoverage * 100)}%`);
  console.log(`  production blockers: ${report.productionBlockers.length}`);
  console.log("  writes/network/TTS/fal/media generation: none");
}

export async function build({videoId, dir, ROOT}) {
  const mode = getBuildMode();
  const root = realpathSync(resolve(ROOT));
  const realDir = realpathSync(resolve(dir));
  assertInside(root, realDir, "视频目录");
  rejectSymlinkPath(root, realDir, "视频目录");
  const report = runPreflight({dir: realDir, production: mode === PRODUCTION});

  if (mode === DESIGN_ONLY) {
    printDesignOnlyReport(report);
    failGate(
      `默认模式不会构建或写入任何生成资产；只有完整生产授权后才可设置 ${BUILD_MODE_ENV}=${PRODUCTION}`,
    );
  }

  // runPreflight(production:true) 先通过，再执行本文件更强的实际文件 hash 与授权绑定。
  const trust = productionTrustPreflight({videoId, realDir, root, report});
  assertSnapshotUnchanged(trust.snapshot);
  const confirmedReport = runPreflight({dir: realDir, production: true});
  if (confirmedReport.episodeHash !== report.episodeHash) {
    failGate("episode 在两次 production preflight 之间发生变化");
  }
  assertSnapshotUnchanged(trust.snapshot);

  console.log("\n[chinese-drama] PRODUCTION PREFLIGHT PASSED");
  console.log(`  episode: ${report.episodeId}/${report.episodeHash}`);
  console.log(`  approval: ${trust.approvalHash}`);
  console.log(`  capabilities: ${trust.capabilities.join(", ") || "none"}`);
  if (trust.phase === KEYFRAME_PHASE && trust.allowedAssetIds.length === 0) {
    failGate("keyframes 阶段没有缺失关键帧；请先逐张人工验脸并签发新的 i2v 阶段审批");
  }

  // 此适配器不存在时必须硬中止。未来接入后，它也是媒体/付费模块，因此只允许在上方
  // 两层 production preflight、外部审批 hash 和 TOCTOU 复核全部通过后动态 import。
  const adapterPath = join(trust.root, PAID_ADAPTER_RELATIVE_PATH);
  if (!existsSync(adapterPath)) {
    failGate(`未接入经审计的付费媒体适配器 ${PAID_ADAPTER_RELATIVE_PATH}；已停止且未导入任何付费模块`);
  }
  const safeAdapterPath = resolveKnownInput(trust.root, adapterPath, "付费媒体适配器");
  const adapterHash = sha256(readFileSync(safeAdapterPath));
  expectSha256(
    adapterHash,
    approvalHashValue(trust.approval, "adapterSha256", ["paidAdapter", "adapter"]),
    "approval.adapterSha256",
  );
  trust.snapshot.push({label: "付费媒体适配器", path: safeAdapterPath, hash: adapterHash});
  assertSnapshotUnchanged(trust.snapshot);
  const adapter = await import(pathToFileURL(safeAdapterPath).href);
  if (typeof adapter.buildApprovedChineseDramaEpisode !== "function") {
    failGate("付费媒体适配器必须导出 buildApprovedChineseDramaEpisode()");
  }
  const contract = adapter.PAID_ADAPTER_CONTRACT;
  if (
    contract?.version !== 1 ||
    contract.revalidatesInputHashesBeforeEveryPaidCall !== true ||
    contract.honorsAllowedAssetIds !== true ||
    contract.honorsAllowedAudioShotIds !== true ||
    contract.maxAttemptsPerAsset !== 1 ||
    contract.automaticRetries !== 0
  ) {
    failGate("付费媒体适配器未声明 v1 安全契约、逐调用 hash 复核、allowlist、单次尝试和零重试");
  }
  assertSnapshotUnchanged(trust.snapshot);
  const result = await adapter.buildApprovedChineseDramaEpisode({
    videoId,
    preflight: confirmedReport,
    episode: trust.episode,
    generationPlan: trust.generationPlan,
    outputPaths: Object.freeze({...trust.outputPaths}),
    authorization: {
      approvalHash: trust.approvalHash,
      phase: trust.phase,
      capabilities: trust.capabilities,
      allowedAssetIds: trust.allowedAssetIds,
      allowedAudioShotIds: trust.allowedAudioShotIds,
      maxAttemptsPerAsset: 1,
      automaticRetries: 0,
      inputHashes: trust.snapshot.map(({label, path, hash}) => ({label, path, sha256: hash})),
      assertInputsUnchanged: () => assertSnapshotUnchanged(trust.snapshot),
      readApprovedInput: (path) => {
        const item = trust.snapshot.find((candidate) => candidate.path === path);
        if (!item) failGate(`适配器尝试读取未审批输入：${path}`);
        assertSnapshotUnchanged([item]);
        return readFileSync(item.path);
      },
    },
  });
  if (trust.phase === KEYFRAME_PHASE) {
    failGate("keyframes 阶段已结束；不会返回 manifest 或把 catalog 标记为 built，请人工验脸后重新签发 i2v 审批");
  }
  return result;
}
