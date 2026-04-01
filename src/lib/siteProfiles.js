const profiles = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    color: '#79d8a0',
    hostnames: ['chatgpt.com', 'chat.openai.com'],
    inputWhPer1k: 0.04,
    outputWhPer1k: 0.11,
    hiddenWhPer1k: 0.07,
    baseWh: 0.028,
    responseMultiplier: 1.34,
    hiddenMultiplier: 0.44,
    waterMlPerWh: 4.7,
    confidenceBase: 0.69,
    toolPenalty: 0.04,
  },
  {
    id: 'claude',
    label: 'Claude',
    color: '#f5b176',
    hostnames: ['claude.ai'],
    inputWhPer1k: 0.042,
    outputWhPer1k: 0.115,
    hiddenWhPer1k: 0.075,
    baseWh: 0.029,
    responseMultiplier: 1.3,
    hiddenMultiplier: 0.48,
    waterMlPerWh: 4.8,
    confidenceBase: 0.68,
    toolPenalty: 0.04,
  },
  {
    id: 'gemini',
    label: 'Gemini',
    color: '#7cb4ff',
    hostnames: ['gemini.google.com'],
    inputWhPer1k: 0.038,
    outputWhPer1k: 0.104,
    hiddenWhPer1k: 0.069,
    baseWh: 0.027,
    responseMultiplier: 1.28,
    hiddenMultiplier: 0.42,
    waterMlPerWh: 4.4,
    confidenceBase: 0.66,
    toolPenalty: 0.05,
  },
  {
    id: 'perplexity',
    label: 'Perplexity',
    color: '#75e5d6',
    hostnames: ['perplexity.ai', 'www.perplexity.ai'],
    inputWhPer1k: 0.046,
    outputWhPer1k: 0.122,
    hiddenWhPer1k: 0.083,
    baseWh: 0.041,
    responseMultiplier: 1.56,
    hiddenMultiplier: 0.62,
    waterMlPerWh: 4.9,
    confidenceBase: 0.59,
    toolPenalty: 0.12,
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    color: '#6bc2ff',
    hostnames: ['chat.deepseek.com', 'deepseek.com'],
    inputWhPer1k: 0.037,
    outputWhPer1k: 0.1,
    hiddenWhPer1k: 0.064,
    baseWh: 0.025,
    responseMultiplier: 1.25,
    hiddenMultiplier: 0.38,
    waterMlPerWh: 4.2,
    confidenceBase: 0.65,
    toolPenalty: 0.05,
  },
  {
    id: 'grok',
    label: 'Grok',
    color: '#f08aa4',
    hostnames: ['grok.com', 'x.com'],
    inputWhPer1k: 0.043,
    outputWhPer1k: 0.118,
    hiddenWhPer1k: 0.079,
    baseWh: 0.03,
    responseMultiplier: 1.36,
    hiddenMultiplier: 0.5,
    waterMlPerWh: 4.7,
    confidenceBase: 0.61,
    toolPenalty: 0.09,
  },
  {
    id: 'copilot',
    label: 'Copilot',
    color: '#95a6ff',
    hostnames: ['copilot.microsoft.com'],
    inputWhPer1k: 0.041,
    outputWhPer1k: 0.109,
    hiddenWhPer1k: 0.072,
    baseWh: 0.028,
    responseMultiplier: 1.31,
    hiddenMultiplier: 0.44,
    waterMlPerWh: 4.6,
    confidenceBase: 0.64,
    toolPenalty: 0.07,
  },
]

export const SITE_PROFILES = Object.fromEntries(profiles.map((profile) => [profile.id, profile]))
export const SUPPORTED_SITES = profiles

export function getSiteProfile(siteKey = 'chatgpt') {
  return SITE_PROFILES[siteKey] ?? SITE_PROFILES.chatgpt
}

export function detectSiteFromHostname(hostname = '') {
  const normalized = hostname.toLowerCase().replace(/^www\./, '')

  return (
    profiles.find((profile) =>
      profile.hostnames.some((host) => {
        const candidate = host.toLowerCase().replace(/^www\./, '')
        return normalized === candidate || normalized.endsWith(`.${candidate}`)
      }),
    ) ?? null
  )
}

export function detectSiteFromUrl(url = '') {
  try {
    return detectSiteFromHostname(new URL(url).hostname)
  } catch {
    return null
  }
}
