import {createHash} from "node:crypto";
import {z} from "zod";

const nonEmpty = z.string().trim().min(1);
const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const factId = z.string().regex(/^[a-z0-9][a-z0-9_-]*$/);
const recipientId = z.string().regex(/^[a-z0-9][a-z0-9-]*$/);

const TONE_MARKS = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿ]/iu;
const HAN = /\p{Script=Han}/u;

const pinyinLine = nonEmpty.superRefine((value, ctx) => {
  if (!TONE_MARKS.test(value)) {
    ctx.addIssue({code: z.ZodIssueCode.custom, message: "拼音必须使用带声调的字母标记"});
  }
  if (/[1-5]/.test(value)) {
    ctx.addIssue({code: z.ZodIssueCode.custom, message: "拼音禁止用数字声调"});
  }
  if (HAN.test(value)) {
    ctx.addIssue({code: z.ZodIssueCode.custom, message: "拼音行不得混入汉字"});
  }
});

const chineseLine = nonEmpty.refine((value) => HAN.test(value), "中文行必须包含汉字");
const vietnameseLine = nonEmpty.refine((value) => !HAN.test(value), "越南文行不得混入汉字");

const utteranceSchema = z.object({
  speakerId: recipientId,
  mode: z.enum(["modern-anchor", "dialogue", "inner", "offscreen", "whisper"]),
  pinyin: pinyinLine,
  textZh: chineseLine,
  subtitleVi: vietnameseLine,
  startOffsetMs: z.number().int().nonnegative(),
  estimatedDurationMs: z.number().int().positive(),
}).strict();

const factEmissionSchema = z.object({
  factId,
  recipients: z.array(recipientId).min(1),
  channel: z.enum([
    "visual",
    "spoken",
    "gesture",
    "document",
    "confirmed-evidence",
    "audience-only",
  ]),
  atOffsetMs: z.number().int().nonnegative(),
}).strict();

const mediaWindowSchema = z.object({
  sourceStartMs: z.number().int().nonnegative(),
  sourceEndMs: z.number().int().positive(),
  playbackRate: z.number().min(0.9).max(1.25),
  objectPosition: nonEmpty.optional(),
  scale: z.number().min(1).max(1.2).optional(),
}).strict();

const overlaySchema = z.object({
  type: z.enum(["impact", "flash", "none"]),
  startMs: z.number().int().nonnegative(),
  durationMs: z.number().int().positive(),
}).strict();

const shotSchema = z.object({
  id: slug,
  sceneId: slug,
  role: z.enum([
    "modern-anchor",
    "hook-action",
    "consequence",
    "power-shift",
    "evidence",
    "confrontation",
    "intimacy-as-strategy",
    "reveal",
    "tail-hook",
  ]),
  durationMs: z.number().int().min(200).max(5000),
  sourceType: z.enum(["real-video", "ai-video", "remotion", "still-fallback"]),
  asset: nonEmpty,
  generationPromptId: slug.optional(),
  fallbackAsset: nonEmpty.optional(),
  mediaWindow: mediaWindowSchema.optional(),
  motionPreset: z.enum([
    "locked",
    "micro-push",
    "impact-push",
    "panic-shake",
    "evidence-tilt",
  ]).optional(),
  visibleFaceCount: z.number().int().min(0).max(4),
  focusCharacterId: recipientId.optional(),
  drama: z.object({
    actorId: recipientId.optional(),
    action: nonEmpty,
    requiresFacts: z.array(factId),
    emitsFacts: z.array(factEmissionSchema),
  }).strict(),
  utterances: z.array(utteranceSchema),
  overlays: z.array(overlaySchema),
  audio: z.object({
    dialogueAsset: nonEmpty.optional(),
    sfx: z.array(nonEmpty),
    sfxAssets: z.array(nonEmpty).optional(),
    originalClipAudio: z.boolean(),
  }).strict(),
}).strict();

