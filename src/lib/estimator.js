import { getSiteProfile } from './siteProfiles'

const DEFAULT_DRAFT = 'Compare frontier AI assistants on sustainability and suggest 3 lower-impact prompting habits.'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function approximateTokens(text = '') {
  const compact = text.replace(/\s+/g, ' ').trim()
  if (!compact) {
    return 0
  }

  return Math.max(1, Math.round(compact.length / 4))
}

export function countWords(text = '') {
  const compact = text.trim()
  return compact ? compact.split(/\s+/).length : 0
}

function getConfidenceLabel(score) {
  if (score >= 72) {
    return 'High'
  }

  if (score >= 56) {
    return 'Medium'
  }

  return 'Low'
}

function buildAccuracySummary(label) {
  if (label === 'High') {
    return 'Good for comparing one prompt against another. Electricity is directionally solid here, but water still swings with the data center and cooling setup.'
  }

  if (label === 'Medium') {
    return 'Useful as a rough signal, not a meter. Electricity is usually closer than water, and tool-heavy replies can widen the gap.'
  }

  return 'Treat this as a broad hint only. Hidden reasoning, search, and region-specific cooling can move the real footprint a lot.'
}

function buildComparison(electricityWh) {
  const ledSeconds = Math.max(4, Math.round((electricityWh / 9) * 3600))
  return `about ${ledSeconds} sec of a 9W LED bulb`
}

export function estimateRequest({ siteKey = 'chatgpt', draftText = '' } = {}) {
  const site = getSiteProfile(siteKey)
  const normalizedText = draftText.trim()
  const promptText = normalizedText || DEFAULT_DRAFT
  const inputTokens = approximateTokens(promptText)
  const wordCount = countWords(promptText)
  const complexityBoost = clamp(inputTokens / 1600, 0, 0.18)
  const outputTokens = Math.round(Math.max(72, inputTokens * (site.responseMultiplier + complexityBoost)))
  const hiddenTokens = Math.round(outputTokens * site.hiddenMultiplier)

  const electricityWh =
    site.baseWh +
    (inputTokens / 1000) * site.inputWhPer1k +
    (outputTokens / 1000) * site.outputWhPer1k +
    (hiddenTokens / 1000) * site.hiddenWhPer1k

  const electricityKwh = electricityWh / 1000
  const waterMl = electricityWh * site.waterMlPerWh

  const variability = clamp(
    0.22 +
      site.toolPenalty +
      (wordCount < 10 ? 0.16 : 0.06) +
      (inputTokens > 1200 ? 0.06 : 0) +
      (normalizedText ? 0 : 0.08),
    0.26,
    0.7,
  )

  const lowWh = electricityWh * (1 - variability * 0.55)
  const highWh = electricityWh * (1 + variability)
  const lowWaterMl = waterMl * (1 - variability * 0.58)
  const highWaterMl = waterMl * (1 + variability * 1.05)

  let confidenceScore = Math.round(site.confidenceBase * 100)
  confidenceScore -= wordCount < 10 ? 8 : 3
  confidenceScore -= site.toolPenalty * 25
  confidenceScore -= normalizedText ? 0 : 6
  confidenceScore += wordCount > 35 ? 3 : 0
  confidenceScore = clamp(Math.round(confidenceScore), 42, 81)

  const confidenceLabel = getConfidenceLabel(confidenceScore)

  return {
    inputTokens,
    outputTokens,
    hiddenTokens,
    wordCount,
    electricityWh,
    electricityKwh,
    waterMl,
    range: {
      lowKwh: lowWh / 1000,
      highKwh: highWh / 1000,
      lowWaterMl,
      highWaterMl,
    },
    comparison: buildComparison(electricityWh),
    accuracySummary: buildAccuracySummary(confidenceLabel),
    confidence: {
      score: confidenceScore,
      label: confidenceLabel,
    },
  }
}

export function buildPreviewSnapshot(options = {}) {
  const siteKey = options.siteKey ?? 'chatgpt'
  const draftText = options.draftText ?? DEFAULT_DRAFT
  const site = getSiteProfile(siteKey)
  const estimate = estimateRequest({ siteKey, draftText })
  const requests = options.requests ?? 3

  return {
    source: options.source ?? 'demo',
    supported: options.supported ?? true,
    status: options.status ?? 'Previewing the estimator model.',
    draftText,
    site: {
      id: site.id,
      label: site.label,
      color: site.color,
    },
    estimate,
    currentChatTotals: {
      requests: options.currentChatRequests ?? 4,
      electricityKwh: options.currentChatElectricityKwh ?? estimate.electricityKwh * 2.7,
      waterMl: options.currentChatWaterMl ?? estimate.waterMl * 2.4,
    },
    session: {
      requests,
      electricityKwh: options.sessionElectricityKwh ?? estimate.electricityKwh * 3.4,
      waterMl: options.sessionWaterMl ?? estimate.waterMl * 3.1,
    },
    waterHistory: {
      currentChatMl: options.currentChatMl ?? estimate.waterMl * 1.7,
      siteAllTimeMl: options.siteAllTimeMl ?? estimate.waterMl * 15.8,
      globalAllTimeMl: options.globalAllTimeMl ?? estimate.waterMl * 41.3,
    },
  }
}

export function formatEnergyKwh(value) {
  return Number(value).toFixed(6)
}

export function formatSessionEnergyKwh(value) {
  return Number(value).toFixed(4)
}

export function formatWaterMl(value, digits = 2) {
  return Number(value).toFixed(digits)
}

export function formatCompactNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

export function getConfidenceTone(label) {
  if (label === 'High') {
    return 'high'
  }

  if (label === 'Medium') {
    return 'medium'
  }

  return 'low'
}
