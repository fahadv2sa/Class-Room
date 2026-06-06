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

const teacherNames = [
  ['خالد الحربي', 'Khalid Alharbi'],
  ['سارة العتيبي', 'Sarah Alotaibi'],
  ['فهد القحطاني', 'Fahad Alqahtani'],
  ['نورة الزهراني', 'Norah Alzahrani'],
  ['عبدالله الدوسري', 'Abdullah Aldossari'],
  ['ريم الشمري', 'Reem Alshammari'],
  ['ماجد المالكي', 'Majed Almaliki'],
  ['هند الغامدي', 'Hind Alghamdi'],
  ['تركي العنزي', 'Turki Alanazi'],
  ['لولوة السبيعي', 'Lulwa Alsobaie'],
  ['ناصر الرشيدي', 'Nasser Alrashidi'],
  ['أمل الجهني', 'Amal Aljuhani'],
  ['عمر المطيري', 'Omar Almutairi'],
  ['الجوهرة الشهري', 'Aljawhara Alshahri'],
  ['يوسف البلوي', 'Yousef Albalawi'],
  ['منيرة الحربي', 'Munirah Alharbi'],
  ['فيصل القحطاني', 'Faisal Alqahtani'],
  ['بدور العتيبي', 'Budoor Alotaibi'],
  ['سلطان الدوسري', 'Sultan Aldossari'],
  ['شهد الزهراني', 'Shahad Alzahrani'],
]

const maleStudentNames = [
  ['محمد الحربي', 'Mohammed Alharbi'],
  ['عبدالعزيز القحطاني', 'Abdulaziz Alqahtani'],
  ['سلطان الدوسري', 'Sultan Aldossari'],
  ['فيصل العتيبي', 'Faisal Alotaibi'],
  ['يوسف الشمري', 'Yousef Alshammari'],
  ['عمر الزهراني', 'Omar Alzahrani'],
  ['ريان المالكي', 'Rayan Almaliki'],
  ['تركي الغامدي', 'Turki Alghamdi'],
  ['بدر العنزي', 'Bader Alanazi'],
  ['نواف السبيعي', 'Nawaf Alsobaie'],
  ['ماجد الرشيدي', 'Majed Alrashidi'],
  ['سعود الجهني', 'Saud Aljuhani'],
]

const femaleStudentNames = [
  ['ريم الحربي', 'Reem Alharbi'],
  ['نورة القحطاني', 'Norah Alqahtani'],
  ['سارة الدوسري', 'Sarah Aldossari'],
  ['هند العتيبي', 'Hind Alotaibi'],
  ['لينا الشمري', 'Lina Alshammari'],
  ['شهد الزهراني', 'Shahad Alzahrani'],
  ['جود المالكي', 'Joud Almaliki'],
  ['أمل الغامدي', 'Amal Alghamdi'],
  ['دانة العنزي', 'Dana Alanazi'],
  ['غادة السبيعي', 'Ghada Alsobaie'],
  ['بدور الرشيدي', 'Budoor Alrashidi'],
  ['منيرة الجهني', 'Munirah Aljuhani'],
]

function classroomLevelType(code) {
  if (code.startsWith('P')) return 'PRIMARY'
  if (code.startsWith('M')) return 'MIDDLE'
  return 'HIGH'
}

function deterministicId(...parts) {
  return createHash('sha256').update(parts.join(':')).digest('hex').slice(0, 24)
}

function padded(value, length = 8) {
  return String(value).padStart(length, '0')
}

function teacherGender(index) {
  return index % 4 === 1 || index % 4 === 3 ? 'FEMALE' : 'MALE'
}

