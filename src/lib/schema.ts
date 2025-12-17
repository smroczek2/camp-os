import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
  decimal,
  jsonb,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Better Auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified"),
  image: text("image"),
  role: text("role").notNull().default("parent"), // parent, staff, admin, nurse, super_admin
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Multi-tenant tables

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    status: text("status").notNull().default("active"), // active, suspended, trial, inactive
    subscriptionTier: text("subscription_tier").notNull().default("free"), // free, pro, enterprise
    maxCampers: integer("max_campers").default(100),
    maxStaff: integer("max_staff").default(20),
    contactEmail: text("contact_email").notNull(),
    contactPhone: text("contact_phone"),
    timezone: text("timezone").default("America/New_York"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("organizations_slug_idx").on(table.slug),
    statusIdx: index("organizations_status_idx").on(table.status),
  })
);

export const organizationUsers = pgTable(
  "organization_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull().default("member"), // owner, admin, member
    invitedBy: text("invited_by").references(() => user.id),
    invitedAt: timestamp("invited_at"),
    joinedAt: timestamp("joined_at"),
    status: text("status").notNull().default("active"), // invited, active, suspended
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgUserIdx: index("organization_users_org_user_idx").on(
      table.organizationId,
      table.userId
    ),
    userIdx: index("organization_users_user_idx").on(table.userId),
  })
);

// Camp OS tables

export const children = pgTable(
  "children",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dateOfBirth: timestamp("date_of_birth").notNull(),
    allergies: jsonb("allergies").$type<string[]>(),
    medicalNotes: text("medical_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgUserIdx: index("children_org_user_idx").on(
      table.organizationId,
      table.userId
    ),
    userIdx: index("children_user_idx").on(table.userId),
    dobIdx: index("children_dob_idx").on(table.dateOfBirth),
  })
);

export const medications = pgTable(
  "medications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    childId: uuid("child_id")
      .references(() => children.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    dosage: text("dosage").notNull(),
    frequency: text("frequency").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    instructions: text("instructions"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("medications_org_idx").on(table.organizationId),
  })
);

export const camps = pgTable(
  "camps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    location: text("location"),
    capacity: integer("capacity").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("camps_org_idx").on(table.organizationId),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    campId: uuid("camp_id")
      .references(() => camps.id, { onDelete: "cascade" })
      .notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    capacity: integer("capacity").notNull(),
    status: text("status").notNull().default("draft"), // draft, open, closed, completed
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgCampIdx: index("sessions_org_camp_idx").on(
      table.organizationId,
      table.campId
    ),
  })
);

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    childId: uuid("child_id")
      .references(() => children.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    status: text("status").notNull().default("pending"), // pending, confirmed, canceled, refunded
    amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgSessionIdx: index("registrations_org_session_idx").on(
      table.organizationId,
      table.sessionId
    ),
    orgStatusIdx: index("registrations_org_status_idx").on(
      table.organizationId,
      table.status
    ),
    userSessionIdx: index("registrations_user_session_idx").on(
      table.userId,
      table.sessionId
    ),
    statusIdx: index("registrations_status_idx").on(table.status),
    childIdx: index("registrations_child_idx").on(table.childId),
    uniqueRegistration: uniqueIndex("registrations_child_session_unique").on(
      table.childId,
      table.sessionId
    ),
  })
);

