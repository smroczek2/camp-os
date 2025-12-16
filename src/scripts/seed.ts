import "dotenv/config";
import { db } from "../lib/db";
import {
  user,
  children,
  camps,
  sessions,
  registrations,
  groups,
  assignments,
  groupMembers,
} from "../lib/schema";

async function seed() {
  console.log("Starting database seed...");

  // Create test users
  console.log("Creating users...");

  await db
    .insert(user)
    .values({
      id: "admin-1",
      name: "Admin User",
      email: "admin@camposarai.co",
      role: "admin",
      emailVerified: true,
    })
    .returning();

  const [staff1] = await db
    .insert(user)
    .values({
      id: "staff-1",
      name: "Sarah Johnson",
      email: "sarah.johnson@camposarai.co",
      role: "staff",
      emailVerified: true,
    })
    .returning();

  const [staff2] = await db
    .insert(user)
    .values({
      id: "staff-2",
      name: "Mike Chen",
      email: "mike.chen@camposarai.co",
      role: "staff",
      emailVerified: true,
    })
    .returning();

  await db
    .insert(user)
    .values({
      id: "nurse-1",
      name: "Dr. Emily Martinez",
      email: "emily.martinez@camposarai.co",
      role: "nurse",
      emailVerified: true,
    })
    .returning();

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

  const [parent2] = await db
    .insert(user)
    .values({
      id: "parent-2",
      name: "David Williams",
      email: "david.williams@example.com",
      role: "parent",
      emailVerified: true,
    })
    .returning();

  const [parent3] = await db
    .insert(user)
    .values({
      id: "parent-3",
      name: "Maria Garcia",
      email: "maria.garcia@example.com",
      role: "parent",
      emailVerified: true,
    })
    .returning();

  console.log(`Created ${7} users`);

  // Create camps
  console.log("Creating camps...");

  const [summerCamp] = await db
    .insert(camps)
    .values({
      name: "Summer Adventure Camp 2025",
      description:
        "A week-long summer camp focused on outdoor adventures, team building, and creative activities for kids ages 8-14.",
      location: "Camp Sarai - Mountain Ridge, CA",
      capacity: 100,
    })
    .returning();

  const [artsCamp] = await db
    .insert(camps)
    .values({
      name: "Creative Arts Camp 2025",
      description:
        "Explore your creativity through painting, sculpture, music, and theater in this immersive arts experience.",
      location: "Camp Sarai - Lakeside Campus, CA",
      capacity: 50,
    })
    .returning();

  console.log(`Created ${2} camps`);

  // Create sessions
  console.log("Creating sessions...");

  const [session1] = await db
    .insert(sessions)
    .values({
      campId: summerCamp.id,
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
      campId: summerCamp.id,
      startDate: new Date("2025-07-14"),
      endDate: new Date("2025-07-20"),
      price: "750.00",
      capacity: 50,
      status: "open",
    })
    .returning();

  const [session3] = await db
    .insert(sessions)
    .values({
      campId: artsCamp.id,
      startDate: new Date("2025-07-21"),
      endDate: new Date("2025-07-27"),
      price: "850.00",
      capacity: 30,
      status: "open",
    })
    .returning();

  console.log(`Created ${3} sessions`);

  // Create groups
  console.log("Creating groups...");

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
      sessionId: session3.id,
      name: "Creative Minds",
      type: "age_group",
      capacity: 30,
      staffRequired: 2,
    })
    .returning();

  console.log(`Created ${4} groups`);

  // Create staff assignments
  console.log("Creating staff assignments...");

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
      sessionId: session3.id,
      role: "counselor",
    },
  ]);

  console.log(`Created ${4} staff assignments`);

  // Create children
  console.log("Creating children...");

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
      lastName: "Williams",
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
      lastName: "Williams",
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
      lastName: "Garcia",
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
      lastName: "Garcia",
      dateOfBirth: new Date("2016-01-25"),
      allergies: [],
      medicalNotes: null,
    })
    .returning();

  console.log(`Created ${6} children`);

  // Create registrations
  console.log("Creating registrations...");

  await db
    .insert(registrations)
    .values({
      userId: parent1.id,
      childId: child1.id,
      sessionId: session1.id,
      status: "confirmed",
      amountPaid: "750.00",
    })
    .returning();

  await db
    .insert(registrations)
    .values({
      userId: parent1.id,
      childId: child2.id,
      sessionId: session1.id,
      status: "confirmed",
      amountPaid: "750.00",
    })
    .returning();

  await db
    .insert(registrations)
    .values({
      userId: parent2.id,
      childId: child3.id,
      sessionId: session1.id,
      status: "confirmed",
      amountPaid: "750.00",
    })
    .returning();

  await db
    .insert(registrations)
    .values({
      userId: parent2.id,
      childId: child4.id,
      sessionId: session2.id,
      status: "confirmed",
      amountPaid: "750.00",
    })
    .returning();

  await db
    .insert(registrations)
    .values({
      userId: parent3.id,
      childId: child5.id,
      sessionId: session3.id,
      status: "confirmed",
      amountPaid: "850.00",
    })
    .returning();

  await db
    .insert(registrations)
    .values({
      userId: parent3.id,
      childId: child6.id,
      sessionId: session1.id,
      status: "pending",
      amountPaid: null,
    })
    .returning();

  console.log(`Created ${6} registrations`);

  // Assign children to groups
  console.log("Assigning children to groups...");

  await db.insert(groupMembers).values([
    { groupId: group1.id, childId: child1.id },
    { groupId: group1.id, childId: child2.id },
    { groupId: group2.id, childId: child3.id },
    { groupId: group3.id, childId: child4.id },
    { groupId: group4.id, childId: child5.id },
    { groupId: group1.id, childId: child6.id },
  ]);

  console.log(`Assigned ${6} children to groups`);

  console.log("\n✅ Database seeded successfully!");
  console.log("\nTest User Credentials:");
  console.log("------------------------");
  console.log("Admin:");
  console.log("  Email: admin@camposarai.co");
  console.log("\nStaff:");
  console.log("  Email: sarah.johnson@camposarai.co");
  console.log("  Email: mike.chen@camposarai.co");
  console.log("\nNurse:");
  console.log("  Email: emily.martinez@camposarai.co");
  console.log("\nParents:");
  console.log("  Email: jennifer.smith@example.com (2 children)");
  console.log("  Email: david.williams@example.com (2 children)");
  console.log("  Email: maria.garcia@example.com (2 children)");
  console.log("\nCamps & Sessions:");
  console.log("  - Summer Adventure Camp: 2 sessions (July 7-13, July 14-20)");
  console.log("  - Creative Arts Camp: 1 session (July 21-27)");
  console.log("\n");
}

seed()
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
