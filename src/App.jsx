import { useEffect, useState, startTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Droplets, Gauge, Minus, Plus, Sparkles, Zap } from 'lucide-react'
import { buildPreviewSnapshot, formatCompactNumber, formatEnergyKwh, formatSessionEnergyKwh, formatWaterMl, getConfidenceTone } from './lib/estimator'
import { loadPopupSnapshot } from './lib/extensionBridge'

function MetricCard({ icon: Icon, label, value, unit, tone }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon metric-icon-${tone}`}>
        <Icon size={14} strokeWidth={2.4} />
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-unit">{unit}</div>
      <div className="metric-label">{label}</div>
    </div>
  )
}

function SessionPill({ icon: Icon, value, label, tone }) {
  return (
    <div className={`session-pill session-pill-${tone}`}>
      <Icon size={12} strokeWidth={2.4} />
      <span>{value}</span>
      <span className="session-pill-label">{label}</span>
    </div>
  )
}

function getBeakerFillPercent(waterMl) {
  if (!waterMl || waterMl <= 0) {
    return 0
  }

  const scaled = Math.sqrt(Math.min(waterMl / 3.5, 1)) * 100
  return Math.min(96, Math.max(10, scaled))
}

function BeakerMeter({ waterMl }) {
  const fillPercent = getBeakerFillPercent(waterMl)

  return (
    <div className="beaker-meter">
      <p className="beaker-heading">THIS MESSAGE</p>

      <div className="beaker-wrap" aria-hidden="true">
        <div className="beaker-rim" />
        <div className="beaker-body">
          <motion.div
            className="beaker-water"
            initial={false}
            animate={{ height: `${fillPercent}%` }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <div className="beaker-wave" />
          </motion.div>

          <span className="beaker-mark beaker-mark-1" />
          <span className="beaker-mark beaker-mark-2" />
          <span className="beaker-mark beaker-mark-3" />
          <span className="beaker-mark beaker-mark-4" />
        </div>
      </div>

      <div className="beaker-readout">
        <span className="beaker-readout-value">{formatWaterMl(waterMl, 2)}</span>
        <span className="beaker-readout-unit">mL now</span>
      </div>
    </div>
  )
}

export default function App() {
  const [snapshot, setSnapshot] = useState(() => buildPreviewSnapshot())
  const [isExpanded, setIsExpanded] = useState(true)

  useEffect(() => {
    let isMounted = true

    const refreshSnapshot = async () => {
      const nextSnapshot = await loadPopupSnapshot()

      if (!isMounted) {
        return
      }

      startTransition(() => {
        setSnapshot(nextSnapshot)
      })
    }

    refreshSnapshot()
    const intervalId = window.setInterval(refreshSnapshot, 2000)
    const handleStorageChanged = () => {
      refreshSnapshot()
    }

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChanged)
    }

    return () => {
      isMounted = false
      window.clearInterval(intervalId)

      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChanged)
      }
    }
  }, [])

  const { site, estimate, currentChatTotals, session, supported, source, status, waterHistory } = snapshot
  const confidenceTone = getConfidenceTone(estimate.confidence.label)
  const liveLabel = source === 'live' ? 'LIVE' : 'DEMO'
  const helperText = snapshot.draftText
    ? `~${formatCompactNumber(estimate.inputTokens)} prompt tokens - ~${formatCompactNumber(estimate.outputTokens)} est. reply tokens`
    : 'Type into a supported chat box and the estimate will update here.'

  return (
    <main className="popup-shell">
      <motion.section
        className="meter-frame"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <header className="meter-header">
          <div className="brand-block">
            <div className="brand-icons">
              <span className="brand-glyph brand-glyph-energy">
                <Zap size={13} strokeWidth={2.4} />
              </span>
              <span className="brand-glyph brand-glyph-water">
                <Droplets size={13} strokeWidth={2.4} />
              </span>
            </div>

            <div>
              <p className="brand-title">AI IMPACT METER</p>
              <p className="brand-subtitle">{supported ? status : 'Open a supported AI site to go live.'}</p>
            </div>
          </div>

          <button
            type="button"
            className="expand-button"
            onClick={() => setIsExpanded((current) => !current)}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
          </button>
        </header>

        <div className="meter-body">
          <div className="site-row">
            <span className="site-pill" style={{ '--site-glow': site.color }}>
              {site.label}
            </span>

            <span className={`live-pill live-pill-${source === 'live' ? 'live' : 'demo'}`}>
              {liveLabel}
            </span>
          </div>

          <section className="request-section">
            <p className="section-label">CURRENT CHAT USED</p>

            <div className="request-layout">
              <div className="stats-panel">
                <MetricCard
                  icon={Zap}
                  label="Electricity"
                  value={formatEnergyKwh(currentChatTotals.electricityKwh)}
                  unit="kWh"
                  tone="energy"
                />

                <div className="stats-divider" />

                <MetricCard
                  icon={Droplets}
                  label="Water"
                  value={formatWaterMl(currentChatTotals.waterMl, 2)}
                  unit="mL"
                  tone="water"
                />
              </div>

              <BeakerMeter waterMl={estimate.waterMl} />
            </div>

            <p className="support-line">{currentChatTotals.requests} reqs counted in this chat so far</p>
            <p className="support-line support-line-dim">
              {helperText}
            </p>
            <p className="support-line support-line-dim">
              {(estimate.comparison ?? 'Rough impact estimate') + ' - cooling-equivalent water only'}
            </p>
          </section>

          <section className="session-section">
            <p className="section-label">SESSION TOTAL</p>

            <div className="session-grid">
              <SessionPill
                icon={Zap}
                value={formatSessionEnergyKwh(session.electricityKwh)}
                label="kWh"
                tone="energy"
              />
              <SessionPill
                icon={Droplets}
                value={formatWaterMl(session.waterMl, 1)}
                label="mL"
                tone="water"
              />
              <SessionPill
                icon={Sparkles}
                value={String(session.requests)}
                label="reqs"
                tone="count"
              />
            </div>
          </section>

          <section className="history-section">
            <p className="section-label">WATER HISTORY</p>

            <div className="history-grid">
              <div className="history-pill">
                <span className="history-value">{formatWaterMl(waterHistory.currentChatMl, 1)}</span>
                <span className="history-unit">mL</span>
                <span className="history-label">Current chat</span>
              </div>

              <div className="history-pill">
                <span className="history-value">{formatWaterMl(waterHistory.siteAllTimeMl, 1)}</span>
                <span className="history-unit">mL</span>
                <span className="history-label">This site</span>
              </div>

              <div className="history-pill">
                <span className="history-value">{formatWaterMl(waterHistory.globalAllTimeMl, 1)}</span>
                <span className="history-unit">mL</span>
                <span className="history-label">All sites</span>
              </div>
            </div>
          </section>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.section
                className={`accuracy-panel accuracy-panel-${confidenceTone}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div className="accuracy-header">
                  <div className="accuracy-heading">
                    <Gauge size={14} strokeWidth={2.4} />
                    <span>{estimate.confidence.label} accuracy</span>
                  </div>
                  <span className="confidence-score">{estimate.confidence.score}%</span>
                </div>

                <div className="confidence-track" aria-hidden="true">
                  <span className="confidence-fill" style={{ width: `${estimate.confidence.score}%` }} />
                </div>

                <p className="accuracy-copy">{estimate.accuracySummary ?? 'Useful as a rough signal, not an exact meter.'}</p>

                <div className="accuracy-range">
                  <span>Power likely {formatEnergyKwh(estimate.range.lowKwh)}-{formatEnergyKwh(estimate.range.highKwh)} kWh</span>
                  <span>Water likely {formatWaterMl(estimate.range.lowWaterMl, 2)}-{formatWaterMl(estimate.range.highWaterMl, 2)} mL</span>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          <footer className="meter-footer">
            <span>{supported ? 'Best for comparing prompts, not exact metering.' : 'Supported: ChatGPT, Claude, Gemini, Perplexity, DeepSeek, Grok, Copilot.'}</span>
            <span>{source === 'live' ? 'Live draft detected.' : 'Research-inspired heuristics preview.'}</span>
            <span>Prompt text is processed locally. Only aggregate counters are stored in browser storage.</span>
          </footer>
        </div>
      </motion.section>
    </main>
  )
}