export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    childId: uuid("child_id")
      .references(() => children.id, { onDelete: "cascade" })
      .notNull(),
    reporterId: text("reporter_id")
      .references(() => user.id)
      .notNull(),
    type: text("type").notNull(), // injury, illness, behavior, other
    severity: text("severity").notNull(), // low, medium, high
    description: text("description").notNull(),
    resolution: text("resolution"),
    occurredAt: timestamp("occurred_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("incidents_org_idx").on(table.organizationId),
    childIdx: index("incidents_child_idx").on(table.childId),
    typeIdx: index("incidents_type_idx").on(table.type),
    timestampIdx: index("incidents_timestamp_idx").on(table.occurredAt),
  })
);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    childId: uuid("child_id").references(() => children.id, {
      onDelete: "cascade",
    }),
    type: text("type").notNull(), // custody, medical, school, immunization
    title: text("title").notNull(),
    fileUrl: text("file_url").notNull(),
    mimeType: text("mime_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("documents_org_idx").on(table.organizationId),
  })
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
    streamId: text("stream_id").notNull(),
    eventType: text("event_type").notNull(),
    eventData: jsonb("event_data").notNull().$type<Record<string, unknown>>(),
    version: integer("version").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    userId: text("user_id").references(() => user.id),
  },
  (table) => ({
    orgIdx: index("events_org_idx").on(table.organizationId),
    streamIdx: index("events_stream_idx").on(table.streamId, table.version),
    typeIdx: index("events_type_idx").on(table.eventType),
    timestampIdx: index("events_timestamp_idx").on(table.timestamp),
  })
);

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(), // cabin, age_group, activity
    capacity: integer("capacity").notNull(),
    staffRequired: integer("staff_required").notNull().default(2),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("groups_org_idx").on(table.organizationId),
    sessionIdx: index("groups_session_idx").on(table.sessionId),
  })
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    staffId: text("staff_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(), // counselor, assistant, specialist
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("assignments_org_idx").on(table.organizationId),
    staffGroupIdx: index("assignments_staff_group_idx").on(
      table.staffId,
      table.groupId
    ),
    sessionIdx: index("assignments_session_idx").on(table.sessionId),
    uniqueAssignment: uniqueIndex("assignments_staff_group_unique").on(
      table.staffId,
      table.groupId
    ),
  })
);

export const groupMembers = pgTable(
  "group_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    childId: uuid("child_id")
      .references(() => children.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("group_members_org_idx").on(table.organizationId),
    groupChildIdx: index("group_members_group_child_idx").on(
      table.groupId,
      table.childId
    ),
    uniqueMember: uniqueIndex("group_members_unique").on(
      table.groupId,
      table.childId
    ),
  })
);

export const aiActions = pgTable(
  "ai_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    action: text("action").notNull(), // createSession, createDiscount, assignStaff
    params: jsonb("params").notNull().$type<Record<string, unknown>>(),
    preview: jsonb("preview").notNull().$type<Record<string, unknown>>(),
    status: text("status").notNull().default("pending"), // pending, approved, rejected, executed
    approvedBy: text("approved_by").references(() => user.id),
    approvedAt: timestamp("approved_at"),
    executedAt: timestamp("executed_at"),
    error: text("error"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("ai_actions_org_idx").on(table.organizationId),
    userIdx: index("ai_actions_user_idx").on(table.userId),
    statusIdx: index("ai_actions_status_idx").on(table.status),
  })
);

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    childId: uuid("child_id")
      .references(() => children.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id")
      .references(() => sessions.id, { onDelete: "cascade" })
      .notNull(),
    date: timestamp("date").notNull(),
    checkedInAt: timestamp("checked_in_at"),
    checkedInBy: text("checked_in_by").references(() => user.id),
    checkedOutAt: timestamp("checked_out_at"),
    checkedOutBy: text("checked_out_by").references(() => user.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgDateIdx: index("attendance_org_date_idx").on(
      table.organizationId,
      table.date
    ),
  })
);

export const medicationLogs = pgTable(
  "medication_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    childId: uuid("child_id")
      .references(() => children.id, { onDelete: "cascade" })
      .notNull(),
    medicationId: uuid("medication_id")
      .references(() => medications.id, { onDelete: "cascade" })
      .notNull(),
    administeredBy: text("administered_by")
      .references(() => user.id)
      .notNull(),
    administeredAt: timestamp("administered_at").notNull(),
    dosage: text("dosage").notNull(),
    photoVerificationUrl: text("photo_verification_url"),
    guardianNotified: boolean("guardian_notified").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("medication_logs_org_idx").on(table.organizationId),
  })
);

// Form Builder tables

