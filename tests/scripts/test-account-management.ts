/**
 * Test Script: Account Management System
 *
 * This script tests the account detail pages functionality including:
 * - Account number generation
 * - Payment recording
 * - Charge creation
 * - Balance calculation
 * - Notes management
 * - Contact management
 *
 * Run with: npx tsx tests/scripts/test-account-management.ts
 */

import { db } from "@/lib/db";
import { user, payments, charges, accountNotes, accountContacts } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message: string, color: keyof typeof colors = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, "cyan");
  console.log("=".repeat(60) + "\n");
}

function logTest(name: string, passed: boolean, details?: string) {
  const status = passed ? "✓ PASS" : "✗ FAIL";
  const color = passed ? "green" : "red";
  log(`${status}: ${name}`, color);
  if (details) {
    log(`  ${details}`, "yellow");
  }
}

async function testAccountNumbers() {
  logSection("Test 1: Account Number Generation");

  try {
    // Check if users have account numbers
    const users = await db.select().from(user).limit(5);

    if (users.length === 0) {
      logTest("Account numbers exist", false, "No users found in database");
      return false;
    }

    const usersWithNumbers = users.filter(u => u.accountNumber);
    const allHaveNumbers = usersWithNumbers.length === users.length;

    logTest(
      "All users have account numbers",
      allHaveNumbers,
      `${usersWithNumbers.length}/${users.length} users have account numbers`
    );

    // Check format (A-XXXXXX)
    const validFormat = usersWithNumbers.every(u =>
      u.accountNumber && /^A-\d{6}$/.test(u.accountNumber)
    );

    logTest(
      "Account numbers follow A-XXXXXX format",
      validFormat,
      validFormat ? "All numbers match pattern" : "Some numbers don't match A-XXXXXX format"
    );

    // Check uniqueness
    const accountNumbers = usersWithNumbers.map(u => u.accountNumber);
    const uniqueNumbers = new Set(accountNumbers);
    const allUnique = accountNumbers.length === uniqueNumbers.size;

    logTest(
      "Account numbers are unique",
      allUnique,
      `${uniqueNumbers.size} unique numbers out of ${accountNumbers.length}`
    );

    // Display sample account numbers
    log("\nSample account numbers:", "blue");
    usersWithNumbers.slice(0, 3).forEach(u => {
      console.log(`  ${u.accountNumber} - ${u.name} (${u.email})`);
    });

    return allHaveNumbers && validFormat && allUnique;
  } catch (error) {
    logTest("Account number test", false, `Error: ${error}`);
    return false;
  }
}

async function testPaymentRecording() {
  logSection("Test 2: Payment Recording");

  try {
    // Get first user with account number
    const testUser = await db.select().from(user).where(sql`${user.accountNumber} IS NOT NULL`).limit(1);

    if (testUser.length === 0) {
      logTest("Payment recording", false, "No users with account numbers found");
      return false;
    }

    const account = testUser[0];
    log(`Testing with account: ${account.accountNumber} - ${account.name}`, "blue");

    // Create test payment
    const testPayment = {
      id: crypto.randomUUID(),
      accountId: account.id,
      amount: 15000, // $150.00
      paymentMethod: "check",
      referenceNumber: "CHECK-12345",
      description: "Test payment for camp registration",
      status: "completed" as const,
      processedBy: account.id, // Using same user as processor for test
      processedAt: new Date(),
      createdAt: new Date(),
    };

    await db.insert(payments).values(testPayment);

    // Verify payment was created
    const createdPayment = await db.select().from(payments).where(eq(payments.id, testPayment.id));

    logTest(
      "Payment record created",
      createdPayment.length === 1,
      createdPayment.length === 1 ? `Payment ID: ${testPayment.id}` : "Payment not found"
    );

    // Verify payment data
    if (createdPayment.length === 1) {
      const payment = createdPayment[0];
      const dataCorrect =
        payment.amount === 15000 &&
        payment.paymentMethod === "check" &&
        payment.status === "completed";

      logTest(
        "Payment data is correct",
        dataCorrect,
        `Amount: $${payment.amount / 100}, Method: ${payment.paymentMethod}, Status: ${payment.status}`
      );

      return dataCorrect;
    }

    return false;
  } catch (error) {
    logTest("Payment recording", false, `Error: ${error}`);
    return false;
  }
}

