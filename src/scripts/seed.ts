import "dotenv/config";
import { db } from "../lib/db";
import {
  user,
  account,
  children,
  sessions,
  registrations,
  groups,
  assignments,
  groupMembers,
} from "../lib/schema";
import { scryptSync, randomBytes } from "crypto";

// Hash password using scrypt (same algorithm Better Auth uses)
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function seed() {
  console.log("Starting single-tenant database seed...");

  const defaultPassword = hashPassword("password123");

  // =============================================
  // STEP 1: Create Users
  // =============================================
  console.log("\n1. Creating users...");

  // Admin User
  await db
    .insert(user)
    .values({
      id: "admin-1",
      name: "Sarah Williams",
      email: "sarah@camp.example",
      role: "admin",
      emailVerified: true,
    });

  // Create account with password for admin
  await db.insert(account).values({
    id: "account-admin-1",
    accountId: "admin-1",
    providerId: "credential",
    userId: "admin-1",
    password: defaultPassword,
  });

  // Staff Users
  const [staff1] = await db
    .insert(user)
    .values({
      id: "staff-1",
      name: "Mike Johnson",
      email: "mike@camp.example",
      role: "staff",
      emailVerified: true,
    })
    .returning();

  await db.insert(account).values({
    id: "account-staff-1",
    accountId: "staff-1",
    providerId: "credential",
    userId: "staff-1",
    password: defaultPassword,
  });

  const [staff2] = await db
    .insert(user)
    .values({
      id: "staff-2",
      name: "Emily Chen",
      email: "emily@camp.example",
      role: "staff",
      emailVerified: true,
    })
    .returning();

  await db.insert(account).values({
    id: "account-staff-2",
    accountId: "staff-2",
    providerId: "credential",
    userId: "staff-2",
    password: defaultPassword,
  });

  // Nurse
  await db
    .insert(user)
    .values({
      id: "nurse-1",
      name: "Dr. Lisa Martinez",
      email: "lisa@camp.example",
      role: "nurse",
      emailVerified: true,
    });

  await db.insert(account).values({
    id: "account-nurse-1",
    accountId: "nurse-1",
    providerId: "credential",
    userId: "nurse-1",
    password: defaultPassword,
  });

  // Parents
  const [parent1] = await db
    .insert(user)
    .values({
      id: "parent-1",
      name: "Jennifer Smith",
      email: "jennifer.smith@example.com",
      role: "parent",
      emailVerified: true,
    })
    .returning();

  await db.insert(account).values({
    id: "account-parent-1",
    accountId: "parent-1",
    providerId: "credential",
    userId: "parent-1",
    password: defaultPassword,
  });

  const [parent2] = await db
    .insert(user)
    .values({
      id: "parent-2",
      name: "David Brown",
      email: "david.brown@example.com",
      role: "parent",
      emailVerified: true,
    })
    .returning();

  await db.insert(account).values({
    id: "account-parent-2",
    accountId: "parent-2",
    providerId: "credential",
    userId: "parent-2",
    password: defaultPassword,
  });

  const [parent3] = await db
    .insert(user)
    .values({
      id: "parent-3",
      name: "Maria Rodriguez",
      email: "maria.rodriguez@example.com",
      role: "parent",
      emailVerified: true,
    })
    .returning();

  await db.insert(account).values({
    id: "account-parent-3",
    accountId: "parent-3",
    providerId: "credential",
    userId: "parent-3",
    password: defaultPassword,
  });

  console.log(`✅ Created 7 users with accounts (1 admin, 2 staff, 1 nurse, 3 parents)`);

  // =============================================
  // STEP 2: Create Sessions
  // =============================================
  console.log("\n2. Creating sessions...");

  const [session1] = await db
    .insert(sessions)
    .values({
      name: "Summer Adventure - Week 1",
      startDate: new Date("2025-07-07"),
      endDate: new Date("2025-07-13"),
      price: "750.00",
      capacity: 50,
      status: "open",
    })
    .returning();

  const [session2] = await db
    .insert(sessions)
    .values({
      name: "Summer Adventure - Week 2",
      startDate: new Date("2025-07-14"),
      endDate: new Date("2025-07-20"),
      price: "750.00",
      capacity: 50,
      status: "open",
    })
    .returning();

  await db
    .insert(sessions)
    .values({
      name: "Creative Arts Week",
      startDate: new Date("2025-07-21"),
      endDate: new Date("2025-07-27"),
      price: "850.00",
      capacity: 30,
      status: "open",
    });

  const [session4] = await db
    .insert(sessions)
    .values({
      name: "Water Sports Week",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2025-08-07"),
      price: "650.00",
      capacity: 30,
      status: "open",
    })
    .returning();

  console.log(`✅ Created ${4} sessions`);

  // =============================================
  // STEP 3: Create Groups
  // =============================================
  console.log("\n3. Creating groups...");

  const [group1] = await db
    .insert(groups)
    .values({
      sessionId: session1.id,
      name: "Junior Explorers",
      type: "age_group",
      capacity: 25,
      staffRequired: 2,
    })
    .returning();

  const [group2] = await db
    .insert(groups)
    .values({
      sessionId: session1.id,
      name: "Senior Adventurers",
      type: "age_group",
      capacity: 25,
      staffRequired: 2,
    })
    .returning();

  const [group3] = await db
    .insert(groups)
    .values({
      sessionId: session2.id,
      name: "Trailblazers",
      type: "cabin",
      capacity: 25,
      staffRequired: 2,
    })
    .returning();

  const [group4] = await db
    .insert(groups)
    .values({
      sessionId: session4.id,
      name: "Dolphins",
      type: "age_group",
      capacity: 15,
      staffRequired: 2,
    })
    .returning();

  console.log(`✅ Created ${4} groups`);

  // =============================================
  // STEP 4: Create Staff Assignments
  // =============================================
  console.log("\n4. Creating staff assignments...");

  await db.insert(assignments).values([
    {
      staffId: staff1.id,
      groupId: group1.id,
      sessionId: session1.id,
      role: "counselor",
    },
    {
      staffId: staff2.id,
      groupId: group2.id,
      sessionId: session1.id,
      role: "counselor",
    },
    {
      staffId: staff1.id,
      groupId: group3.id,
      sessionId: session2.id,
      role: "counselor",
    },
    {
      staffId: staff2.id,
      groupId: group4.id,
      sessionId: session4.id,
      role: "counselor",
    },
  ]);

  console.log(`✅ Created ${4} staff assignments`);

  // =============================================
  // STEP 5: Create Children
  // =============================================
  console.log("\n5. Creating children...");

  const [child1] = await db
    .insert(children)
    .values({
      userId: parent1.id,
      firstName: "Emma",
      lastName: "Smith",
      dateOfBirth: new Date("2013-05-15"),
      allergies: ["peanuts", "shellfish"],
      medicalNotes: "Carries EpiPen. Mild asthma - has inhaler.",
    })
    .returning();

  const [child2] = await db
    .insert(children)
    .values({
      userId: parent1.id,
      firstName: "Liam",
      lastName: "Smith",
      dateOfBirth: new Date("2015-08-22"),
      allergies: [],
      medicalNotes: null,
    })
    .returning();

  const [child3] = await db
    .insert(children)
    .values({
      userId: parent2.id,
      firstName: "Olivia",
      lastName: "Brown",
      dateOfBirth: new Date("2012-11-30"),
      allergies: ["dairy"],
      medicalNotes: "Lactose intolerant. Needs dairy-free meals.",
    })
    .returning();

  const [child4] = await db
    .insert(children)
    .values({
      userId: parent2.id,
      firstName: "Noah",
      lastName: "Brown",
      dateOfBirth: new Date("2014-03-18"),
      allergies: [],
      medicalNotes: null,
    })
    .returning();

  const [child5] = await db
    .insert(children)
    .values({
      userId: parent3.id,
      firstName: "Sophia",
      lastName: "Rodriguez",
      dateOfBirth: new Date("2013-09-10"),
      allergies: ["bee stings"],
      medicalNotes: "Allergic to bee stings. Carries EpiPen.",
    })
    .returning();

  const [child6] = await db
    .insert(children)
    .values({
      userId: parent3.id,
      firstName: "Lucas",
      lastName: "Rodriguez",
      dateOfBirth: new Date("2016-01-25"),
      allergies: [],
      medicalNotes: null,
    })
    .returning();

  console.log(`✅ Created ${6} children`);

  // =============================================
  // STEP 6: Create Registrations
  // =============================================
  console.log("\n6. Creating registrations...");

  await db.insert(registrations).values([
    {
      userId: parent1.id,
      childId: child1.id,
      sessionId: session1.id,
      status: "confirmed",
      amountPaid: "750.00",
    },
    {
      userId: parent1.id,
      childId: child2.id,
      sessionId: session1.id,
      status: "confirmed",
      amountPaid: "750.00",
    },
    {
      userId: parent2.id,
      childId: child3.id,
      sessionId: session1.id,
      status: "confirmed",
      amountPaid: "750.00",
    },
    {
      userId: parent2.id,
      childId: child4.id,
      sessionId: session2.id,
      status: "pending",
      amountPaid: null,
    },
    {
      userId: parent3.id,
      childId: child5.id,
      sessionId: session4.id,
      status: "confirmed",
      amountPaid: "650.00",
    },
    {
      userId: parent3.id,
      childId: child6.id,
      sessionId: session4.id,
      status: "pending",
      amountPaid: null,
    },
  ]);

  console.log(`✅ Created ${6} registrations`);

  // =============================================
  // STEP 7: Assign Children to Groups
  // =============================================
  console.log("\n7. Assigning children to groups...");

  await db.insert(groupMembers).values([
    {
      groupId: group1.id,
      childId: child1.id,
    },
    {
      groupId: group1.id,
      childId: child2.id,
    },
    {
      groupId: group2.id,
      childId: child3.id,
    },
    {
      groupId: group3.id,
      childId: child4.id,
    },
    {
      groupId: group4.id,
      childId: child5.id,
    },
    {
      groupId: group4.id,
      childId: child6.id,
    },
  ]);

  console.log(`✅ Assigned ${6} children to groups`);

  // =============================================
  // SUMMARY
  // =============================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ Single-Tenant Database Seeded Successfully!");
  console.log("=".repeat(60));

  console.log("\n📊 Summary:");
  console.log(`  Users: 7 (1 admin, 2 staff, 1 nurse, 3 parents)`);
  console.log(`  Sessions: 4`);
  console.log(`  Groups: 4`);
  console.log(`  Children: 6`);
  console.log(`  Registrations: 6`);
  console.log(`  Staff Assignments: 4`);

  console.log("\n🔑 Test User Credentials:");
  console.log("------------------------");
  console.log("Password for all users: password123");
  console.log("\nAdmin:");
  console.log("  Email: sarah@camp.example");
  console.log("\nStaff:");
  console.log("  mike@camp.example");
  console.log("  emily@camp.example");
  console.log("\nNurse:");
  console.log("  lisa@camp.example");
  console.log("\nParents:");
  console.log("  jennifer.smith@example.com");
  console.log("  david.brown@example.com");
  console.log("  maria.rodriguez@example.com");

  console.log("\n🔗 Access URLs:");
  console.log("  Admin Dashboard: /dashboard/admin");
  console.log("  Staff Dashboard: /dashboard/staff");
  console.log("  Nurse Dashboard: /dashboard/nurse");
  console.log("  Parent Dashboard: /dashboard/parent");

  console.log("\n");
}

seed()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