const stateDeltaSchema = z.discriminatedUnion("op", [
  z.object({op: z.literal("add-fact"), characterId: recipientId, factId, source: nonEmpty}).strict(),
  z.object({op: z.literal("set-relationship"), fromId: recipientId, toId: recipientId, value: nonEmpty}).strict(),
  z.object({op: z.literal("set-prop-state"), propId: slug, from: nonEmpty, to: nonEmpty}).strict(),
  z.object({op: z.literal("open-loop"), loopId: factId}).strict(),
  z.object({op: z.literal("close-loop"), loopId: factId}).strict(),
]);

const hookDeliverySchema = z.object({
  factId,
  type: z.enum([
    "first-frame-trigger",
    "danger-or-stakes",
    "ancient-match",
    "irreversible-action",
    "main-question",
  ]),
  byMs: z.number().int().nonnegative().max(3000),
}).strict();

export const episodeSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  seriesId: z.literal("poisoned-wedding"),
  storyVersion: z.literal("1.0.0"),
  episodeId: slug,
  episodeNo: z.number().int().min(1).max(12),
  status: z.enum(["designed-awaiting-user-approval", "approved-for-generation", "generated"]),
  stateInput: z.object({
    episodeNo: z.number().int().min(0).max(12),
    hash: nonEmpty,
  }).strict(),
  title: z.object({zh: nonEmpty, vi: nonEmpty}).strict(),
  durationTargetMs: z.number().int().min(22000).max(26000),
  modernAnchor: z.object({
    required: z.literal(true),
    characterId: z.literal("linwan"),
    fictionalIdentity: z.literal(true),
    asset: nonEmpty,
    lineZh: chineseLine,
    matchCutAction: nonEmpty,
  }).strict(),
  hookContract: z.object({
    firstFrameTriggerCount: z.number().int().min(2).max(4),
    dangerOrStakesVisibleByMs: z.number().int().nonnegative().max(500),
    ancientMatchByMs: z.number().int().nonnegative().max(1300),
    irreversibleActionByMs: z.number().int().nonnegative().max(2200),
    mainQuestionByMs: z.number().int().nonnegative().max(3000),
    requiredDeliveries: z.array(hookDeliverySchema).min(5),
  }).strict(),
  subtitleContract: z.object({
    dialogueLanguage: z.literal("zh"),
    displayOrder: z.tuple([z.literal("pinyin"), z.literal("zh"), z.literal("vi")]),
    allThreeLinesRequired: z.literal(true),
    teachingElements: z.literal(false),
  }).strict(),
  plotContract: z.object({
    protagonistGoal: nonEmpty,
    mainQuestion: nonEmpty,
    mainQuestionFactId: factId,
    answerFactId: factId,
    answerRevealShotId: slug,
    nextDangerFactId: factId,
    commentQuestionVi: vietnameseLine,
  }).strict(),
  scenes: z.array(z.object({
    id: slug,
    location: nonEmpty,
    time: nonEmpty,
    lookIds: z.array(nonEmpty).min(1),
    props: z.array(slug),
  }).strict()).min(1),
  shots: z.array(shotSchema).min(6).max(16),
  budget: z.object({
    maxPaidKeyframes: z.number().int().nonnegative(),
    maxPaidVideoClips: z.number().int().nonnegative(),
    maxGeneratedVideoSeconds: z.number().nonnegative(),
    maxPaidAttemptsPerAsset: z.literal(1),
    automaticPaidRetries: z.literal(0),
    maxUsdFirstPass: z.number().nonnegative(),
  }).strict(),
  stateDelta: z.array(stateDeltaSchema).min(1),
  generationPolicy: z.object({
    stopBeforeFal: z.literal(true),
    requireUserApprovalFile: z.literal(true),
    minimumDynamicCoverageRatio: z.number().min(0.8).max(1),
    maxStaticHoldMs: z.number().int().positive().max(1000),
  }).strict(),
}).strict();

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .filter((key) => value[key] !== undefined)
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function hashJson(value) {
  return createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");
}

export function hashCanonicalState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return "";
  const {stateHash: _ignored, ...canonicalState} = state;
  return hashJson(canonicalState);
}