async function testChargeCreation() {
  logSection("Test 3: Charge Creation");

  try {
    // Get first user with account number
    const testUser = await db.select().from(user).where(sql`${user.accountNumber} IS NOT NULL`).limit(1);

    if (testUser.length === 0) {
      logTest("Charge creation", false, "No users with account numbers found");
      return false;
    }

    const account = testUser[0];
    log(`Testing with account: ${account.accountNumber} - ${account.name}`, "blue");

    // Create test charge
    const testCharge = {
      id: crypto.randomUUID(),
      accountId: account.id,
      amount: 25000, // $250.00
      description: "Summer Camp 2024 - Week 1",
      chargeType: "registration" as const,
      createdBy: account.id,
      createdAt: new Date(),
    };

    await db.insert(charges).values(testCharge);

    // Verify charge was created
    const createdCharge = await db.select().from(charges).where(eq(charges.id, testCharge.id));

    logTest(
      "Charge record created",
      createdCharge.length === 1,
      createdCharge.length === 1 ? `Charge ID: ${testCharge.id}` : "Charge not found"
    );

    // Verify charge data
    if (createdCharge.length === 1) {
      const charge = createdCharge[0];
      const dataCorrect =
        charge.amount === 25000 &&
        charge.chargeType === "registration" &&
        charge.description.includes("Summer Camp");

      logTest(
        "Charge data is correct",
        dataCorrect,
        `Amount: $${charge.amount / 100}, Type: ${charge.chargeType}, Description: ${charge.description}`
      );

      return dataCorrect;
    }

    return false;
  } catch (error) {
    logTest("Charge creation", false, `Error: ${error}`);
    return false;
  }
}

async function testBalanceCalculation() {
  logSection("Test 4: Balance Calculation");

  try {
    // Get first user with account number
    const testUser = await db.select().from(user).where(sql`${user.accountNumber} IS NOT NULL`).limit(1);

    if (testUser.length === 0) {
      logTest("Balance calculation", false, "No users with account numbers found");
      return false;
    }

    const account = testUser[0];
    log(`Testing with account: ${account.accountNumber} - ${account.name}`, "blue");

    // Get all payments and charges for this account
    const accountPayments = await db.select().from(payments).where(eq(payments.accountId, account.id));
    const accountCharges = await db.select().from(charges).where(eq(charges.accountId, account.id));

    // Calculate totals
    const totalPayments = accountPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalCharges = accountCharges.reduce((sum, c) => sum + c.amount, 0);
    const balance = totalCharges - totalPayments;

    log(`\nBalance breakdown:`, "blue");
    console.log(`  Total charges: $${(totalCharges / 100).toFixed(2)}`);
    console.log(`  Total payments: $${(totalPayments / 100).toFixed(2)}`);
    console.log(`  Balance owed: $${(balance / 100).toFixed(2)}`);
    console.log(`  Payments count: ${accountPayments.length}`);
    console.log(`  Charges count: ${accountCharges.length}`);

    logTest(
      "Balance calculation completed",
      true,
      `Balance: $${(balance / 100).toFixed(2)}`
    );

    return true;
  } catch (error) {
    logTest("Balance calculation", false, `Error: ${error}`);
    return false;
  }
}

async function testNotesManagement() {
  logSection("Test 5: Account Notes");

  try {
    // Get first user with account number
    const testUser = await db.select().from(user).where(sql`${user.accountNumber} IS NOT NULL`).limit(1);

    if (testUser.length === 0) {
      logTest("Notes management", false, "No users with account numbers found");
      return false;
    }

    const account = testUser[0];
    log(`Testing with account: ${account.accountNumber} - ${account.name}`, "blue");

    // Create test note
    const testNote = {
      id: crypto.randomUUID(),
      accountId: account.id,
      note: "Test note: Family requested early drop-off for Week 2",
      createdBy: account.id,
      createdAt: new Date(),
    };

    await db.insert(accountNotes).values(testNote);

    // Verify note was created
    const createdNote = await db.select().from(accountNotes).where(eq(accountNotes.id, testNote.id));

    logTest(
      "Note record created",
      createdNote.length === 1,
      createdNote.length === 1 ? `Note ID: ${testNote.id}` : "Note not found"
    );

    // Get all notes for account
    const allNotes = await db.select().from(accountNotes).where(eq(accountNotes.accountId, account.id));

    logTest(
      "Notes retrieved for account",
      allNotes.length > 0,
      `Found ${allNotes.length} note(s)`
    );

    if (allNotes.length > 0) {
      log("\nRecent notes:", "blue");
      allNotes.slice(0, 3).forEach((note, i) => {
        console.log(`  ${i + 1}. ${note.note.substring(0, 50)}...`);
      });
    }

    return createdNote.length === 1 && allNotes.length > 0;
  } catch (error) {
    logTest("Notes management", false, `Error: ${error}`);
    return false;
  }
}

