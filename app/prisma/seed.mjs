import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const aliceId = "mock-alice-user";
const jordanId = "mock-jordan-user";
const householdId = "mock-household";
const listId = "mock-todolist";
const mockEmails = ["alice.mock@example.com", "jordan.mock@example.com"];

const developerUser = {
  id: "test-user",
  name: "Test User",
  email: "aaryannayar1@gmail.com"
};

const mockExpenseTemplates = [
  { title: "Weekly grocery run", amount: "86.42", category: "Groceries", paidById: aliceId, createdById: aliceId, monthOffset: 11, split: "shared" },
  { title: "Electricity bill", amount: "112.80", category: "Utilities", paidById: aliceId, createdById: aliceId, monthOffset: 10, split: "shared" },
  { title: "Coffee and breakfast", amount: "18.75", category: "Entertainment", paidById: jordanId, createdById: aliceId, monthOffset: 10, split: "alice" },
  { title: "Household supplies", amount: "47.36", category: "Groceries", paidById: aliceId, createdById: aliceId, monthOffset: 9, split: "shared" },
  { title: "Internet bill", amount: "65.00", category: "Utilities", paidById: aliceId, createdById: aliceId, monthOffset: 8, split: "shared" },
  { title: "Train tickets", amount: "42.50", category: "Transport", paidById: jordanId, createdById: aliceId, monthOffset: 8, split: "jordan" },
  { title: "Dinner out", amount: "73.20", category: "Entertainment", paidById: aliceId, createdById: aliceId, monthOffset: 7, split: "shared" },
  { title: "Cleaning supplies", amount: "29.90", category: "Groceries", paidById: jordanId, createdById: aliceId, monthOffset: 6, split: "alice" },
  { title: "Water bill", amount: "38.40", category: "Utilities", paidById: aliceId, createdById: aliceId, monthOffset: 6, split: "shared" },
  { title: "Weekend groceries", amount: "94.18", category: "Groceries", paidById: jordanId, createdById: aliceId, monthOffset: 5, split: "shared" },
  { title: "Home repair parts", amount: "57.65", category: "Other", paidById: aliceId, createdById: aliceId, monthOffset: 4, split: "jordan" },
  { title: "Monthly rent", amount: "1450.00", category: "Rent", paidById: aliceId, createdById: aliceId, monthOffset: 3, split: "shared" },
  { title: "Pharmacy essentials", amount: "24.37", category: "Other", paidById: jordanId, createdById: jordanId, monthOffset: 11, split: "jordan" },
  { title: "Gas for the car", amount: "51.80", category: "Transport", paidById: jordanId, createdById: jordanId, monthOffset: 10, split: "shared" },
  { title: "Streaming subscription", amount: "16.99", category: "Entertainment", paidById: jordanId, createdById: jordanId, monthOffset: 9, split: "jordan" },
  { title: "Market groceries", amount: "68.43", category: "Groceries", paidById: aliceId, createdById: jordanId, monthOffset: 8, split: "shared" },
  { title: "Heating bill", amount: "124.70", category: "Utilities", paidById: jordanId, createdById: jordanId, monthOffset: 7, split: "shared" },
  { title: "Parking", amount: "14.00", category: "Transport", paidById: aliceId, createdById: jordanId, monthOffset: 6, split: "alice" },
  { title: "Dinner ingredients", amount: "39.26", category: "Groceries", paidById: jordanId, createdById: jordanId, monthOffset: 5, split: "shared" },
  { title: "Furniture delivery", amount: "89.00", category: "Other", paidById: jordanId, createdById: jordanId, monthOffset: 4, split: "jordan" },
  { title: "Monthly rent", amount: "1450.00", category: "Rent", paidById: jordanId, createdById: jordanId, monthOffset: 2, split: "shared" },
  { title: "Garden supplies", amount: "33.58", category: "Other", paidById: jordanId, createdById: jordanId, monthOffset: 0, split: "shared" },
];

