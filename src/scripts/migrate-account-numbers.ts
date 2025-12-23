import "dotenv/config";
import { db } from "../lib/db";
import { user } from "../lib/schema";
import { asc, isNull } from "drizzle-orm";

function generateAccountNumber(sequenceNumber: number): string {
  // Format: A-000001, A-000002, etc. (zero-padded 6 digits)
  return `A-${sequenceNumber.toString().padStart(6, "0")}`;
}

async function migrateAccountNumbers() {
  console.log("Assigning account numbers to existing users...");

  // Get all users without account numbers, ordered by createdAt ascending
  const usersWithoutAccountNumbers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(isNull(user.accountNumber))
    .orderBy(asc(user.createdAt));

  if (usersWithoutAccountNumbers.length === 0) {
    console.log("No users found without account numbers. All users already have account numbers.");
    return;
  }

  console.log(`Found ${usersWithoutAccountNumbers.length} users without account numbers.`);

  // Get the highest existing account number to continue sequence
  const usersWithAccountNumbers = await db
    .select({
      accountNumber: user.accountNumber,
    })
    .from(user)
    .where(isNull(user.accountNumber));

  let startingSequence = 1;

  // If there are existing account numbers, find the highest and continue from there
  const existingNumbers = usersWithAccountNumbers
    .map(u => u.accountNumber)
    .filter((num): num is string => num !== null)
    .map(num => parseInt(num.replace("A-", "")))
    .filter(num => !isNaN(num));

  if (existingNumbers.length > 0) {
    startingSequence = Math.max(...existingNumbers) + 1;
    console.log(`Continuing from sequence number ${startingSequence}...`);
  }

  // Assign account numbers sequentially
  let updatedCount = 0;
  let currentSequence = startingSequence;

  for (const userRecord of usersWithoutAccountNumbers) {
    const accountNumber = generateAccountNumber(currentSequence);

    await db
      .update(user)
      .set({
        accountNumber,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userRecord.id));

    console.log(`- ${userRecord.name} (${userRecord.email}): ${accountNumber}`);
    updatedCount++;
    currentSequence++;
  }

  console.log(`\nSuccessfully assigned account numbers to ${updatedCount} users.`);
  console.log("Done.");
}

// Import eq for the where clause
import { eq } from "drizzle-orm";

migrateAccountNumbers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error migrating account numbers:", error);
    process.exit(1);
  });
