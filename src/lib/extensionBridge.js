import { buildPreviewSnapshot } from './estimator'
import { detectSiteFromUrl } from './siteProfiles'

function hasExtensionApis() {
  return typeof chrome !== 'undefined' && Boolean(chrome.tabs?.query)
}

function queryActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const error = chrome.runtime?.lastError

      if (error) {
        reject(new Error(error.message))
        return
      }

      resolve(tabs?.[0] ?? null)
    })
  })
}

function sendMessage(tabId, payload) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, payload, (response) => {
      const error = chrome.runtime?.lastError

      if (error) {
        resolve(null)
        return
      }

      resolve(response ?? null)
    })
  })
}

export async function loadPopupSnapshot() {
  if (!hasExtensionApis()) {
    return buildPreviewSnapshot()
  }

  try {
    const activeTab = await queryActiveTab()

    if (!activeTab?.id) {
      const snapshot = buildPreviewSnapshot({
        status: 'No active tab detected.',
        supported: false,
      })
      return {
        ...snapshot,
        site: {
          id: 'preview',
          label: 'Preview',
          color: '#8e96ba',
        },
      }
    }

    const liveSnapshot = await sendMessage(activeTab.id, { type: 'AI_IMPACT_METER_GET_SNAPSHOT' })

    if (liveSnapshot?.site && liveSnapshot?.estimate) {
      return liveSnapshot
    }

    const matchedSite = detectSiteFromUrl(activeTab.url ?? '')

    if (matchedSite) {
      return buildPreviewSnapshot({
        siteKey: matchedSite.id,
        draftText: '',
        source: 'demo',
        status: 'Supported site detected. Type in the composer to get a live estimate.',
      })
    }

    const snapshot = buildPreviewSnapshot({
      siteKey: 'chatgpt',
      supported: false,
      source: 'demo',
      status: 'This tab is not supported yet.',
    })
    return {
      ...snapshot,
      site: {
        id: 'unsupported',
        label: 'Unsupported',
        color: '#8e96ba',
      },
    }
  } catch {
    const snapshot = buildPreviewSnapshot({
      status: 'Falling back to preview mode.',
    })
    return {
      ...snapshot,
      site: {
        id: 'preview',
        label: 'Preview',
        color: '#8e96ba',
      },
    }
  }
}
