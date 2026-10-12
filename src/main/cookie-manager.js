const { session } = require('electron');
const crypto = require('crypto');

class CookieManager {
  /**
   * Parse Cookie from JSON (Cookie-Editor format) or Raw String
   */
  parseCookieInput(input) {
    if (!input || typeof input !== 'string') return { cookieString: '', cookieArray: [] };

    const trimmed = input.trim();
    let cookieArray = [];

    // Try parsing as JSON (from Cookie-Editor extension)
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          cookieArray = parsed;
        } else if (parsed && Array.isArray(parsed.cookies)) {
          cookieArray = parsed.cookies;
        }
      } catch (err) {
        console.warn('Failed to parse cookie as JSON, treating as raw string:', err);
      }
    }

    if (cookieArray.length > 0) {
      const validPairs = cookieArray
        .filter(c => c && c.name && c.value !== undefined)
        .map(c => `${c.name}=${c.value}`);
      return {
        cookieString: validPairs.join('; '),
        cookieArray
      };
    }

    // Treat as raw cookie header string: "name1=val1; name2=val2"
    const rawPairs = trimmed
      .split(';')
      .map(part => part.trim())
      .filter(Boolean);

    const generatedArray = rawPairs.map(part => {
      const eqIdx = part.indexOf('=');
      if (eqIdx !== -1) {
        return {
          name: part.slice(0, eqIdx).trim(),
          value: part.slice(eqIdx + 1).trim(),
          domain: '.labs.google',
          path: '/'
        };
      }
      return null;
    }).filter(Boolean);

    return {
      cookieString: rawPairs.join('; '),
      cookieArray: generatedArray
    };
  }

  /**
   * Inject parsed cookies into Electron's Chromium session
   */
  async injectCookiesIntoSession(cookieArray, targetUrl = 'https://labs.google') {
    if (!cookieArray || !Array.isArray(cookieArray)) return false;

    const ses = session.defaultSession;
    for (const c of cookieArray) {
      if (!c.name || c.value === undefined) continue;
      try {
        await ses.cookies.set({
          url: targetUrl,
          name: c.name,
          value: String(c.value),
          domain: c.domain ? c.domain.replace(/^\./, '') : 'labs.google',
          path: c.path || '/',
          secure: c.secure !== undefined ? Boolean(c.secure) : true,
          httpOnly: Boolean(c.httpOnly),
          sameSite: c.sameSite === 'Strict' ? 'strict' : c.sameSite === 'Lax' ? 'lax' : 'no_restriction'
        });
      } catch (err) {
        // Silently skip any invalid cookie fields
      }
    }
    return true;
  }

  /**
   * Extract all current cookies from Electron session for labs.google
   */
  async extractSessionCookies() {
    const ses = session.defaultSession;
    const cookies = await ses.cookies.get({ domain: 'google.com' });
    const labsCookies = await ses.cookies.get({ domain: 'labs.google' });
    const all = [...cookies, ...labsCookies];

    // Deduplicate by name
    const unique = new Map();
    for (const c of all) {
      unique.set(c.name, c);
    }
    const finalArray = Array.from(unique.values());
    const cookieString = finalArray.map(c => `${c.name}=${c.value}`).join('; ');

    return {
      cookieString,
      cookieArray: finalArray
    };
  }

  /**
   * Compute Google SAPISIDHASH authorization header from cookie input
   */
  generateSapisidHash(cookieInput, origin = 'https://labs.google') {
    const { cookieArray, cookieString } = this.parseCookieInput(cookieInput);
    let sapisid = '';

    if (cookieArray && cookieArray.length > 0) {
      const match = cookieArray.find(c => 
        c && (c.name === 'SAPISID' || c.name === '__Secure-3PAPISID' || c.name === '__Secure-1PAPISID')
      );
      if (match) sapisid = match.value;
    }

    if (!sapisid && cookieString) {
      const regexMatch = cookieString.match(/(?:^|;\s*)(?:SAPISID|__Secure-3PAPISID|__Secure-1PAPISID)=([^;]+)/);
      if (regexMatch) sapisid = regexMatch[1];
    }

    if (!sapisid) return null;

    const timestamp = Math.floor(Date.now() / 1000);
    const hash = crypto.createHash('sha1').update(`${timestamp} ${sapisid} ${origin}`).digest('hex');
    return `SAPISIDHASH ${timestamp}_${hash}`;
  }
}

module.exports = new CookieManager();
