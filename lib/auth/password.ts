import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'

const ALGORITHM = 'pbkdf2_sha256'
const ITERATIONS = 310000
const KEY_LENGTH = 32
const DIGEST = 'sha256'

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString('hex')
  return `${ALGORITHM}$${ITERATIONS}$${salt}$${key}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, iterationsRaw, salt, key] = storedHash.split('$')
  if (algorithm !== ALGORITHM || !iterationsRaw || !salt || !key) return false

  const iterations = Number(iterationsRaw)
  if (!Number.isSafeInteger(iterations) || iterations < ITERATIONS) return false

  const candidate = pbkdf2Sync(password, salt, iterations, KEY_LENGTH, DIGEST)
  const expected = Buffer.from(key, 'hex')
  if (candidate.length !== expected.length) return false

  return timingSafeEqual(candidate, expected)
}