function getExpenseDate(monthOffset, day) {
  const date = new Date();
  date.setUTCDate(1);
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCMonth(date.getUTCMonth() - monthOffset);
  date.setUTCDate(day);
  return date;
}

function getExpenseSplits(amount, split) {
  if (split === "alice" || split === "jordan") {
    return [{
      userId: split === "alice" ? aliceId : jordanId,
      percentage: "100.00",
      amountOwed: amount,
    }];
  }

  const cents = Math.round(Number(amount) * 100);
  const aliceCents = Math.floor(cents / 2);
  const jordanCents = cents - aliceCents;
  return [
    {
      userId: aliceId,
      percentage: "50.00",
      amountOwed: (aliceCents / 100).toFixed(2),
    },
    {
      userId: jordanId,
      percentage: "50.00",
      amountOwed: (jordanCents / 100).toFixed(2),
    },
  ];
}

async function main() {
  await prisma.taskComment.deleteMany({
    where: { todoItem: { list: { title: "Weekly ToDos" } } },
  });
  await prisma.todoItem.deleteMany({ where: { list: { title: "Weekly ToDos" } } });
  await prisma.todoList.deleteMany({ where: { title: "Weekly ToDos" } });
  await prisma.householdMember.deleteMany({
    where: { household: { name: "Mock Household" } },
  });
  await prisma.household.deleteMany({ where: { name: "Mock Household" } });
  await prisma.user.deleteMany({ where: { email: { in: mockEmails } } });

  await prisma.user.createMany({
    data: [
      { id: aliceId, name: "Alice Brown", email: "alice.mock@example.com" },
      { id: jordanId, name: "Jordan Smith", email: "jordan.mock@example.com" },
    ],
  });

  const seededDeveloperUser = await prisma.user.upsert({
    where: { email: developerUser.email },
    update: { name: developerUser.name },
    create: developerUser,
  });

  await prisma.household.create({
    data: {
      id: householdId,
      name: "Mock Household",
      members: { create: [{ userId: aliceId }, { userId: jordanId }, { userId: seededDeveloperUser.id }] },
      todoLists: {
        create: {
          id: listId,
          title: "Weekly ToDos",
          items: {
            create: [
              {
                id: "mock-task-groceries",
                title: "Plan the weekend groceries",
                description: "Make a list of essentials before the Saturday shop.",
                status: "TODO",
                priority: "MEDIUM",
                createdById: aliceId,
                assignedToId: aliceId,
              },
              {
                id: "mock-task-boiler",
                title: "Schedule boiler inspection",
                description: "Call the building manager and confirm a time.",
                status: "INPROGRESS",
                priority: "HIGH",
                createdById: jordanId,
                assignedToId: jordanId,
              },
              {
                id: "mock-task-budget",
                title: "Update monthly budget",
                description: "Review the shared expenses from last month.",
                status: "DONE",
                priority: "LOW",
                createdById: aliceId,
                assignedToId: aliceId,
                lastEditedById: jordanId,
                comments: {
                  create: {
                    content: "Reviewed the shared expenses and marked this complete.",
                    createdById: jordanId,
                  },
                },
              },
            ],
          },
        },
      },
    },
  });

  await prisma.expense.createMany({
    data: mockExpenseTemplates.map((expense, index) => ({
      id: `mock-expense-${index + 1}`,
      householdId,
      title: expense.title,
      totalAmount: expense.amount,
      paidById: expense.paidById,
      createdById: expense.createdById,
      category: expense.category,
      expenseDate: getExpenseDate(expense.monthOffset, (index % 25) + 1),
    })),
  });

  for (const [index, expense] of mockExpenseTemplates.entries()) {
    await prisma.expenseSplit.createMany({
      data: getExpenseSplits(expense.amount, expense.split).map((split) => ({
        expenseId: `mock-expense-${index + 1}`,
        ...split,
      })),
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });