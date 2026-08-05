/// <reference path="../pb_data/types.d.ts" />

/**
 * Endpoint de DEBUG para diagnosticar o problema de 401 após login PWA.
 *
 * Retorna o que o server vê na request (sem expor tokens completos por
 * segurança — só primeiros/últimos caracteres).
 *
 * Acesse: https://dev.planilha.ehtudo.app/debug-auth
 *
 * REMOVER este hook depois que o bug for resolvido.
 */
routerAdd("GET", "/debug-auth", (c) => {
  const headers = c.requestInfo().headers
  const authHeader = headers["Authorization"] || headers["authorization"] || ""
  const cookieHeader = headers["Cookie"] || headers["cookie"] || ""

  // Mascarar o token pra não vazar
  const maskToken = (t) => {
    if (!t) return ""
    if (t.length <= 20) return `<short:${t.length}>`
    return `${t.substring(0, 15)}...${t.substring(t.length - 10)} (len=${t.length})`
  }

  // Decodificar o payload do JWT (sem verificar assinatura)
  const decodeJwtPayload = (t) => {
    if (!t) return null
    // Remove "Bearer " se tiver
    const clean = t.startsWith("Bearer ") ? t.substring(7) : t
    const parts = clean.split(".")
    if (parts.length !== 3) return { error: "not a JWT" }
    try {
      // base64url decode
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
      const padded = payload + "==".substring(0, (4 - payload.length % 4) % 4)
      const decoded = JSON.parse(atob(padded))
      return decoded
    } catch (e) {
      return { error: "decode failed: " + (e?.message || String(e)) }
    }
  }

  // Token do header
  const headerTokenRaw = authHeader.startsWith("Bearer ")
    ? authHeader.substring(7)
    : authHeader
  const headerTokenPayload = decodeJwtPayload(headerTokenRaw)

  // Token do cookie (se houver)
  let cookieTokenRaw = ""
  let cookieTokenPayload = null
  const cookieMatch = cookieHeader.match(/pocketbase_auth=([^;]+)/)
  if (cookieMatch) {
    cookieTokenRaw = cookieMatch[1]
    cookieTokenPayload = decodeJwtPayload(cookieTokenRaw)
  }

  return c.json(200, {
    serverAuthValid: !!c.auth,
    serverAuthId: c.auth?.id || null,
    serverAuthEmail: c.auth?.email || null,
    authHeader: {
      present: !!authHeader,
      raw: maskToken(authHeader),
      tokenPayload: headerTokenPayload,
    },
    cookie: {
      present: !!cookieHeader,
      hasPbAuth: !!cookieMatch,
      tokenPayload: cookieTokenPayload,
      tokenMasked: maskToken(cookieTokenRaw),
    },
    // Headers brutos pra debug
    allHeaders: Object.keys(headers).sort(),
  })
})