function shotWindows(shots) {
  let cursor = 0;
  return shots.map((shot) => {
    const startMs = cursor;
    cursor += shot.durationMs;
    return {...shot, startMs, endMs: cursor};
  });
}

function money(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function hasDuplicates(values) {
  return new Set(values).size !== values.length;
}

function videoPriceForModel(template, model) {
  if (model === template?.video?.primaryModel) return template?.video?.estimatedUsdPerSecond?.primary;
  if (model === template?.video?.economyModel) return template?.video?.estimatedUsdPerSecond?.economy;
  return undefined;
}

export function validateEpisode(raw, {series, state, template, generationPlan} = {}) {
  const parsed = episodeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".") || "episode"}: ${issue.message}`),
      warnings: [],
      episodeHash: hashJson(raw),
    };
  }

  const episode = parsed.data;
  const errors = [];
  const warnings = [];
  const windows = shotWindows(episode.shots);
  const shotById = new Map(windows.map((shot) => [shot.id, shot]));
  const sceneIds = new Set(episode.scenes.map((scene) => scene.id));
  const totalMs = windows.at(-1)?.endMs ?? 0;
  const fps = template?.meta?.fps ?? series?.format?.fps ?? 30;
  const renderFrames = episode.shots.reduce((sum, shot) => sum + (shot.durationMs * fps) / 1000, 0);
  const targetFrames = (episode.durationTargetMs * fps) / 1000;

  if (fps !== 30) errors.push(`本系列必须严格使用 30fps，当前为 ${fps}`);
  if (series && series.seriesId !== episode.seriesId) errors.push("seriesId 与 canonical series 不一致");
  if (series && episode.storyVersion !== series.storyVersion) errors.push("storyVersion 与 canonical series 不一致");
  if (state && state.seriesId !== episode.seriesId) errors.push("canonical state.seriesId 与 episode 不一致");
  if (state && episode.stateInput.hash !== state.stateHash) errors.push("stateInput.hash 与当前 canonical state 不一致");
  if (state && state.stateHash !== hashCanonicalState(state)) errors.push("canonical state.stateHash 已过期，必须重新计算");
  if (state && episode.stateInput.episodeNo !== state.canonicalEpisodeNo) errors.push("stateInput.episodeNo 与 canonical state 不一致");
  if (template && template.layout !== "chinese-drama-v2") errors.push("template layout 必须是 chinese-drama-v2");
  if (totalMs < 22000 || totalMs > 26000) errors.push(`shot 总时长 ${totalMs}ms 不在 22000—26000ms`);
  if (totalMs !== episode.durationTargetMs) errors.push(`shot 总时长 ${totalMs}ms 不等于 durationTargetMs ${episode.durationTargetMs}ms`);
  if (!Number.isInteger(targetFrames)) errors.push(`durationTargetMs=${episode.durationTargetMs} 不能在 30fps 下形成整数帧`);
  if (!Number.isInteger(renderFrames)) errors.push("逐镜头时长不能在 30fps 下形成整数帧");
  if (renderFrames !== targetFrames) errors.push(`逐镜头合计 ${renderFrames} 帧，不等于目标 ${targetFrames} 帧`);
  if (hasDuplicates(episode.scenes.map((scene) => scene.id))) errors.push("scene id 重复");
  if (hasDuplicates(episode.shots.map((shot) => shot.id))) errors.push("shot id 重复");

  for (const shot of windows) {
    const exactFrames = (shot.durationMs * 30) / 1000;
    if (!Number.isInteger(exactFrames)) errors.push(`${shot.id}: ${shot.durationMs}ms 在 30fps 下不是整数帧`);
    if (!sceneIds.has(shot.sceneId)) errors.push(`${shot.id}: sceneId=${shot.sceneId} 不存在`);
    if (shot.sourceType === "real-video") errors.push(`${shot.id}: 本系列只使用虚构 AI 角色，不接受真人视频 sourceType`);
    if (shot.sourceType === "ai-video" && !shot.generationPromptId) errors.push(`${shot.id}: ai-video 缺 generationPromptId`);
    if (shot.sourceType !== "ai-video" && shot.generationPromptId) errors.push(`${shot.id}: 非 ai-video 不得设置 generationPromptId`);
    if (shot.sourceType === "ai-video" && !shot.fallbackAsset) errors.push(`${shot.id}: ai-video 必须绑定关键帧 fallbackAsset`);
    if (shot.sourceType === "still-fallback" && shot.durationMs > episode.generationPolicy.maxStaticHoldMs) {
      errors.push(`${shot.id}: 静态兜底超过 ${episode.generationPolicy.maxStaticHoldMs}ms`);
    }
    if (hasDuplicates(shot.drama.requiresFacts)) errors.push(`${shot.id}: requiresFacts 有重复项`);
    for (const utterance of shot.utterances) {
      if (utterance.startOffsetMs + utterance.estimatedDurationMs > shot.durationMs) {
        errors.push(`${shot.id}: 台词“${utterance.textZh}”超出镜头时长`);
      }
    }
    for (const emission of shot.drama.emitsFacts) {
      if (emission.atOffsetMs >= shot.durationMs) errors.push(`${shot.id}: fact ${emission.factId} 必须在镜头结束前交付`);
      if (hasDuplicates(emission.recipients)) errors.push(`${shot.id}: fact ${emission.factId} 的 recipients 重复`);
      if (emission.channel === "audience-only" && (emission.recipients.length !== 1 || emission.recipients[0] !== "audience")) {
        errors.push(`${shot.id}: audience-only fact 只能交付给 audience`);
      }
    }
    for (const overlay of shot.overlays) {
      if (overlay.startMs + overlay.durationMs > shot.durationMs) errors.push(`${shot.id}: overlay 超出镜头时长`);
    }
  }

  const modernAnchorShots = windows.filter((shot) => shot.role === "modern-anchor");
  const first = windows[0];
  if (!first || first.role !== "modern-anchor" || first.sourceType !== "ai-video") errors.push("第一镜必须是虚构林晚的现代 AI 动态 anchor");
  if (modernAnchorShots.length !== 1) errors.push("每集必须且只能有一个 modern-anchor 镜头");
  if (first && (first.durationMs < 600 || first.durationMs > 1000)) errors.push("现代 anchor 必须为 600—1000ms");
  if (first?.asset !== episode.modernAnchor.asset) errors.push("第一镜 asset 必须与 modernAnchor.asset 一致");
  if (first?.audio.originalClipAudio !== false) errors.push("AI modern-anchor 必须关闭模型原声并使用后期中文配音");
  if (first?.utterances.length !== 1 || first?.utterances[0]?.mode !== "modern-anchor") errors.push("modern-anchor 必须恰有一句三行字幕台词");
  if (first?.utterances[0]?.textZh !== episode.modernAnchor.lineZh) errors.push("modern-anchor 中文台词与 modernAnchor.lineZh 不一致");

  const emissions = [];
  const deliveredToAt = new Map();
  for (const shot of windows) {
    for (const emission of shot.drama.emitsFacts) {
      const absoluteMs = shot.startMs + emission.atOffsetMs;
      const item = {...emission, absoluteMs, shotId: shot.id, shotRole: shot.role};
      emissions.push(item);
      for (const recipient of emission.recipients) {
        const key = `${recipient}:${emission.factId}`;
        if (!deliveredToAt.has(key)) deliveredToAt.set(key, absoluteMs);
      }
    }
  }

  const deliveries = episode.hookContract.requiredDeliveries;
  if (hasDuplicates(deliveries.map((item) => `${item.type}:${item.factId}`))) errors.push("hook requiredDeliveries 存在重复项");
  const hookLimits = {
    "danger-or-stakes": episode.hookContract.dangerOrStakesVisibleByMs,
    "ancient-match": episode.hookContract.ancientMatchByMs,
    "irreversible-action": episode.hookContract.irreversibleActionByMs,
    "main-question": episode.hookContract.mainQuestionByMs,
  };
  for (const delivery of deliveries) {
    const actualMs = deliveredToAt.get(`audience:${delivery.factId}`);
    if (actualMs === undefined) errors.push(`hook fact ${delivery.factId} 未交付`);
    else if (actualMs > delivery.byMs) errors.push(`hook fact ${delivery.factId} 在 ${actualMs}ms 才交付，晚于 ${delivery.byMs}ms`);
    if (delivery.type === "first-frame-trigger" && delivery.byMs > 1000) {
      errors.push(`first-frame-trigger ${delivery.factId} 必须在首秒内`);
    }
    const limit = hookLimits[delivery.type];
    if (limit !== undefined && delivery.byMs > limit) {
      errors.push(`${delivery.type} ${delivery.factId} 的 byMs 超过 hookContract 声明时限 ${limit}ms`);
    }
  }
  const firstFrameDeliveries = deliveries.filter((item) => item.type === "first-frame-trigger");
  if (firstFrameDeliveries.length < episode.hookContract.firstFrameTriggerCount) {
    errors.push(`首秒触发器只有 ${firstFrameDeliveries.length} 个，少于声明的 ${episode.hookContract.firstFrameTriggerCount} 个`);
  }
  for (const type of ["danger-or-stakes", "ancient-match", "irreversible-action", "main-question"]) {
    if (!deliveries.some((item) => item.type === type)) errors.push(`hook 缺少 ${type} delivery`);
  }
  const mainQuestionDeliveries = deliveries.filter((item) => item.type === "main-question");
  if (mainQuestionDeliveries.length !== 1 || mainQuestionDeliveries[0]?.factId !== episode.plotContract.mainQuestionFactId) {
    errors.push("plotContract.mainQuestionFactId 必须是唯一的 main-question delivery");
  }
  const mainQuestionAt = deliveredToAt.get(`audience:${episode.plotContract.mainQuestionFactId}`);
  if (mainQuestionAt === undefined || mainQuestionAt > 3000) errors.push("主问题必须在前三秒内明确交付给观众");

  const knowledgeAt = new Map();
  for (const [characterId, facts] of Object.entries(state?.knowledge ?? {})) {
    for (const knownFact of facts) knowledgeAt.set(`${characterId}:${knownFact}`, Number.NEGATIVE_INFINITY);
  }
  for (const shot of windows) {
    const actor = shot.drama.actorId;
    for (const requiredFact of shot.drama.requiresFacts) {
      if (!actor) {
        errors.push(`${shot.id}: 有 requiresFacts 时必须声明 actorId`);
        continue;
      }
      const availableAt = knowledgeAt.get(`${actor}:${requiredFact}`);
      if (availableAt === undefined || availableAt > shot.startMs) {
        const audienceAt = deliveredToAt.get(`audience:${requiredFact}`);
        errors.push(`${shot.id}: actor=${actor} 在行动前不知道 ${requiredFact}${audienceAt !== undefined ? "（仅观众知道不算角色知识）" : ""}`);
      }
    }
    for (const emission of shot.drama.emitsFacts) {
      const absoluteMs = shot.startMs + emission.atOffsetMs;
      for (const recipient of emission.recipients) {
        if (recipient === "audience") continue;
        const key = `${recipient}:${emission.factId}`;
        const previous = knowledgeAt.get(key);
        if (previous === undefined || absoluteMs < previous) knowledgeAt.set(key, absoluteMs);
      }
    }
  }

  const answerShot = shotById.get(episode.plotContract.answerRevealShotId);
  if (!answerShot) errors.push(`answerRevealShotId=${episode.plotContract.answerRevealShotId} 不存在`);
  else if (answerShot.role !== "reveal") errors.push("answerRevealShotId 指向的镜头 role 必须是 reveal");
  const answerEmissions = emissions.filter((item) => item.factId === episode.plotContract.answerFactId);
  const answerThresholdMs = totalMs * 0.8;
  if (answerEmissions.length !== 1) errors.push(`answerFactId 必须且只能交付一次，当前为 ${answerEmissions.length} 次`);
  const answerEmission = answerEmissions[0];
  if (answerEmission) {
    if (answerEmission.shotId !== episode.plotContract.answerRevealShotId) errors.push("答案 fact 只能由 answerRevealShotId 交付");
    if (answerEmission.absoluteMs < answerThresholdMs) {
      errors.push(`答案在 ${answerEmission.absoluteMs}ms 提前揭晓，必须晚于全片 80%（${answerThresholdMs}ms）`);
    }
    if (!answerEmission.recipients.includes("audience")) errors.push("答案 fact 必须明确交付给 audience");
  }
  const tailEmissions = emissions.filter((item) => item.factId === episode.plotContract.nextDangerFactId);
  if (tailEmissions.length === 0) errors.push("nextDangerFactId 未交付");
  for (const tail of tailEmissions) {
    if (tail.shotRole !== "tail-hook") errors.push("nextDangerFactId 只能由 tail-hook 镜头交付");
    if (!tail.recipients.includes("audience")) errors.push("尾钩 fact 必须明确交付给 audience");
    if (answerEmission && tail.absoluteMs <= answerEmission.absoluteMs) errors.push("尾钩 fact 必须在答案揭晓之后交付");
  }

  const trueVideoMs = windows
    .filter((shot) => shot.sourceType === "real-video" || shot.sourceType === "ai-video")
    .reduce((sum, shot) => sum + shot.durationMs, 0);
  const remotionEnhancedMs = windows
    .filter((shot) => shot.sourceType === "real-video" || shot.sourceType === "ai-video" || shot.sourceType === "remotion")
    .reduce((sum, shot) => sum + shot.durationMs, 0);
  const trueVideoCoverage = totalMs ? trueVideoMs / totalMs : 0;
  const remotionEnhancedCoverage = totalMs ? remotionEnhancedMs / totalMs : 0;
  if (trueVideoCoverage < episode.generationPolicy.minimumDynamicCoverageRatio) {
    errors.push(`AI真实视频覆盖率 ${(trueVideoCoverage * 100).toFixed(1)}% 低于要求；Remotion推拉不计入`);
  }

  let plannedVideoSeconds = 0;
  if (!generationPlan || typeof generationPlan !== "object" || Array.isArray(generationPlan)) {
    errors.push("缺少合法 generation-plan");
  } else {
    if (generationPlan.episodeId !== episode.episodeId) errors.push("generation-plan.episodeId 与 episode 不一致");
    if (generationPlan.provider !== "fal.ai") errors.push("generation-plan.provider 必须是 fal.ai");
    if (!Array.isArray(generationPlan.assets) || generationPlan.assets.length === 0) {
      errors.push("generation-plan.assets 必须是非空数组");
    }
    if (episode.status === "designed-awaiting-user-approval" && generationPlan.paidExecutionAllowed !== false) {
      errors.push("设计待审批阶段 paidExecutionAllowed 必须为 false");
    }
    if (episode.status !== "designed-awaiting-user-approval" && generationPlan.paidExecutionAllowed !== true) {
      errors.push("已批准或已生成状态的 paidExecutionAllowed 必须为 true");
    }

    const assets = Array.isArray(generationPlan.assets) ? generationPlan.assets : [];
    const planIds = new Set();
    const outputs = new Set();
    const keyframes = [];
    const videos = [];
    for (const [index, asset] of assets.entries()) {
      const label = asset?.id || `assets[${index}]`;
      if (!asset || typeof asset !== "object" || Array.isArray(asset)) {
        errors.push(`generation-plan.assets[${index}] 必须是对象`);
        continue;
      }
      if (typeof asset.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(asset.id)) errors.push(`${label}: id 非法`);
      if (planIds.has(asset.id)) errors.push(`generation-plan asset id 重复：${asset.id}`);
      planIds.add(asset.id);
      if (typeof asset.output !== "string" || !asset.output.trim()) errors.push(`${label}: output 必须是非空字符串`);
      if (outputs.has(asset.output)) errors.push(`${label}: output 与其他资产重复`);
      outputs.add(asset.output);
      if (typeof asset.prompt !== "string" || !asset.prompt.trim()) errors.push(`${label}: prompt 必须是非空字符串`);
      if (asset.maxAttempts !== 1) errors.push(`${label}: maxAttempts 必须显式为 1`);
      if (asset.kind === "keyframe") {
        keyframes.push(asset);
        if (!Number.isInteger(asset.characterCount) || asset.characterCount < 0 || asset.characterCount > 4) {
          errors.push(`${label}: characterCount 必须是 0—4 的整数`);
        } else if (asset.characterCount <= 1 && asset.model !== "fal-ai/flux-pro/kontext") {
          errors.push(`${label}: 0/1 人关键帧必须使用 fal-ai/flux-pro/kontext`);
        } else if (asset.characterCount >= 2 && asset.model !== "fal-ai/nano-banana-pro/edit") {
          errors.push(`${label}: 多人关键帧必须使用 fal-ai/nano-banana-pro/edit`);
        }
        if (!Array.isArray(asset.dependsOn)) errors.push(`${label}: dependsOn 必须显式为数组`);
        if (!Array.isArray(asset.referenceInputs) || asset.referenceInputs.length === 0) errors.push(`${label}: referenceInputs 必须是非空数组`);
      } else if (asset.kind === "ai-video") {
        videos.push(asset);
        if (!Number.isInteger(asset.durationSec) || asset.durationSec < 3 || asset.durationSec > 5) {
          errors.push(`${label}: AI 视频时长必须是 3—5 秒整数`);
        }
        if (asset.generateAudio !== false) errors.push(`${label}: generateAudio 必须显式为 false`);
        if (asset.model !== template?.video?.primaryModel && asset.model !== template?.video?.economyModel) {
          errors.push(`${label}: 视频模型不在模板白名单`);
        }
        if (typeof asset.keyframeId !== "string" || !asset.keyframeId.trim()) errors.push(`${label}: keyframeId 必须是非空字符串`);
      } else {
        errors.push(`${label}: kind 只允许 keyframe 或 ai-video`);
      }
    }

    const multiPersonKeyframes = keyframes.filter((asset) => Number.isInteger(asset.characterCount) && asset.characterCount >= 2);
    if (multiPersonKeyframes.length > 1) errors.push(`多人 Nano Banana 关键帧最多 1 张，当前为 ${multiPersonKeyframes.length} 张`);
    if (keyframes.length > episode.budget.maxPaidKeyframes) errors.push(`关键帧 ${keyframes.length} 张超预算`);
    if (videos.length > episode.budget.maxPaidVideoClips) errors.push(`AI 视频 ${videos.length} 条超预算`);

    const keyframeById = new Map(keyframes.map((asset) => [asset.id, asset]));
    const videoById = new Map(videos.map((asset) => [asset.id, asset]));
    for (const video of videos) {
      if (!keyframeById.has(video.keyframeId)) errors.push(`${video.id}: keyframeId=${video.keyframeId} 不存在`);
    }
    for (const keyframe of keyframes) {
      for (const dependencyId of Array.isArray(keyframe.dependsOn) ? keyframe.dependsOn : []) {
        if (!keyframeById.has(dependencyId)) errors.push(`${keyframe.id}: dependsOn=${dependencyId} 不是有效关键帧`);
      }
    }

    const aiShots = windows.filter((shot) => shot.sourceType === "ai-video");
    const usedVideoIds = new Set();
    for (const shot of aiShots) {
      const video = videoById.get(shot.generationPromptId);
      if (!video) {
        errors.push(`${shot.id}: generation-plan 缺少 ${shot.generationPromptId}`);
        continue;
      }
      usedVideoIds.add(video.id);
      if (video.output !== shot.asset) errors.push(`${shot.id}: asset 与 generation-plan.output 不一致`);
      const keyframe = keyframeById.get(video.keyframeId);
      if (keyframe && shot.fallbackAsset !== keyframe.output) errors.push(`${shot.id}: fallbackAsset 未绑定 ${video.keyframeId}`);
      const sourceDurationMs = Number.isFinite(video.durationSec) ? video.durationSec * 1000 : 0;
      const sourceStartMs = shot.mediaWindow?.sourceStartMs ?? 0;
      const sourceEndMs = shot.mediaWindow?.sourceEndMs ?? sourceDurationMs;
      const playbackRate = shot.mediaWindow?.playbackRate ?? 1;
      if (sourceEndMs > sourceDurationMs) errors.push(`${shot.id}: mediaWindow 超出 ${video.durationSec}s 源片`);
      if (sourceEndMs <= sourceStartMs) errors.push(`${shot.id}: mediaWindow.sourceEndMs 必须晚于 sourceStartMs`);
      const playableMs = (sourceEndMs - sourceStartMs) / playbackRate;
      if (playableMs + 1 < shot.durationMs) errors.push(`${shot.id}: 媒体窗口仅覆盖 ${Math.round(playableMs)}ms`);
      if (playableMs - shot.durationMs > 250) warnings.push(`${shot.id}: 媒体窗口多出 ${Math.round(playableMs - shot.durationMs)}ms`);
    }
    for (const video of videos) {
      if (!usedVideoIds.has(video.id)) warnings.push(`${video.id}: 计划付费视频未被任何镜头使用`);
    }

    plannedVideoSeconds = videos.reduce((sum, asset) => sum + (Number.isFinite(asset.durationSec) ? asset.durationSec : 0), 0);
    if (plannedVideoSeconds > episode.budget.maxGeneratedVideoSeconds + 0.001) errors.push(`计划视频 ${plannedVideoSeconds}s 超预算`);

    const imagePrices = template?.image?.estimatedUsdPerImage ?? {};
    const expectedKeyframeRaw = keyframes.reduce((sum, asset) => {
      const price = imagePrices[asset.model];
      if (!Number.isFinite(price)) errors.push(`${asset.id}: 模板缺少关键帧模型价格快照`);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);
    const expectedVideoRaw = videos.reduce((sum, asset) => {
      const price = videoPriceForModel(template, asset.model);
      if (!Number.isFinite(price)) errors.push(`${asset.id}: 模板缺少视频模型价格快照`);
      return sum + (Number.isFinite(price) && Number.isFinite(asset.durationSec) ? price * asset.durationSec : 0);
    }, 0);
    const expectedKeyframeUsd = money(expectedKeyframeRaw);
    const expectedVideoUsd = money(expectedVideoRaw);
    const expectedFirstPass = money(expectedKeyframeRaw + expectedVideoRaw);
    const cost = generationPlan.costEstimate;
    if (!cost || typeof cost !== "object" || Array.isArray(cost)) {
      errors.push("generation-plan.costEstimate 必须是对象");
    } else {
      if (cost.plannedVideoSeconds !== plannedVideoSeconds) errors.push(`costEstimate.plannedVideoSeconds 应为 ${plannedVideoSeconds}`);
      if (cost.plannedVideoUsd !== expectedVideoUsd) errors.push(`costEstimate.plannedVideoUsd 应为 ${expectedVideoUsd}`);
      if (cost.plannedKeyframeCeilingUsd !== expectedKeyframeUsd) errors.push(`costEstimate.plannedKeyframeCeilingUsd 应为 ${expectedKeyframeUsd}`);
      if (cost.firstPassCeilingUsd !== expectedFirstPass) errors.push(`costEstimate.firstPassCeilingUsd 应为 ${expectedFirstPass}`);
      if (cost.automaticRetries !== 0) errors.push("costEstimate.automaticRetries 必须为 0");
      if (Number.isFinite(cost.firstPassCeilingUsd) && cost.firstPassCeilingUsd > episode.budget.maxUsdFirstPass + 0.001) {
        errors.push(`首轮成本 $${cost.firstPassCeilingUsd} 超过 episode budget $${episode.budget.maxUsdFirstPass}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    episode,
    episodeHash: hashJson(episode),
    totalMs,
    renderFrames,
    targetFrames,
    trueVideoCoverage,
    remotionEnhancedCoverage,
    dynamicCoverage: trueVideoCoverage,
    plannedVideoSeconds,
    errors,
    warnings,
  };
}