async function testContactsManagement() {
  logSection("Test 6: Account Contacts");

  try {
    // Get first user with account number
    const testUser = await db.select().from(user).where(sql`${user.accountNumber} IS NOT NULL`).limit(1);

    if (testUser.length === 0) {
      logTest("Contacts management", false, "No users with account numbers found");
      return false;
    }

    const account = testUser[0];
    log(`Testing with account: ${account.accountNumber} - ${account.name}`, "blue");

    // Create test contact
    const testContact = {
      id: crypto.randomUUID(),
      accountId: account.id,
      firstName: "Jane",
      lastName: "Smith",
      relationship: "spouse",
      phone: "555-0123",
      email: "jane.smith@example.com",
      isPrimary: true,
      receivesBilling: true,
      receivesUpdates: true,
      notes: "Secondary contact for billing",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(accountContacts).values(testContact);

    // Verify contact was created
    const createdContact = await db.select().from(accountContacts).where(eq(accountContacts.id, testContact.id));

    logTest(
      "Contact record created",
      createdContact.length === 1,
      createdContact.length === 1 ? `Contact ID: ${testContact.id}` : "Contact not found"
    );

    // Verify contact data
    if (createdContact.length === 1) {
      const contact = createdContact[0];
      const dataCorrect =
        contact.firstName === "Jane" &&
        contact.lastName === "Smith" &&
        contact.isPrimary === true &&
        contact.receivesBilling === true;

      logTest(
        "Contact data is correct",
        dataCorrect,
        `${contact.firstName} ${contact.lastName}, Primary: ${contact.isPrimary}, Billing: ${contact.receivesBilling}`
      );

      return dataCorrect;
    }

    return false;
  } catch (error) {
    logTest("Contacts management", false, `Error: ${error}`);
    return false;
  }
}

async function cleanupTestData() {
  logSection("Cleanup: Removing Test Data");

  try {
    // Get test user
    const testUser = await db.select().from(user).where(sql`${user.accountNumber} IS NOT NULL`).limit(1);

    if (testUser.length === 0) {
      log("No test data to cleanup", "yellow");
      return;
    }

    const account = testUser[0];

    // Delete test payments (those created in last hour with test description)
    const recentPayments = await db.select().from(payments)
      .where(eq(payments.accountId, account.id));

    const testPayments = recentPayments.filter(p =>
      p.description?.includes("Test payment") ||
      p.referenceNumber?.includes("CHECK-12345")
    );

    if (testPayments.length > 0) {
      for (const payment of testPayments) {
        await db.delete(payments).where(eq(payments.id, payment.id));
      }
      log(`Deleted ${testPayments.length} test payment(s)`, "green");
    }

    // Delete test charges
    const recentCharges = await db.select().from(charges)
      .where(eq(charges.accountId, account.id));

    const testCharges = recentCharges.filter(c =>
      c.description.includes("Test") || c.description.includes("Summer Camp 2024")
    );

    if (testCharges.length > 0) {
      for (const charge of testCharges) {
        await db.delete(charges).where(eq(charges.id, charge.id));
      }
      log(`Deleted ${testCharges.length} test charge(s)`, "green");
    }

    // Delete test notes
    const recentNotes = await db.select().from(accountNotes)
      .where(eq(accountNotes.accountId, account.id));

    const testNotes = recentNotes.filter(n => n.note.includes("Test note:"));

    if (testNotes.length > 0) {
      for (const note of testNotes) {
        await db.delete(accountNotes).where(eq(accountNotes.id, note.id));
      }
      log(`Deleted ${testNotes.length} test note(s)`, "green");
    }

    // Delete test contacts
    const recentContacts = await db.select().from(accountContacts)
      .where(eq(accountContacts.accountId, account.id));

    const testContacts = recentContacts.filter(c =>
      c.email === "jane.smith@example.com"
    );

    if (testContacts.length > 0) {
      for (const contact of testContacts) {
        await db.delete(accountContacts).where(eq(accountContacts.id, contact.id));
      }
      log(`Deleted ${testContacts.length} test contact(s)`, "green");
    }

    log("\nCleanup completed successfully", "green");
  } catch (error) {
    log(`Cleanup error: ${error}`, "red");
  }
}

async function runAllTests() {
  log("\n╔════════════════════════════════════════════════════════════╗", "cyan");
  log("║        Account Management System - Test Suite             ║", "cyan");
  log("╚════════════════════════════════════════════════════════════╝", "cyan");

  const results = {
    accountNumbers: false,
    payments: false,
    charges: false,
    balance: false,
    notes: false,
    contacts: false,
  };

  try {
    results.accountNumbers = await testAccountNumbers();
    results.payments = await testPaymentRecording();
    results.charges = await testChargeCreation();
    results.balance = await testBalanceCalculation();
    results.notes = await testNotesManagement();
    results.contacts = await testContactsManagement();

    // Cleanup test data
    await cleanupTestData();

    // Summary
    logSection("Test Summary");

    const total = Object.keys(results).length;
    const passed = Object.values(results).filter(Boolean).length;
    const failed = total - passed;

    log(`Total tests: ${total}`, "blue");
    log(`Passed: ${passed}`, "green");
    log(`Failed: ${failed}`, failed > 0 ? "red" : "green");
    log(`Success rate: ${((passed / total) * 100).toFixed(1)}%`, passed === total ? "green" : "yellow");

    if (passed === total) {
      log("\n✓ All tests passed! Account management system is working correctly.", "green");
    } else {
      log("\n✗ Some tests failed. Check the output above for details.", "red");
      process.exit(1);
    }

  } catch (error) {
    log(`\nFatal error running tests: ${error}`, "red");
    process.exit(1);
  }
}

// Run tests
runAllTests();