export const formDefinitions = pgTable(
  "form_definitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    campId: uuid("camp_id")
      .references(() => camps.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "cascade",
    }),
    createdBy: text("created_by")
      .references(() => user.id, { onDelete: "set null" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    formType: text("form_type").notNull(), // registration, waiver, medical, custom
    status: text("status").notNull().default("draft"), // draft, active, archived
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at"),
    version: integer("version").notNull().default(1),
    aiActionId: uuid("ai_action_id").references(() => aiActions.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("form_definitions_org_idx").on(table.organizationId),
    campIdx: index("form_definitions_camp_idx").on(table.campId),
    sessionIdx: index("form_definitions_session_idx").on(table.sessionId),
    statusIdx: index("form_definitions_status_idx").on(table.status),
    campSessionStatusIdx: index("form_definitions_camp_session_status_idx").on(
      table.campId,
      table.sessionId,
      table.status
    ),
  })
);

export const formFields = pgTable(
  "form_fields",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    formDefinitionId: uuid("form_definition_id")
      .references(() => formDefinitions.id, { onDelete: "cascade" })
      .notNull(),
    fieldKey: text("field_key").notNull(), // snake_case unique identifier
    label: text("label").notNull(),
    description: text("description"),
    fieldType: text("field_type").notNull(), // text, email, select, radio, checkbox, etc.
    validationRules: jsonb("validation_rules").$type<{
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      pattern?: string;
    }>(),
    conditionalLogic: jsonb("conditional_logic").$type<{
      showIf?: Array<{
        fieldKey: string;
        operator: "equals" | "notEquals" | "contains" | "isEmpty" | "isNotEmpty";
        value: string | number | boolean | string[];
      }>;
    }>(),
    displayOrder: integer("display_order").notNull(),
    sectionName: text("section_name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("form_fields_org_idx").on(table.organizationId),
    formDefOrderIdx: index("form_fields_form_def_order_idx").on(
      table.formDefinitionId,
      table.displayOrder
    ),
    fieldKeyIdx: index("form_fields_field_key_idx").on(
      table.formDefinitionId,
      table.fieldKey
    ),
    uniqueFieldKey: uniqueIndex("form_fields_unique_key").on(
      table.formDefinitionId,
      table.fieldKey
    ),
  })
);

export const formOptions = pgTable(
  "form_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    formFieldId: uuid("form_field_id")
      .references(() => formFields.id, { onDelete: "cascade" })
      .notNull(),
    parentOptionId: uuid("parent_option_id"), // Self-reference for nesting (FK defined below)
    label: text("label").notNull(),
    value: text("value").notNull(),
    displayOrder: integer("display_order").notNull(),
    triggersFields: jsonb("triggers_fields").$type<{ fieldKeys?: string[] }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("form_options_org_idx").on(table.organizationId),
    fieldOrderIdx: index("form_options_field_order_idx").on(
      table.formFieldId,
      table.displayOrder
    ),
    parentIdx: index("form_options_parent_idx").on(table.parentOptionId),
    parentOptionFk: foreignKey({
      name: "form_options_parent_option_id_fk",
      columns: [table.parentOptionId],
      foreignColumns: [table.id],
    }).onDelete("cascade"),
  })
);

export const formSnapshots = pgTable(
  "form_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    formDefinitionId: uuid("form_definition_id")
      .references(() => formDefinitions.id, { onDelete: "cascade" })
      .notNull(),
    version: integer("version").notNull(),
    snapshot: jsonb("snapshot").notNull().$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("form_snapshots_org_idx").on(table.organizationId),
    formVersionIdx: index("form_snapshots_form_version_idx").on(
      table.formDefinitionId,
      table.version
    ),
    uniqueFormVersion: uniqueIndex("form_snapshots_unique_form_version").on(
      table.formDefinitionId,
      table.version
    ),
  })
);

