(function () {
  const SITE_PROFILES = [
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

  const site = detectSite(window.location.hostname)

  if (!site) {
    return
  }

  const state = {
    draftText: '',
    estimate: estimateRequest(site, ''),
    currentChatTotals: {
      requests: 0,
      electricityKwh: 0,
      waterMl: 0,
    },
    session: {
      requests: 0,
      electricityKwh: 0,
      waterMl: 0,
    },
    waterHistory: {
      currentChatMl: 0,
      siteAllTimeMl: 0,
      globalAllTimeMl: 0,
    },
    currentChatKey: '',
    expanded: true,
    root: null,
    lastSubmissionKey: '',
    lastSubmissionAt: 0,
  }

  init()

  async function init() {
    mountPanel()
    state.currentChatKey = getCurrentChatKey(site.id)

    try {
      state.session = await readSession(site.id)
    } catch {
      state.session = {
        requests: 0,
        electricityKwh: 0,
        waterMl: 0,
      }
    }

    try {
      state.waterHistory = await readWaterHistory(site.id, state.currentChatKey)
    } catch {
      state.waterHistory = {
        currentChatMl: 0,
        siteAllTimeMl: 0,
        globalAllTimeMl: 0,
      }
    }

    try {
      state.currentChatTotals = await readCurrentChatTotals(site.id, state.currentChatKey)
    } catch {
      state.currentChatTotals = {
        requests: 0,
        electricityKwh: 0,
        waterMl: 0,
      }
    }

    refreshDraft()
    renderPanel()

    window.setInterval(refreshDraft, 1600)

    document.addEventListener('input', scheduleRefresh, true)
    document.addEventListener('keydown', handleKeydown, true)
    document.addEventListener('click', handleClick, true)
    chrome.storage.onChanged.addListener(handleStorageChanged)

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message?.type !== 'AI_IMPACT_METER_GET_SNAPSHOT') {
        return
      }

      Promise.resolve(refreshDraft())
        .then(() => {
          sendResponse({
            source: 'live',
            supported: true,
            status: state.draftText ? 'Live estimate from current composer.' : 'Sticky on-page meter is active. Start typing to estimate.',
            draftText: state.draftText,
            site: {
              id: site.id,
              label: site.label,
              color: site.color,
            },
            estimate: state.estimate,
            currentChatTotals: state.currentChatTotals,
            session: state.session,
            waterHistory: state.waterHistory,
          })
        })
        .catch(() => {
          sendResponse({
            source: 'live',
            supported: true,
            status: 'Unable to read the current draft cleanly.',
            draftText: '',
            site: {
              id: site.id,
              label: site.label,
              color: site.color,
            },
            estimate: state.estimate,
            currentChatTotals: state.currentChatTotals,
            session: state.session,
            waterHistory: state.waterHistory,
          })
        })

      return true
    })
  }

  function scheduleRefresh() {
    window.setTimeout(refreshDraft, 120)
  }

  function handleStorageChanged(changes, areaName) {
    if (areaName !== 'local') {
      return
    }

    let shouldRender = false
    const currentChatStorageKey = chatWaterKey(site.id, state.currentChatKey)
    const currentSessionKey = storageKey(site.id)
    const currentSiteWaterKey = siteWaterKey(site.id)
    const combinedWaterKey = globalWaterKey()

    if (changes[currentChatStorageKey]?.newValue) {
      const nextChat = changes[currentChatStorageKey].newValue
      state.currentChatTotals = {
        requests: nextChat.requests ?? 0,
        electricityKwh: nextChat.electricityKwh ?? 0,
        waterMl: nextChat.waterMl ?? 0,
      }
      state.waterHistory = {
        ...state.waterHistory,
        currentChatMl: nextChat.waterMl ?? 0,
      }
      shouldRender = true
    }

    if (changes[currentSessionKey]?.newValue) {
      const nextSession = changes[currentSessionKey].newValue
      state.session = {
        requests: nextSession.requests ?? 0,
        electricityKwh: nextSession.electricityKwh ?? 0,
        waterMl: nextSession.waterMl ?? 0,
      }
      shouldRender = true
    }

    if (changes[currentSiteWaterKey]?.newValue) {
      const nextSite = changes[currentSiteWaterKey].newValue
      state.waterHistory = {
        ...state.waterHistory,
        siteAllTimeMl: nextSite.waterMl ?? 0,
      }
      shouldRender = true
    }

    if (changes[combinedWaterKey]?.newValue) {
      const nextGlobal = changes[combinedWaterKey].newValue
      state.waterHistory = {
        ...state.waterHistory,
        globalAllTimeMl: nextGlobal.waterMl ?? 0,
      }
      shouldRender = true
    }

    if (shouldRender) {
      renderPanel()
    }
  }

  function handleKeydown(event) {
    const target = event.target
    const isComposer = target instanceof HTMLElement && looksLikeComposer(target)

    if (event.key === 'Enter' && !event.shiftKey && isComposer) {
      recordSubmission(readComposerText())
    }
  }

  function handleClick(event) {
    const toggleButton = event.target instanceof Element ? event.target.closest('[data-ai-impact-toggle]') : null

    if (toggleButton) {
      state.expanded = !state.expanded
      renderPanel()
      return
    }

    const button = event.target instanceof Element ? event.target.closest('button') : null

    if (!button) {
      return
    }

    const label = [
      button.getAttribute('aria-label'),
      button.getAttribute('title'),
      button.getAttribute('data-testid'),
      button.textContent,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (/send|submit|arrow up|up/.test(label)) {
      recordSubmission(readComposerText())
    }
  }

  function mountPanel() {
    if (document.getElementById('ai-impact-meter-root')) {
      state.root = document.getElementById('ai-impact-meter-root')
      return
    }

    const root = document.createElement('div')
    root.id = 'ai-impact-meter-root'
    document.documentElement.appendChild(root)
    state.root = root
  }

  async function refreshDraft() {
    const nextChatKey = getCurrentChatKey(site.id)

    if (nextChatKey !== state.currentChatKey) {
      state.currentChatKey = nextChatKey

      try {
        state.waterHistory = await readWaterHistory(site.id, state.currentChatKey)
      } catch {
        state.waterHistory = {
          currentChatMl: 0,
          siteAllTimeMl: state.waterHistory.siteAllTimeMl,
          globalAllTimeMl: state.waterHistory.globalAllTimeMl,
        }
      }

      try {
        state.currentChatTotals = await readCurrentChatTotals(site.id, state.currentChatKey)
      } catch {
        state.currentChatTotals = {
          requests: 0,
          electricityKwh: 0,
          waterMl: 0,
        }
      }
    }

    const draftText = readComposerText()
    state.draftText = draftText
    state.estimate = estimateRequest(site, draftText)
    renderPanel()
  }

  function renderPanel() {
    if (!state.root) {
      return
    }

    const hasDraft = Boolean(state.draftText)
    const fillPercent = getBeakerFillPercent(state.estimate.waterMl)
    const helperLine = hasDraft
      ? `~${formatCompactNumber(state.estimate.inputTokens)} prompt tokens - ~${formatCompactNumber(state.estimate.outputTokens)} est. reply tokens`
      : 'Type a prompt and the meter stays live on this page.'

    const comparisonLine = hasDraft
      ? `${state.estimate.comparison} - cooling-equivalent water only`
      : 'Best for comparing prompts, not exact metering.'

    state.root.innerHTML = `
      <section class="aimeter-shell" data-collapsed="${String(!state.expanded)}">
        <header class="aimeter-header">
          <div>
            <p class="aimeter-brand">AI IMPACT METER</p>
            <p class="aimeter-status">${hasDraft ? 'Watching current draft on this page.' : 'Pinned on screen. Waiting for a prompt.'}</p>
          </div>
          <button type="button" class="aimeter-toggle" data-ai-impact-toggle="true" aria-label="${state.expanded ? 'Collapse meter' : 'Expand meter'}">
            ${state.expanded ? '-' : '+'}
          </button>
        </header>

        <div class="aimeter-body">
          <div class="aimeter-toprow">
            <span class="aimeter-site">${escapeHtml(site.label)}</span>
            <span class="aimeter-live aimeter-live-${hasDraft ? 'live' : 'standby'}">${hasDraft ? 'LIVE' : 'STANDBY'}</span>
          </div>

          <section>
            <p class="aimeter-label">CURRENT CHAT USED</p>
            <div class="aimeter-request-layout">
              <div class="aimeter-panel">
                <div class="aimeter-metric">
                  <div class="aimeter-value">${state.currentChatTotals.electricityKwh.toFixed(6)}</div>
                  <div class="aimeter-unit">kWh</div>
                  <div class="aimeter-name">Electricity</div>
                </div>
                <div class="aimeter-divider"></div>
                <div class="aimeter-metric">
                  <div class="aimeter-value">${state.currentChatTotals.waterMl.toFixed(2)}</div>
                  <div class="aimeter-unit">mL</div>
                  <div class="aimeter-name">Water</div>
                </div>
              </div>

              <div class="aimeter-beaker">
                <p class="aimeter-beaker-title">THIS MESSAGE</p>
                <div class="aimeter-beaker-wrap" aria-hidden="true">
                  <div class="aimeter-beaker-rim"></div>
                  <div class="aimeter-beaker-body">
                    <div class="aimeter-beaker-water" style="height:${hasDraft ? fillPercent : 0}%">
                      <div class="aimeter-beaker-wave"></div>
                    </div>
                    <span class="aimeter-beaker-mark aimeter-beaker-mark-1"></span>
                    <span class="aimeter-beaker-mark aimeter-beaker-mark-2"></span>
                    <span class="aimeter-beaker-mark aimeter-beaker-mark-3"></span>
                    <span class="aimeter-beaker-mark aimeter-beaker-mark-4"></span>
                  </div>
                </div>
                <div class="aimeter-beaker-readout">
                  <strong>${hasDraft ? state.estimate.waterMl.toFixed(2) : '--'}</strong>
                  <span>mL now</span>
                </div>
              </div>
            </div>
            <p class="aimeter-helper">${state.currentChatTotals.requests} reqs counted in this chat so far</p>
            <p class="aimeter-helper aimeter-helper-dim">${helperLine}</p>
            <p class="aimeter-helper aimeter-helper-dim">${comparisonLine}</p>
          </section>

          <section>
            <p class="aimeter-label">SESSION TOTAL</p>
            <div class="aimeter-session-grid">
              <span class="aimeter-session-pill">${state.session.electricityKwh.toFixed(4)} kWh</span>
              <span class="aimeter-session-pill">${state.session.waterMl.toFixed(1)} mL</span>
              <span class="aimeter-session-pill">${state.session.requests} reqs</span>
            </div>
          </section>

          <section>
            <p class="aimeter-label">WATER HISTORY</p>
            <div class="aimeter-history-grid">
              <span class="aimeter-history-pill">
                <strong>${state.waterHistory.currentChatMl.toFixed(1)}</strong>
                <span>mL</span>
                <small>Current chat</small>
              </span>
              <span class="aimeter-history-pill">
                <strong>${state.waterHistory.siteAllTimeMl.toFixed(1)}</strong>
                <span>mL</span>
                <small>This site</small>
              </span>
              <span class="aimeter-history-pill">
                <strong>${state.waterHistory.globalAllTimeMl.toFixed(1)}</strong>
                <span>mL</span>
                <small>All sites</small>
              </span>
            </div>
          </section>

          <div class="aimeter-confidence">
            <span>${state.estimate.confidence.label} confidence</span>
            <span class="aimeter-confidence-value">${state.estimate.confidence.score}%</span>
          </div>

          <div class="aimeter-footnote">Prompt text is processed locally. Only aggregate counters are stored. Electricity is closer than water.</div>
        </div>
      </section>
    `
  }

  function readComposerText() {
    const selectors = [
      'textarea',
      '[contenteditable="true"][role="textbox"]',
      '[contenteditable="true"][data-lexical-editor="true"]',
      'div.ProseMirror',
      '[contenteditable="true"]',
    ]

    const candidates = selectors
      .flatMap((selector) => Array.from(document.querySelectorAll(selector)))
      .filter((element) => element instanceof HTMLElement && isVisible(element))
      .map((element) => ({
        element,
        text: readElementText(element),
      }))
      .filter((entry) => entry.text)
      .sort((left, right) => right.text.length - left.text.length)

    return candidates[0]?.text ?? ''
  }

  function readElementText(element) {
    if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) {
      return element.value.trim()
    }

    return (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim()
  }

  function looksLikeComposer(element) {
    return element.matches('textarea, [contenteditable="true"], div.ProseMirror')
  }

  function isVisible(element) {
    const styles = window.getComputedStyle(element)
    return styles.display !== 'none' && styles.visibility !== 'hidden'
  }

  function recordSubmission(text) {
    const normalized = text.trim()

    if (!normalized) {
      return
    }

    const now = Date.now()
    const submissionKey = `${normalized.slice(0, 160)}::${normalized.length}`

    if (submissionKey === state.lastSubmissionKey && now - state.lastSubmissionAt < 3500) {
      return
    }

    state.lastSubmissionKey = submissionKey
    state.lastSubmissionAt = now

    const estimate = estimateRequest(site, normalized)
    const chatKey = getCurrentChatKey(site.id)
    state.currentChatKey = chatKey

    Promise.all([
      updateSession(site.id, estimate),
      updateWaterHistory(site.id, chatKey, estimate),
    ])
      .then(([session, usageUpdate]) => {
        state.session = session
        state.currentChatTotals = usageUpdate.currentChatTotals
        state.waterHistory = usageUpdate.waterHistory
        renderPanel()
      })
      .catch(() => {})
  }

  function approximateTokens(text) {
    const compact = text.replace(/\s+/g, ' ').trim()
    return compact ? Math.max(1, Math.round(compact.length / 4)) : 0
  }

  function countWords(text) {
    const compact = text.trim()
    return compact ? compact.split(/\s+/).length : 0
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value))
  }

  function buildComparison(electricityWh) {
    const ledSeconds = Math.max(4, Math.round((electricityWh / 9) * 3600))
    return `about ${ledSeconds} sec of a 9W LED bulb`
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

  function estimateRequest(profile, draftText) {
    const fallbackText = 'Estimate this prompt impact.'
    const promptText = draftText.trim() || fallbackText
    const inputTokens = approximateTokens(promptText)
    const wordCount = countWords(promptText)
    const complexityBoost = clamp(inputTokens / 1600, 0, 0.18)
    const outputTokens = Math.round(Math.max(72, inputTokens * (profile.responseMultiplier + complexityBoost)))
    const hiddenTokens = Math.round(outputTokens * profile.hiddenMultiplier)

    const electricityWh =
      profile.baseWh +
      (inputTokens / 1000) * profile.inputWhPer1k +
      (outputTokens / 1000) * profile.outputWhPer1k +
      (hiddenTokens / 1000) * profile.hiddenWhPer1k

    const electricityKwh = electricityWh / 1000
    const waterMl = electricityWh * profile.waterMlPerWh

    let confidenceScore = Math.round(profile.confidenceBase * 100)
    confidenceScore -= wordCount < 10 ? 8 : 3
    confidenceScore -= profile.toolPenalty * 25
    confidenceScore -= draftText.trim() ? 0 : 6
    confidenceScore += wordCount > 35 ? 3 : 0
    confidenceScore = clamp(Math.round(confidenceScore), 42, 81)

    const confidenceLabel = confidenceScore >= 72 ? 'High' : confidenceScore >= 56 ? 'Medium' : 'Low'
    const variability = clamp(
      0.22 +
        profile.toolPenalty +
        (wordCount < 10 ? 0.16 : 0.06) +
        (inputTokens > 1200 ? 0.06 : 0) +
        (draftText.trim() ? 0 : 0.08),
      0.26,
      0.7,
    )

    return {
      inputTokens,
      outputTokens,
      hiddenTokens,
      wordCount,
      electricityKwh,
      waterMl,
      comparison: buildComparison(electricityWh),
      accuracySummary: buildAccuracySummary(confidenceLabel),
      confidence: {
        score: confidenceScore,
        label: confidenceLabel,
      },
      range: {
        lowKwh: (electricityWh * (1 - variability * 0.55)) / 1000,
        highKwh: (electricityWh * (1 + variability)) / 1000,
        lowWaterMl: waterMl * (1 - variability * 0.58),
        highWaterMl: waterMl * (1 + variability * 1.05),
      },
    }
  }

  function detectSite(hostname) {
    const normalized = hostname.toLowerCase().replace(/^www\./, '')

    return (
      SITE_PROFILES.find((profile) =>
        profile.hostnames.some((host) => {
          const candidate = host.toLowerCase().replace(/^www\./, '')
          return normalized === candidate || normalized.endsWith(`.${candidate}`)
        }),
      ) ?? null
    )
  }

  function storageKey(siteId) {
    const date = new Date().toISOString().slice(0, 10)
    return `ai-impact-meter:session:${siteId}:${date}`
  }

  function getCurrentChatKey(siteId) {
    const path = window.location.pathname || '/'
    return `${siteId}:${path}`
  }

  function chatWaterKey(siteId, chatKey) {
    return `ai-impact-meter:water:chat:${siteId}:${chatKey}`
  }

  function siteWaterKey(siteId) {
    return `ai-impact-meter:water:site:${siteId}`
  }

  function globalWaterKey() {
    return 'ai-impact-meter:water:global'
  }

  async function readSession(siteId) {
    const key = storageKey(siteId)
    const stored = await storageGet(key)
    return stored[key] ?? { requests: 0, electricityKwh: 0, waterMl: 0 }
  }

  async function updateSession(siteId, estimate) {
    const key = storageKey(siteId)
    const current = await readSession(siteId)
    const next = {
      requests: current.requests + 1,
      electricityKwh: current.electricityKwh + estimate.electricityKwh,
      waterMl: current.waterMl + estimate.waterMl,
    }

    await storageSet({ [key]: next })
    return next
  }

  async function readWaterHistory(siteId, chatKey) {
    const keys = [chatWaterKey(siteId, chatKey), siteWaterKey(siteId), globalWaterKey()]
    const stored = await storageGet(keys)
    const chatEntry = stored[chatWaterKey(siteId, chatKey)] ?? { waterMl: 0 }
    const siteEntry = stored[siteWaterKey(siteId)] ?? { waterMl: 0 }
    const globalEntry = stored[globalWaterKey()] ?? { waterMl: 0 }

    return {
      currentChatMl: chatEntry.waterMl ?? 0,
      siteAllTimeMl: siteEntry.waterMl ?? 0,
      globalAllTimeMl: globalEntry.waterMl ?? 0,
    }
  }

  async function readCurrentChatTotals(siteId, chatKey) {
    const key = chatWaterKey(siteId, chatKey)
    const stored = await storageGet(key)
    const entry = stored[key] ?? {}

    return {
      requests: entry.requests ?? 0,
      electricityKwh: entry.electricityKwh ?? 0,
      waterMl: entry.waterMl ?? 0,
    }
  }

  async function updateWaterHistory(siteId, chatKey, estimate) {
    const chatStorageKey = chatWaterKey(siteId, chatKey)
    const siteStorageKey = siteWaterKey(siteId)
    const globalStorageKey = globalWaterKey()
    const stored = await storageGet([chatStorageKey, siteStorageKey, globalStorageKey])

    const nextChat = {
      waterMl: (stored[chatStorageKey]?.waterMl ?? 0) + estimate.waterMl,
      electricityKwh: (stored[chatStorageKey]?.electricityKwh ?? 0) + estimate.electricityKwh,
      requests: (stored[chatStorageKey]?.requests ?? 0) + 1,
    }
    const nextSite = {
      waterMl: (stored[siteStorageKey]?.waterMl ?? 0) + estimate.waterMl,
      requests: (stored[siteStorageKey]?.requests ?? 0) + 1,
    }
    const nextGlobal = {
      waterMl: (stored[globalStorageKey]?.waterMl ?? 0) + estimate.waterMl,
      requests: (stored[globalStorageKey]?.requests ?? 0) + 1,
    }

    await storageSet({
      [chatStorageKey]: nextChat,
      [siteStorageKey]: nextSite,
      [globalStorageKey]: nextGlobal,
    })

    return {
      currentChatTotals: {
        requests: nextChat.requests,
        electricityKwh: nextChat.electricityKwh,
        waterMl: nextChat.waterMl,
      },
      waterHistory: {
        currentChatMl: nextChat.waterMl,
        siteAllTimeMl: nextSite.waterMl,
        globalAllTimeMl: nextGlobal.waterMl,
      },
    }
  }

  function storageGet(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (result) => {
        const error = chrome.runtime?.lastError
        if (error) {
          reject(new Error(error.message))
          return
        }

        resolve(result)
      })
    })
  }

  function storageSet(value) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(value, () => {
        const error = chrome.runtime?.lastError
        if (error) {
          reject(new Error(error.message))
          return
        }

        resolve()
      })
    })
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  function formatCompactNumber(value) {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
  }

  function getBeakerFillPercent(waterMl) {
    if (!waterMl || waterMl <= 0) {
      return 0
    }

    const scaled = Math.sqrt(Math.min(waterMl / 3.5, 1)) * 100
    return Math.min(96, Math.max(10, scaled))
  }
})()