function studentCountForClassroom(code) {
  const grade = Number(code.slice(1, -1))
  const sectionOffset = code.endsWith('A') ? 0 : 2
  return 24 + ((grade + sectionOffset) % 5)
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

  let globalTeacherCardSeq = 10000001
  let globalStudentCardSeq = 10000001
  let globalDeviceSeq = 10000001

  for (const [schoolIndex, data] of schools.entries()) {
    const school = await prisma.school.upsert({
      where: {
        id: deterministicId(data.adminEmail),
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
        id: deterministicId(data.adminEmail),
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

    const subscriptionId = deterministicId(school.id, 'subscription')

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

    await prisma.schoolSettings.upsert({
      where: { schoolId: school.id },
      update: {
        language: 'AR',
        noiseThresholdDb: 70,
        studentExitLimitMinutes: 10,
        noiseAlertsEnabled: true,
        movementAlertsEnabled: true,
        attendanceAlertsEnabled: true,
        deviceAlertsEnabled: true,
        dailyReportEnabled: false,
        schoolNameOverride: null,
        contactPhone: '0112345678',
      },
      create: {
        schoolId: school.id,
        language: 'AR',
        noiseThresholdDb: 70,
        studentExitLimitMinutes: 10,
        noiseAlertsEnabled: true,
        movementAlertsEnabled: true,
        attendanceAlertsEnabled: true,
        deviceAlertsEnabled: true,
        dailyReportEnabled: false,
        schoolNameOverride: null,
        contactPhone: '0112345678',
      },
    })

    const academicYearId = deterministicId(school.id, '2026-2027')

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
      const levelId = deterministicId(school.id, academicYear.id, level.levelType)

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

    const seededClassrooms = []

    for (const code of classroomCodes) {
      const level = levelByType.get(classroomLevelType(code))
      const classroomId = deterministicId(school.id, academicYear.id, code)

      const classroom = await prisma.classroom.upsert({
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

      seededClassrooms.push(classroom)
    }

    for (const classroom of seededClassrooms) {
      const classroomNumber = classroomCodes.indexOf(classroom.classroomCode) + 1
      const deviceId = deterministicId(school.id, classroom.id, 'class-room-device')
      const deviceCode = `CRD-${padded(globalDeviceSeq++)}`
      const serialNumber = `${data.schoolCode}-CRD-${padded(classroomNumber, 4)}`
      const connectionStatus = classroomNumber % 11 === 0 ? 'OFFLINE' : classroomNumber % 17 === 0 ? 'UNKNOWN' : 'ONLINE'
      const status = classroomNumber % 19 === 0 ? 'MAINTENANCE' : 'ACTIVE'
      const installedAt = new Date('2026-08-10T08:00:00.000Z')
      const lastSeenAt = connectionStatus === 'ONLINE' ? new Date('2026-09-01T09:30:00.000Z') : null

      await prisma.classroomDevice.upsert({
        where: { id: deviceId },
        update: {
          classroomId: classroom.id,
          serialNumber,
          firmwareVersion: classroomNumber % 7 === 0 ? '2.0.4' : '2.1.0',
          hardwareVersion: 'CRD-HW-1.0',
          status,
          connectionStatus,
          capabilities: ['RFID', 'NOISE_MONITORING', 'LED_INDICATORS', 'FIRMWARE_UPDATES'],
          installedAt,
          registeredAt: installedAt,
          lastSeenAt,
          retiredAt: null,
          notes: null,
          provisionedAt: installedAt,
          provisionedBy: 'seed',
          pairingTokenHash: null,
          pairingTokenExpiresAt: null,
        },
        create: {
          id: deviceId,
          schoolId: school.id,
          classroomId: classroom.id,
          deviceCode,
          serialNumber,
          firmwareVersion: classroomNumber % 7 === 0 ? '2.0.4' : '2.1.0',
          hardwareVersion: 'CRD-HW-1.0',
          status,
          connectionStatus,
          capabilities: ['RFID', 'NOISE_MONITORING', 'LED_INDICATORS', 'FIRMWARE_UPDATES'],
          installedAt,
          registeredAt: installedAt,
          lastSeenAt,
          retiredAt: null,
          notes: null,
          provisionedAt: installedAt,
          provisionedBy: 'seed',
          pairingTokenHash: null,
          pairingTokenExpiresAt: null,
        },
      })
    }

    for (let i = 0; i < 20; i++) {
      const [fullNameAr, fullNameEn] = teacherNames[i]
      const teacherId = deterministicId(school.id, 'teacher', i + 1)
      const employeeNumber = `${data.schoolCode}-T-${padded(i + 1, 4)}`
      const gender = teacherGender(i)
      const teacherCardCode = `TCH-${padded(globalTeacherCardSeq++)}`

      await prisma.teacher.upsert({
        where: { id: teacherId },
        update: {
          employeeNumber,
          fullNameAr,
          fullNameEn,
          nationalId: `${10 + schoolIndex}${padded(i + 1, 8)}`,
          email: `teacher${padded(i + 1, 2)}@${data.schoolCode.toLowerCase()}.classpulse.test`,
          phone: `05${schoolIndex + 1}${padded(5000000 + i, 7)}`,
          gender,
          status: 'ACTIVE',
          hireDate: new Date(`202${i % 5}-08-15T00:00:00.000Z`),
          profilePhotoUrl: null,
          cardCode: teacherCardCode,
        },
        create: {
          id: teacherId,
          schoolId: school.id,
          employeeNumber,
          fullNameAr,
          fullNameEn,
          nationalId: `${10 + schoolIndex}${padded(i + 1, 8)}`,
          email: `teacher${padded(i + 1, 2)}@${data.schoolCode.toLowerCase()}.classpulse.test`,
          phone: `05${schoolIndex + 1}${padded(5000000 + i, 7)}`,
          gender,
          status: 'ACTIVE',
          hireDate: new Date(`202${i % 5}-08-15T00:00:00.000Z`),
          profilePhotoUrl: null,
          cardCode: teacherCardCode,
        },
      })

      await prisma.cardCredential.upsert({
        where: { cardCode: teacherCardCode },
        update: {
          schoolId: school.id,
          holderType: 'TEACHER',
          studentId: null,
          teacherId,
          status: 'ACTIVE',
          issuedAt: new Date('2026-08-01T08:00:00.000Z'),
          deactivatedAt: null,
          notes: null,
        },
        create: {
          id: deterministicId(school.id, teacherId, 'card-credential'),
          schoolId: school.id,
          cardCode: teacherCardCode,
          holderType: 'TEACHER',
          teacherId,
          status: 'ACTIVE',
          issuedAt: new Date('2026-08-01T08:00:00.000Z'),
          deactivatedAt: null,
          notes: null,
        },
      })
    }

    for (const classroom of seededClassrooms) {
      const count = studentCountForClassroom(classroom.classroomCode)
      for (let i = 0; i < count; i++) {
        const gender = i % 2 === 0 ? 'MALE' : 'FEMALE'
        const namePool = gender === 'MALE' ? maleStudentNames : femaleStudentNames
        const [baseNameAr, baseNameEn] = namePool[i % namePool.length]
        const classroomNumber = classroomCodes.indexOf(classroom.classroomCode) + 1
        const studentNumber = `${data.schoolCode}-S-${padded(classroomNumber, 2)}-${padded(i + 1, 3)}`
        const studentId = deterministicId(school.id, classroom.id, 'student', i + 1)
        const fullNameAr = `${baseNameAr} ${classroom.classroomCode}`
        const fullNameEn = `${baseNameEn} ${classroom.classroomCode}`
        const studentCardCode = `STD-${padded(globalStudentCardSeq++)}`

        await prisma.student.upsert({
          where: { id: studentId },
          update: {
            classroomId: classroom.id,
            studentNumber,
            fullNameAr,
            fullNameEn,
            nationalId: `${20 + schoolIndex}${padded(classroomNumber, 2)}${padded(i + 1, 6)}`,
            gender,
            birthDate: new Date(`20${12 + (classroomNumber % 7)}-0${(i % 9) + 1}-15T00:00:00.000Z`),
            guardianName: gender === 'MALE' ? 'ولي الأمر عبدالله' : 'ولية الأمر نورة',
            guardianPhone: `05${schoolIndex + 5}${padded(6000000 + classroomNumber * 100 + i, 7)}`,
            guardianEmail: `guardian-${data.schoolCode.toLowerCase()}-${classroom.classroomCode.toLowerCase()}-${padded(i + 1, 2)}@example.test`,
            profilePhotoUrl: null,
            cardCode: studentCardCode,
            status: 'ACTIVE',
          },
          create: {
            id: studentId,
            schoolId: school.id,
            classroomId: classroom.id,
            studentNumber,
            fullNameAr,
            fullNameEn,
            nationalId: `${20 + schoolIndex}${padded(classroomNumber, 2)}${padded(i + 1, 6)}`,
            gender,
            birthDate: new Date(`20${12 + (classroomNumber % 7)}-0${(i % 9) + 1}-15T00:00:00.000Z`),
            guardianName: gender === 'MALE' ? 'ولي الأمر عبدالله' : 'ولية الأمر نورة',
            guardianPhone: `05${schoolIndex + 5}${padded(6000000 + classroomNumber * 100 + i, 7)}`,
            guardianEmail: `guardian-${data.schoolCode.toLowerCase()}-${classroom.classroomCode.toLowerCase()}-${padded(i + 1, 2)}@example.test`,
            profilePhotoUrl: null,
            cardCode: studentCardCode,
            status: 'ACTIVE',
          },
        })

        await prisma.cardCredential.upsert({
          where: { cardCode: studentCardCode },
          update: {
            schoolId: school.id,
            holderType: 'STUDENT',
            studentId,
            teacherId: null,
            status: 'ACTIVE',
            issuedAt: new Date('2026-08-01T08:00:00.000Z'),
            deactivatedAt: null,
            notes: null,
          },
          create: {
            id: deterministicId(school.id, studentId, 'card-credential'),
            schoolId: school.id,
            cardCode: studentCardCode,
            holderType: 'STUDENT',
            studentId,
            status: 'ACTIVE',
            issuedAt: new Date('2026-08-01T08:00:00.000Z'),
            deactivatedAt: null,
            notes: null,
          },
        })
      }

      const sessionId = deterministicId(school.id, classroom.id, 'attendance-session', '2026-09-01')
      const classroomDeviceId = deterministicId(school.id, classroom.id, 'class-room-device')
      const classroomNumber = classroomCodes.indexOf(classroom.classroomCode) + 1

      await prisma.classroomAttendanceSession.upsert({
        where: { id: sessionId },
        update: {
          academicYearId: academicYear.id,
          classroomDeviceId,
          teacherId: null,
          sessionDate: new Date('2026-09-01T00:00:00.000Z'),
          status: 'OPEN',
          openedAt: new Date('2026-09-01T07:15:00.000Z'),
          closedAt: null,
        },
        create: {
          id: sessionId,
          schoolId: school.id,
          academicYearId: academicYear.id,
          classroomId: classroom.id,
          classroomDeviceId,
          teacherId: null,
          sessionDate: new Date('2026-09-01T00:00:00.000Z'),
          status: 'OPEN',
          openedAt: new Date('2026-09-01T07:15:00.000Z'),
          closedAt: null,
        },
      })

      const classroomStudents = await prisma.student.findMany({
        where: { schoolId: school.id, classroomId: classroom.id, status: 'ACTIVE' },
        orderBy: { studentNumber: 'asc' },
        select: { id: true },
      })

      await prisma.studentAttendanceRecord.createMany({
        data: classroomStudents.map((student, index) => {
          const absent = index % 13 === 0
          const late = !absent && index % 11 === 0
          const present = !absent
          return {
            id: deterministicId(school.id, sessionId, student.id, 'attendance-record'),
            schoolId: school.id,
            attendanceSessionId: sessionId,
            classroomId: classroom.id,
            studentId: student.id,
            status: absent ? 'ABSENT' : late ? 'LATE' : 'PRESENT',
            firstEntryAt: present
              ? new Date(`2026-09-01T07:${String(18 + ((index + classroomNumber) % 25)).padStart(2, '0')}:00.000Z`)
              : null,
            lastExitAt: null,
            scanCount: present ? 1 : 0,
          }
        }),
        skipDuplicates: true,
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
