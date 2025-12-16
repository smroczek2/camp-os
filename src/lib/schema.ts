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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Better Auth tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified"),
  image: text("image"),
  role: text("role").notNull().default("parent"), // parent, staff, admin, nurse
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

// Camp OS tables

export const children = pgTable(
  "children",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
    userIdx: index("children_user_idx").on(table.userId),
    dobIdx: index("children_dob_idx").on(table.dateOfBirth),
  })
);

export const medications = pgTable("medications", {
  id: uuid("id").defaultRandom().primaryKey(),
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
});

export const camps = pgTable("camps", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),
  capacity: integer("capacity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  campId: uuid("camp_id")
    .references(() => camps.id, { onDelete: "cascade" })
    .notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  capacity: integer("capacity").notNull(),
  status: text("status").notNull().default("draft"), // draft, open, closed, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const registrations = pgTable(
  "registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
    childIdx: index("incidents_child_idx").on(table.childId),
    typeIdx: index("incidents_type_idx").on(table.type),
    timestampIdx: index("incidents_timestamp_idx").on(table.occurredAt),
  })
);

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
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
});

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    streamId: text("stream_id").notNull(),
    eventType: text("event_type").notNull(),
    eventData: jsonb("event_data").notNull().$type<Record<string, unknown>>(),
    version: integer("version").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    userId: text("user_id").references(() => user.id),
  },
  (table) => ({
    streamIdx: index("events_stream_idx").on(table.streamId, table.version),
    typeIdx: index("events_type_idx").on(table.eventType),
    timestampIdx: index("events_timestamp_idx").on(table.timestamp),
  })
);

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
    sessionIdx: index("groups_session_idx").on(table.sessionId),
  })
);

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
    groupId: uuid("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    childId: uuid("child_id")
      .references(() => children.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
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
    userIdx: index("ai_actions_user_idx").on(table.userId),
    statusIdx: index("ai_actions_status_idx").on(table.status),
  })
);

export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
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
});

export const medicationLogs = pgTable("medication_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
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
});

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
