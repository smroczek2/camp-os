import "dotenv/config";
import { db } from "../lib/db";
import {
  user,
  organizations,
  organizationUsers,
  children,
  camps,
  sessions,
  registrations,
  groups,
  assignments,
  groupMembers,
} from "../lib/schema";

async function seed() {
  console.log("Starting multi-tenant database seed...");

  // =============================================
  // STEP 1: Create Organizations
  // =============================================
  console.log("\n1. Creating organizations...");

  const [org1] = await db
    .insert(organizations)
    .values({
      name: "Pine Ridge Summer Camp",
      slug: "pine-ridge",
      status: "active",
      subscriptionTier: "pro",
      maxCampers: 200,
      maxStaff: 50,
      contactEmail: "admin@pineridge.camp",
      contactPhone: "(555) 123-4567",
      timezone: "America/Los_Angeles",
    })
    .returning();

  const [org2] = await db
    .insert(organizations)
    .values({
      name: "Lakeside Adventures",
      slug: "lakeside",
      status: "active",
      subscriptionTier: "free",
      maxCampers: 100,
      maxStaff: 20,
      contactEmail: "director@lakeside.camp",
      contactPhone: "(555) 234-5678",
      timezone: "America/New_York",
    })
    .returning();

  const [org3] = await db
    .insert(organizations)
    .values({
      name: "Mountain View Camp (Trial)",
      slug: "mountain-view",
      status: "trial",
      subscriptionTier: "free",
      maxCampers: 100,
      maxStaff: 20,
      contactEmail: "info@mountainview.camp",
      timezone: "America/Denver",
    })
    .returning();

  console.log(`✅ Created ${3} organizations`);

  // =============================================
  // STEP 2: Create Users
  // =============================================
  console.log("\n2. Creating users...");

  // Super Admin (Camp OS employee)
  const [superAdmin] = await db
    .insert(user)
    .values({
      id: "super-admin-1",
      name: "Camp OS Support",
      email: "support@campminder.com",
      role: "super_admin",
      emailVerified: true,
    })
    .returning();

  // Organization 1 (Pine Ridge) Users
  const [org1Admin] = await db
    .insert(user)
    .values({
      id: "org1-admin-1",
      name: "Sarah Williams",
      email: "sarah@pineridge.camp",
      role: "admin",
      emailVerified: true,
      activeOrganizationId: org1.id,
    })
    .returning();

  const [org1Staff1] = await db
    .insert(user)
    .values({
      id: "org1-staff-1",
      name: "Mike Johnson",
      email: "mike@pineridge.camp",
      role: "staff",
      emailVerified: true,
      activeOrganizationId: org1.id,
    })
    .returning();

  const [org1Staff2] = await db
    .insert(user)
    .values({
      id: "org1-staff-2",
      name: "Emily Chen",
      email: "emily@pineridge.camp",
      role: "staff",
      emailVerified: true,
      activeOrganizationId: org1.id,
    })
    .returning();

  const [org1Nurse] = await db
    .insert(user)
    .values({
      id: "org1-nurse-1",
      name: "Dr. Lisa Martinez",
      email: "lisa@pineridge.camp",
      role: "nurse",
      emailVerified: true,
      activeOrganizationId: org1.id,
    })
    .returning();

  const [org1Parent1] = await db
    .insert(user)
    .values({
      id: "org1-parent-1",
      name: "Jennifer Smith",
      email: "jennifer.smith@example.com",
      role: "parent",
      emailVerified: true,
      activeOrganizationId: org1.id,
    })
    .returning();

  const [org1Parent2] = await db
    .insert(user)
    .values({
      id: "org1-parent-2",
      name: "David Brown",
      email: "david.brown@example.com",
      role: "parent",
      emailVerified: true,
      activeOrganizationId: org1.id,
    })
    .returning();

  // Organization 2 (Lakeside) Users
  const [org2Admin] = await db
    .insert(user)
    .values({
      id: "org2-admin-1",
      name: "Robert Garcia",
      email: "robert@lakeside.camp",
      role: "admin",
      emailVerified: true,
      activeOrganizationId: org2.id,
    })
    .returning();

  const [org2Parent1] = await db
    .insert(user)
    .values({
      id: "org2-parent-1",
      name: "Maria Rodriguez",
      email: "maria.rodriguez@example.com",
      role: "parent",
      emailVerified: true,
      activeOrganizationId: org2.id,
    })
    .returning();

  console.log(`✅ Created ${9} users (1 super admin, 4 org1 staff, 2 org1 parents, 1 org2 admin, 1 org2 parent)`);

  // =============================================
  // STEP 3: Create Organization Memberships
  // =============================================
  console.log("\n3. Creating organization memberships...");

  await db.insert(organizationUsers).values([
    // Pine Ridge memberships
    {
      organizationId: org1.id,
      userId: org1Admin.id,
      role: "owner",
      status: "active",
      joinedAt: new Date(),
    },
    {
      organizationId: org1.id,
      userId: org1Staff1.id,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    },
    {
      organizationId: org1.id,
      userId: org1Staff2.id,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    },
    {
      organizationId: org1.id,
      userId: org1Nurse.id,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    },
    {
      organizationId: org1.id,
      userId: org1Parent1.id,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    },
    {
      organizationId: org1.id,
      userId: org1Parent2.id,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    },
    // Lakeside memberships
    {
      organizationId: org2.id,
      userId: org2Admin.id,
      role: "owner",
      status: "active",
      joinedAt: new Date(),
    },
    {
      organizationId: org2.id,
      userId: org2Parent1.id,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    },
  ]);

  console.log(`✅ Created ${8} organization memberships`);

  // =============================================
  // STEP 4: Create Organization 1 (Pine Ridge) Data
  // =============================================
  console.log("\n4. Creating Pine Ridge camp data...");

  const [org1Camp1] = await db
    .insert(camps)
    .values({
      organizationId: org1.id,
      name: "Summer Adventure Camp 2025",
      description:
        "A week-long summer camp focused on outdoor adventures and team building.",
      location: "Pine Ridge - Mountain Campus, CA",
      capacity: 100,
    })
    .returning();

  const [org1Camp2] = await db
    .insert(camps)
    .values({
      organizationId: org1.id,
      name: "Creative Arts Camp 2025",
      description: "Explore creativity through arts, music, and theater.",
      location: "Pine Ridge - Arts Center, CA",
      capacity: 50,
    })
    .returning();

  console.log(`✅ Created ${2} camps for Pine Ridge`);

  const [org1Session1] = await db
    .insert(sessions)
    .values({
      organizationId: org1.id,
      campId: org1Camp1.id,
      startDate: new Date("2025-07-07"),
      endDate: new Date("2025-07-13"),
      price: "750.00",
      capacity: 50,
      status: "open",
    })
    .returning();

  const [org1Session2] = await db
    .insert(sessions)
    .values({
      organizationId: org1.id,
      campId: org1Camp1.id,
      startDate: new Date("2025-07-14"),
      endDate: new Date("2025-07-20"),
      price: "750.00",
      capacity: 50,
      status: "open",
    })
    .returning();

  const [org1Session3] = await db
    .insert(sessions)
    .values({
      organizationId: org1.id,
      campId: org1Camp2.id,
      startDate: new Date("2025-07-21"),
      endDate: new Date("2025-07-27"),
      price: "850.00",
      capacity: 30,
      status: "open",
    })
    .returning();

  console.log(`✅ Created ${3} sessions for Pine Ridge`);

  const [org1Group1] = await db
    .insert(groups)
    .values({
      organizationId: org1.id,
      sessionId: org1Session1.id,
      name: "Junior Explorers",
      type: "age_group",
      capacity: 25,
      staffRequired: 2,
    })
    .returning();

  const [org1Group2] = await db
    .insert(groups)
    .values({
      organizationId: org1.id,
      sessionId: org1Session1.id,
      name: "Senior Adventurers",
      type: "age_group",
      capacity: 25,
      staffRequired: 2,
    })
    .returning();

  const [org1Group3] = await db
    .insert(groups)
    .values({
      organizationId: org1.id,
      sessionId: org1Session2.id,
      name: "Trailblazers",
      type: "cabin",
      capacity: 25,
      staffRequired: 2,
    })
    .returning();

  console.log(`✅ Created ${3} groups for Pine Ridge`);

  await db.insert(assignments).values([
    {
      organizationId: org1.id,
      staffId: org1Staff1.id,
      groupId: org1Group1.id,
      sessionId: org1Session1.id,
      role: "counselor",
    },
    {
      organizationId: org1.id,
      staffId: org1Staff2.id,
      groupId: org1Group2.id,
      sessionId: org1Session1.id,
      role: "counselor",
    },
    {
      organizationId: org1.id,
      staffId: org1Staff1.id,
      groupId: org1Group3.id,
      sessionId: org1Session2.id,
      role: "counselor",
    },
  ]);

  console.log(`✅ Created ${3} staff assignments for Pine Ridge`);

  const [org1Child1] = await db
    .insert(children)
    .values({
      organizationId: org1.id,
      userId: org1Parent1.id,
      firstName: "Emma",
      lastName: "Smith",
      dateOfBirth: new Date("2013-05-15"),
      allergies: ["peanuts", "shellfish"],
      medicalNotes: "Carries EpiPen. Mild asthma - has inhaler.",
    })
    .returning();

  const [org1Child2] = await db
    .insert(children)
    .values({
      organizationId: org1.id,
      userId: org1Parent1.id,
      firstName: "Liam",
      lastName: "Smith",
      dateOfBirth: new Date("2015-08-22"),
      allergies: [],
      medicalNotes: null,
    })
    .returning();

  const [org1Child3] = await db
    .insert(children)
    .values({
      organizationId: org1.id,
      userId: org1Parent2.id,
      firstName: "Olivia",
      lastName: "Brown",
      dateOfBirth: new Date("2012-11-30"),
      allergies: ["dairy"],
      medicalNotes: "Lactose intolerant. Needs dairy-free meals.",
    })
    .returning();

  const [org1Child4] = await db
    .insert(children)
    .values({
      organizationId: org1.id,
      userId: org1Parent2.id,
      firstName: "Noah",
      lastName: "Brown",
      dateOfBirth: new Date("2014-03-18"),
      allergies: [],
      medicalNotes: null,
    })
    .returning();

  console.log(`✅ Created ${4} children for Pine Ridge`);

  await db.insert(registrations).values([
    {
      organizationId: org1.id,
      userId: org1Parent1.id,
      childId: org1Child1.id,
      sessionId: org1Session1.id,
      status: "confirmed",
      amountPaid: "750.00",
    },
    {
      organizationId: org1.id,
      userId: org1Parent1.id,
      childId: org1Child2.id,
      sessionId: org1Session1.id,
      status: "confirmed",
      amountPaid: "750.00",
    },
    {
      organizationId: org1.id,
      userId: org1Parent2.id,
      childId: org1Child3.id,
      sessionId: org1Session1.id,
      status: "confirmed",
      amountPaid: "750.00",
    },
    {
      organizationId: org1.id,
      userId: org1Parent2.id,
      childId: org1Child4.id,
      sessionId: org1Session2.id,
      status: "pending",
      amountPaid: null,
    },
  ]);

  console.log(`✅ Created ${4} registrations for Pine Ridge`);

  await db.insert(groupMembers).values([
    {
      organizationId: org1.id,
      groupId: org1Group1.id,
      childId: org1Child1.id,
    },
    {
      organizationId: org1.id,
      groupId: org1Group1.id,
      childId: org1Child2.id,
    },
    {
      organizationId: org1.id,
      groupId: org1Group2.id,
      childId: org1Child3.id,
    },
    {
      organizationId: org1.id,
      groupId: org1Group3.id,
      childId: org1Child4.id,
    },
  ]);

  console.log(`✅ Assigned ${4} children to groups (Pine Ridge)`);

  // =============================================
  // STEP 5: Create Organization 2 (Lakeside) Data
  // =============================================
  console.log("\n5. Creating Lakeside camp data...");

  const [org2Camp1] = await db
    .insert(camps)
    .values({
      organizationId: org2.id,
      name: "Water Sports Camp 2025",
      description: "Swimming, kayaking, and water safety instruction.",
      location: "Lakeside - Waterfront Campus, NY",
      capacity: 60,
    })
    .returning();

  console.log(`✅ Created ${1} camp for Lakeside`);

  const [org2Session1] = await db
    .insert(sessions)
    .values({
      organizationId: org2.id,
      campId: org2Camp1.id,
      startDate: new Date("2025-08-01"),
      endDate: new Date("2025-08-07"),
      price: "650.00",
      capacity: 30,
      status: "open",
    })
    .returning();

  console.log(`✅ Created ${1} session for Lakeside`);

  const [org2Child1] = await db
    .insert(children)
    .values({
      organizationId: org2.id,
      userId: org2Parent1.id,
      firstName: "Sophia",
      lastName: "Rodriguez",
      dateOfBirth: new Date("2013-09-10"),
      allergies: ["bee stings"],
      medicalNotes: "Allergic to bee stings. Carries EpiPen.",
    })
    .returning();

  const [org2Child2] = await db
    .insert(children)
    .values({
      organizationId: org2.id,
      userId: org2Parent1.id,
      firstName: "Lucas",
      lastName: "Rodriguez",
      dateOfBirth: new Date("2016-01-25"),
      allergies: [],
      medicalNotes: null,
    })
    .returning();

  console.log(`✅ Created ${2} children for Lakeside`);

  await db.insert(registrations).values([
    {
      organizationId: org2.id,
      userId: org2Parent1.id,
      childId: org2Child1.id,
      sessionId: org2Session1.id,
      status: "confirmed",
      amountPaid: "650.00",
    },
    {
      organizationId: org2.id,
      userId: org2Parent1.id,
      childId: org2Child2.id,
      sessionId: org2Session1.id,
      status: "pending",
      amountPaid: null,
    },
  ]);

  console.log(`✅ Created ${2} registrations for Lakeside`);

  // =============================================
  // SUMMARY
  // =============================================
  console.log("\n" + "=".repeat(60));
  console.log("✅ Multi-Tenant Database Seeded Successfully!");
  console.log("=".repeat(60));

  console.log("\n📊 Summary:");
  console.log(`  Organizations: 3`);
  console.log(`  Users: 9 (1 super admin + 8 org members)`);
  console.log(`  Organization 1 (Pine Ridge): 2 camps, 3 sessions, 4 children, 4 registrations`);
  console.log(`  Organization 2 (Lakeside): 1 camp, 1 session, 2 children, 2 registrations`);
  console.log(`  Organization 3 (Mountain View): Empty (trial org)`);

  console.log("\n🔑 Test User Credentials:");
  console.log("------------------------");
  console.log("Super Admin:");
  console.log("  Email: support@campminder.com");
  console.log("  Role: super_admin (access all organizations)");
  console.log("\nOrganization 1 - Pine Ridge Summer Camp:");
  console.log("  Admin: sarah@pineridge.camp");
  console.log("  Staff: mike@pineridge.camp, emily@pineridge.camp");
  console.log("  Nurse: lisa@pineridge.camp");
  console.log("  Parents: jennifer.smith@example.com, david.brown@example.com");
  console.log("\nOrganization 2 - Lakeside Adventures:");
  console.log("  Admin: robert@lakeside.camp");
  console.log("  Parent: maria.rodriguez@example.com");

  console.log("\n🔗 Access URLs:");
  console.log("  Pine Ridge: /org/pine-ridge/dashboard");
  console.log("  Lakeside: /org/lakeside/dashboard");
  console.log("  Super Admin: /super-admin/dashboard");

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
