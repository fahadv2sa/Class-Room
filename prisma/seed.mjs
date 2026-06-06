import { PrismaClient } from '@prisma/client'
import { createHash, pbkdf2Sync, randomBytes } from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex')
  return `pbkdf2_sha256$310000$${salt}$${key}`
}

const levelData = [
  { levelType: 'PRIMARY', displayName: 'Primary School' },
  { levelType: 'MIDDLE', displayName: 'Middle School' },
  { levelType: 'HIGH', displayName: 'High School' },
]

const classroomCodes = [
  'P1A',
  'P1B',
  'P2A',
  'P2B',
  'P3A',
  'P3B',
  'P4A',
  'P4B',
  'P5A',
  'P5B',
  'P6A',
  'P6B',
  'M1A',
  'M1B',
  'M2A',
  'M2B',
  'M3A',
  'M3B',
  'H1A',
  'H1B',
  'H2A',
  'H2B',
  'H3A',
  'H3B',
]

function classroomLevelType(code) {
  if (code.startsWith('P')) return 'PRIMARY'
  if (code.startsWith('M')) return 'MIDDLE'
  return 'HIGH'
}

async function main() {
  const passwordHash = hashPassword('Password123!')

  await prisma.superAdmin.upsert({
    where: { email: 'super@classpulse.ai' },
    update: {},
    create: {
      email: 'super@classpulse.ai',
      passwordHash,
      fullName: 'ClassPulse Platform Owner',
      isActive: true,
    },
  })

  const schools = [
    {
      schoolCode: 'JUB001',
      name: 'Jubail International School',
      logoUrl: null,
      city: 'Jubail',
      country: 'Saudi Arabia',
      subscriptionPlan: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      status: 'ACTIVE',
      adminEmail: 'admin@jubail-school.edu.sa',
      adminName: 'Khalid Alharbi',
    },
    {
      schoolCode: 'RYD001',
      name: 'Riyadh Future Academy',
      logoUrl: null,
      city: 'Riyadh',
      country: 'Saudi Arabia',
      subscriptionPlan: 'STARTER',
      subscriptionStatus: 'TRIALING',
      status: 'ACTIVE',
      adminEmail: 'admin@riyadh-future.edu.sa',
      adminName: 'Sarah Alotaibi',
    },
    {
      schoolCode: 'DMM001',
      name: 'Dammam Knowledge School',
      logoUrl: null,
      city: 'Dammam',
      country: 'Saudi Arabia',
      subscriptionPlan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      status: 'ACTIVE',
      adminEmail: 'admin@dammam-knowledge.edu.sa',
      adminName: 'Fahad Alqahtani',
    },
  ]

  for (const data of schools) {
    const school = await prisma.school.upsert({
      where: {
        id: createHash('sha256').update(data.adminEmail).digest('hex').slice(0, 24),
      },
      update: {
        name: data.name,
        logoUrl: data.logoUrl,
        city: data.city,
        country: data.country,
        subscriptionPlan: data.subscriptionPlan,
        subscriptionStatus: data.subscriptionStatus,
        status: data.status,
      },
      create: {
        id: createHash('sha256').update(data.adminEmail).digest('hex').slice(0, 24),
        schoolCode: data.schoolCode,
        name: data.name,
        logoUrl: data.logoUrl,
        city: data.city,
        country: data.country,
        subscriptionPlan: data.subscriptionPlan,
        subscriptionStatus: data.subscriptionStatus,
        status: data.status,
      },
    })

    await prisma.schoolAdmin.upsert({
      where: { email: data.adminEmail },
      update: {
        schoolId: school.id,
        fullName: data.adminName,
        isActive: true,
      },
      create: {
        schoolId: school.id,
        email: data.adminEmail,
        passwordHash,
        fullName: data.adminName,
        isActive: true,
      },
    })

    const subscriptionId = createHash('sha256').update(`${school.id}:subscription`).digest('hex').slice(0, 24)

    await prisma.subscription.upsert({
      where: { id: subscriptionId },
      update: {
        plan: data.subscriptionPlan,
        status: data.subscriptionStatus,
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
        expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      },
      create: {
        id: subscriptionId,
        schoolId: school.id,
        plan: data.subscriptionPlan,
        status: data.subscriptionStatus,
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
        expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      },
    })

    const academicYearId = createHash('sha256').update(`${school.id}:2026-2027`).digest('hex').slice(0, 24)

    const academicYear = await prisma.academicYear.upsert({
      where: {
        id: academicYearId,
      },
      update: {
        name: '2026-2027',
        startDate: new Date('2026-08-23T00:00:00.000Z'),
        endDate: new Date('2027-06-30T23:59:59.000Z'),
        isActive: true,
      },
      create: {
        id: academicYearId,
        schoolId: school.id,
        name: '2026-2027',
        startDate: new Date('2026-08-23T00:00:00.000Z'),
        endDate: new Date('2027-06-30T23:59:59.000Z'),
        isActive: true,
      },
    })

    const levelByType = new Map()

    for (const level of levelData) {
      const levelId = createHash('sha256')
        .update(`${school.id}:${academicYear.id}:${level.levelType}`)
        .digest('hex')
        .slice(0, 24)

      const createdLevel = await prisma.schoolLevel.upsert({
        where: {
          id: levelId,
        },
        update: {
          displayName: level.displayName,
          isActive: true,
        },
        create: {
          id: levelId,
          schoolId: school.id,
          academicYearId: academicYear.id,
          levelType: level.levelType,
          displayName: level.displayName,
          isActive: true,
        },
      })

      levelByType.set(level.levelType, createdLevel)
    }

    for (const code of classroomCodes) {
      const level = levelByType.get(classroomLevelType(code))
      const classroomId = createHash('sha256')
        .update(`${school.id}:${academicYear.id}:${code}`)
        .digest('hex')
        .slice(0, 24)

      await prisma.classroom.upsert({
        where: {
          id: classroomId,
        },
        update: {
          levelId: level.id,
          classroomName: code,
          isActive: true,
        },
        create: {
          id: classroomId,
          schoolId: school.id,
          academicYearId: academicYear.id,
          levelId: level.id,
          classroomCode: code,
          classroomName: code,
          isActive: true,
        },
      })
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
