// Edge Runtime compatible session verification using Web Crypto API

const SECRET = process.env.SESSION_SECRET ?? "kiraya-dev-secret"

async function getKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

export async function verifySessionEdge(signed: string): Promise<string | null> {
  const lastDot = signed.lastIndexOf(".")
  if (lastDot === -1) return null

  const value = signed.slice(0, lastDot)
  const sigHex = signed.slice(lastDot + 1)

  const sigBytes = Uint8Array.from(
    sigHex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []
  )

  const enc = new TextEncoder()
  const key = await getKey(SECRET)
  const valid = await crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(value))

  return valid ? value : null
}
