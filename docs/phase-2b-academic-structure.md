# Phase 2B Academic Structure Foundation

Phase 2B adds the academic hierarchy used by future students, teachers, devices, RFID events, attendance, classroom monitoring, reports, and analytics. It does not implement those later systems.

## Academic Year Architecture

`AcademicYear` belongs to one school and defines the time boundary for operational school data.

Fields:

- `school_id`
- `name`, such as `2026-2027`
- `start_date`
- `end_date`
- `is_active`
- timestamps

Each school can have multiple academic years. A partial unique database index enforces only one active academic year per school.

Future classroom, teacher, student, attendance, and report data should reference `academic_year_id` in addition to `school_id`.

## School Level Architecture

`SchoolLevel` belongs to one school and one academic year.

Supported values:

- `PRIMARY`
- `MIDDLE`
- `HIGH`

Each level has a display name such as `Primary School`, `Middle School`, or `High School`. The enum covers the current school structure, while display names allow future labeling flexibility without changing internal level identifiers.

## Classroom Architecture

`Classroom` belongs to:

- one school
- one academic year
- one school level

Classrooms use short platform-standard codes:

- `P` for Primary
- `M` for Middle
- `H` for High

Examples: `P1A`, `P2B`, `M3A`, `H1B`.

`classroom_code` is unique per `school_id` and `academic_year_id`. It is the operational classroom identifier future devices, students, attendance events, RFID activity, reports, and analytics should reference.

## Relationships

```text
School
  -> AcademicYear
    -> SchoolLevel
      -> Classroom
```

Every academic entity includes `school_id` for tenant isolation.

## Tenant Isolation Rules

SchoolAdmin:

- can list and manage only their own school academic years
- can list and manage only their own school levels
- can list and manage only their own school classrooms
- cannot provide another `school_id` to escape tenant scope

SuperAdmin:

- can list all academic structures
- must provide `schoolId` when creating school-scoped records
- can filter list endpoints by `schoolId`

## APIs

Academic years:

- `GET /api/academic-years`
- `POST /api/academic-years`
- `GET /api/academic-years/[academicYearId]`
- `PATCH /api/academic-years/[academicYearId]`

School levels:

- `GET /api/levels`
- `POST /api/levels`
- `GET /api/levels/[levelId]`
- `PATCH /api/levels/[levelId]`

Classrooms:

- `GET /api/classrooms`
- `POST /api/classrooms`
- `GET /api/classrooms/[classroomId]`
- `PATCH /api/classrooms/[classroomId]`

## Future Integration Points

Later phases should attach new records to this structure:

- Teachers: `school_id`, `academic_year_id`, optional `level_id` and classroom assignments.
- Students: `school_id`, `academic_year_id`, `classroom_id`.
- Devices: `school_id`, `classroom_id`, device provisioning via `school_code`.
- RFID events: `school_id`, `academic_year_id`, `classroom_id`, student/device references.
- Attendance: `school_id`, `academic_year_id`, `classroom_id`.
- Reports and analytics: scoped by school, year, level, and classroom.

No teachers, students, devices, RFID, attendance, noise monitoring, reports engine, AI, or language system features are implemented in this phase.