export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    formDefinitionId: uuid("form_definition_id")
      .references(() => formDefinitions.id, { onDelete: "restrict" })
      .notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    childId: uuid("child_id").references(() => children.id, {
      onDelete: "set null",
    }),
    registrationId: uuid("registration_id").references(() => registrations.id, {
      onDelete: "set null",
    }),
    sessionId: uuid("session_id").references(() => sessions.id, {
      onDelete: "set null",
    }),
    formVersion: integer("form_version").notNull(),
    status: text("status").notNull().default("submitted"), // draft, submitted, reviewed, approved
    submissionData: jsonb("submission_data")
      .notNull()
      .$type<Record<string, unknown>>(),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index("form_submissions_org_idx").on(table.organizationId),
    formDefIdx: index("form_submissions_form_def_idx").on(
      table.formDefinitionId
    ),
    userIdx: index("form_submissions_user_idx").on(table.userId),
    childIdx: index("form_submissions_child_idx").on(table.childId),
    registrationIdx: index("form_submissions_registration_idx").on(
      table.registrationId
    ),
    sessionIdx: index("form_submissions_session_idx").on(table.sessionId),
    statusIdx: index("form_submissions_status_idx").on(table.status),
    userFormIdx: index("form_submissions_user_form_idx").on(
      table.userId,
      table.formDefinitionId,
      table.submittedAt
    ),
    formVersionIdx: index("form_submissions_form_version_idx").on(
      table.formDefinitionId,
      table.formVersion
    ),
  })
);

// Relations (for Drizzle ORM type-safe queries)

export const userRelations = relations(user, ({ many }) => ({
  children: many(children),
  registrations: many(registrations),
  documents: many(documents),
  reportedIncidents: many(incidents),
  assignments: many(assignments),
  aiActions: many(aiActions),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  user: one(user, {
    fields: [children.userId],
    references: [user.id],
  }),
  medications: many(medications),
  registrations: many(registrations),
  incidents: many(incidents),
  documents: many(documents),
  groupMembers: many(groupMembers),
  attendance: many(attendance),
  medicationLogs: many(medicationLogs),
}));

export const campsRelations = relations(camps, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  camp: one(camps, {
    fields: [sessions.campId],
    references: [camps.id],
  }),
  registrations: many(registrations),
  groups: many(groups),
  assignments: many(assignments),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  user: one(user, {
    fields: [registrations.userId],
    references: [user.id],
  }),
  child: one(children, {
    fields: [registrations.childId],
    references: [children.id],
  }),
  session: one(sessions, {
    fields: [registrations.sessionId],
    references: [sessions.id],
  }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  session: one(sessions, {
    fields: [groups.sessionId],
    references: [sessions.id],
  }),
  assignments: many(assignments),
  members: many(groupMembers),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  staff: one(user, {
    fields: [assignments.staffId],
    references: [user.id],
  }),
  group: one(groups, {
    fields: [assignments.groupId],
    references: [groups.id],
  }),
  session: one(sessions, {
    fields: [assignments.sessionId],
    references: [sessions.id],
  }),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  child: one(children, {
    fields: [groupMembers.childId],
    references: [children.id],
  }),
}));

