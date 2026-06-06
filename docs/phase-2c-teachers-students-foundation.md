# Phase 2C Teachers And Students Foundation

Phase 2C adds the academic people foundation for teachers and students. It keeps the approved UI and does not implement RFID scanning, attendance, movement tracking, devices, reports, notifications, or AI.

## Teacher Architecture

`Teacher` is school-owned through `school_id`.

Core fields:

- `employee_number`
- `full_name_ar`
- `full_name_en`
- `national_id`
- `email`
- `phone`
- `gender`
- `status`
- `hire_date`
- `profile_photo_url`
- `card_code`

Rules:

- `employee_number` is unique per school.
- `card_code` is globally unique.
- Teacher status is `ACTIVE` or `INACTIVE`.

## Student Architecture

`Student` is school-owned through `school_id` and assigned to a classroom through `classroom_id`.

Core fields:

- `student_number`
- `full_name_ar`
- `full_name_en`
- `national_id`
- `gender`
- `birth_date`
- `guardian_name`
- `guardian_phone`
- `guardian_email`
- `profile_photo_url`
- `card_code`
- `status`

Rules:

- `student_number` is unique per school.
- `card_code` is globally unique.
- Student status is `ACTIVE`, `INACTIVE`, `GRADUATED`, or `TRANSFERRED`.
- Classroom foreign keys prepare the system for future transfer workflows without building those workflows in this phase.

## Card Identity Foundation

Teachers and students both receive permanent card identity codes.

Formats:

- Teacher: `TCH-########`
- Student: `STD-########`

These identifiers are reserved for future RFID cards, NFC cards, QR cards, and mobile identity cards. Future scanning and provisioning modules should resolve cards by `card_code` and then use `school_id`, teacher ID, or student ID internally.

## APIs

Teacher routes:

- `GET /api/teachers`
- `POST /api/teachers`
- `GET /api/teachers/[teacherId]`
- `PATCH /api/teachers/[teacherId]`

Student routes:

- `GET /api/students`
- `POST /api/students`
- `GET /api/students/[studentId]`
- `PATCH /api/students/[studentId]`

List routes support pagination, filtering, and search. SchoolAdmin requests are automatically scoped to their own school. SuperAdmin requests can include `schoolId`.

## Tenant Isolation

All teacher and student records include `school_id`.

SchoolAdmin:

- can list only their own teachers and students
- can create only inside their own school
- can update only records belonging to their own school
- cannot move students into classrooms owned by another school

SuperAdmin:

- can list across schools
- can scope list/create requests with `schoolId`

## Dashboard Integration

The approved Teachers and Students pages now load their people records from the database APIs.

Current dashboard metrics on those pages remain projected placeholders because attendance, movement, and teaching assignment engines are later phases.

## Seed Data

Each seeded school receives:

- 20 teachers
- students distributed across all seeded classrooms

Seeded student counts are generated from the classroom list, so classroom membership is now represented by real student rows instead of a separate people mock layer.
