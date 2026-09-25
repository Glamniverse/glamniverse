// Basic Hobby page views only. Never called by a world, controller, or frame loop.
export const OPT_OUT_KEY = 'glamniverse.analyticsOptOut'
const PRODUCTION_HOST = 'www.glamniverse.music'

function confirmPreference(document, message) {
  const notice = document.createElement('div')
  notice.setAttribute('role', 'status')
  notice.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;z-index:10005;padding:12px;background:#18002f;color:white;border:1px solid #b782ff;border-radius:12px;'
  const text = document.createElement('span')
  text.textContent = message
  const close = document.createElement('button')
  close.textContent = 'Dismiss'
  close.style.cssText = 'margin-left:12px;cursor:pointer;'
  close.onclick = () => notice.remove()
  notice.append(text, close)
  document.body.appendChild(notice)
}

// Injectable browser/loader let tests exercise production rules without sending traffic.
export function createAnalyticsInitializer({
  load = () => import('@vercel/analytics'),
  notify = confirmPreference,
} = {}) {
  let initialized = false
  return async function initialize({ production = false, browser = window } = {}) {
    if (initialized) return
    initialized = true
    try {
      const url = new URL(browser.location.href)
      const controls = url.searchParams.getAll('analytics')
      // Opt-out wins if a URL accidentally contains conflicting controls.
      const control = controls.includes('off') ? 'off' : controls.includes('on') ? 'on' : null
      let stored = true
      if (control) {
        try {
          if (control === 'off') browser.localStorage.setItem(OPT_OUT_KEY, 'true')
          else browser.localStorage.removeItem(OPT_OUT_KEY)
        } catch { stored = false }
        url.searchParams.delete('analytics')
        // Preserve other query parameters, hash and history state; no reload/push.
        browser.history.replaceState(browser.history.state, '', url.pathname + url.search + url.hash)
        try {
          notify(browser.document, stored
            ? (control === 'off' ? 'Analytics disabled on this browser.' : 'Analytics enabled on this browser for the public site.')
            : 'Browser storage unavailable. Analytics disabled for this page; preference could not be saved.')
        } catch { /* Confirmation UI must never affect the site. */ }
        if (control === 'off' || !stored) return
      }
      if (!production || url.protocol !== 'https:' || url.hostname !== PRODUCTION_HOST || url.port) return
      const allowed = () => {
        try { return browser.localStorage.getItem(OPT_OUT_KEY) !== 'true' }
        catch { return false } // Cannot read the preference: fail closed.
      }
      if (!allowed()) return
      const { inject } = await load()
      if (!allowed()) return // Preference may change while the module loads.
      inject({
        mode: 'production',
        debug: false,
        beforeSend: event => allowed() && event.type === 'pageview' ? event : null,
      })
      // The SDK logs blocked script loads; keep this optional integration silent.
      const script = browser.document.querySelector('script[data-sdkn="@vercel/analytics"]')
      if (script) script.onerror = () => {}
    } catch { /* Optional analytics: blocked imports/storage must not break the app. */ }
  }
}

export const initializeAnalytics = createAnalyticsInitializer()