export const aiActionsRelations = relations(aiActions, ({ one }) => ({
  user: one(user, {
    fields: [aiActions.userId],
    references: [user.id],
  }),
  approver: one(user, {
    fields: [aiActions.approvedBy],
    references: [user.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  child: one(children, {
    fields: [incidents.childId],
    references: [children.id],
  }),
  reporter: one(user, {
    fields: [incidents.reporterId],
    references: [user.id],
  }),
}));

export const medicationsRelations = relations(medications, ({ one, many }) => ({
  child: one(children, {
    fields: [medications.childId],
    references: [children.id],
  }),
  logs: many(medicationLogs),
}));

export const medicationLogsRelations = relations(medicationLogs, ({ one }) => ({
  child: one(children, {
    fields: [medicationLogs.childId],
    references: [children.id],
  }),
  medication: one(medications, {
    fields: [medicationLogs.medicationId],
    references: [medications.id],
  }),
  administrator: one(user, {
    fields: [medicationLogs.administeredBy],
    references: [user.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(user, {
    fields: [documents.userId],
    references: [user.id],
  }),
  child: one(children, {
    fields: [documents.childId],
    references: [children.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  child: one(children, {
    fields: [attendance.childId],
    references: [children.id],
  }),
  session: one(sessions, {
    fields: [attendance.sessionId],
    references: [sessions.id],
  }),
  checkedInByUser: one(user, {
    fields: [attendance.checkedInBy],
    references: [user.id],
  }),
  checkedOutByUser: one(user, {
    fields: [attendance.checkedOutBy],
    references: [user.id],
  }),
}));

// Form Builder Relations

export const formDefinitionsRelations = relations(
  formDefinitions,
  ({ one, many }) => ({
    camp: one(camps, {
      fields: [formDefinitions.campId],
      references: [camps.id],
    }),
    session: one(sessions, {
      fields: [formDefinitions.sessionId],
      references: [sessions.id],
    }),
    creator: one(user, {
      fields: [formDefinitions.createdBy],
      references: [user.id],
    }),
    aiAction: one(aiActions, {
      fields: [formDefinitions.aiActionId],
      references: [aiActions.id],
    }),
    fields: many(formFields),
    submissions: many(formSubmissions),
    snapshots: many(formSnapshots),
  })
);

export const formSnapshotsRelations = relations(formSnapshots, ({ one }) => ({
  formDefinition: one(formDefinitions, {
    fields: [formSnapshots.formDefinitionId],
    references: [formDefinitions.id],
  }),
}));

export const formFieldsRelations = relations(formFields, ({ one, many }) => ({
  formDefinition: one(formDefinitions, {
    fields: [formFields.formDefinitionId],
    references: [formDefinitions.id],
  }),
  options: many(formOptions),
}));

export const formOptionsRelations = relations(formOptions, ({ one, many }) => ({
  formField: one(formFields, {
    fields: [formOptions.formFieldId],
    references: [formFields.id],
  }),
  parentOption: one(formOptions, {
    fields: [formOptions.parentOptionId],
    references: [formOptions.id],
    relationName: "childOptions",
  }),
  childOptions: many(formOptions, {
    relationName: "childOptions",
  }),
}));

export const formSubmissionsRelations = relations(
  formSubmissions,
  ({ one }) => ({
    formDefinition: one(formDefinitions, {
      fields: [formSubmissions.formDefinitionId],
      references: [formDefinitions.id],
    }),
    user: one(user, {
      fields: [formSubmissions.userId],
      references: [user.id],
    }),
    child: one(children, {
      fields: [formSubmissions.childId],
      references: [children.id],
    }),
    registration: one(registrations, {
      fields: [formSubmissions.registrationId],
      references: [registrations.id],
    }),
    session: one(sessions, {
      fields: [formSubmissions.sessionId],
      references: [sessions.id],
    }),
  })
);

// Multi-tenant Relations

export const organizationsRelations = relations(
  organizations,
  ({ many }) => ({
    organizationUsers: many(organizationUsers),
    children: many(children),
    camps: many(camps),
    sessions: many(sessions),
    registrations: many(registrations),
    incidents: many(incidents),
    documents: many(documents),
    events: many(events),
    groups: many(groups),
    assignments: many(assignments),
    groupMembers: many(groupMembers),
    attendance: many(attendance),
    medicationLogs: many(medicationLogs),
    aiActions: many(aiActions),
    formDefinitions: many(formDefinitions),
    formFields: many(formFields),
    formOptions: many(formOptions),
    formSnapshots: many(formSnapshots),
    formSubmissions: many(formSubmissions),
    medications: many(medications),
  })
);

export const organizationUsersRelations = relations(
  organizationUsers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationUsers.organizationId],
      references: [organizations.id],
    }),
    user: one(user, {
      fields: [organizationUsers.userId],
      references: [user.id],
    }),
    inviter: one(user, {
      fields: [organizationUsers.invitedBy],
      references: [user.id],
    }),
  })
);
