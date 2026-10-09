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

  await prisma.household.create({
    data: {
      id: householdId,
      name: "Mock Household",
      members: { create: [{ userId: aliceId }, { userId: jordanId }] },
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
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });