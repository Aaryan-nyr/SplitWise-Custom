import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

dotenv.config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const aliceId = uuidv4();
const jordanId = uuidv4();
const householdId = uuidv4();
const listId = uuidv4();

async function main() {
  await prisma.taskComment.deleteMany({ where: { todoItem: { listId } } });
  await prisma.todoItem.deleteMany({ where: { listId } });
  await prisma.todoList.deleteMany({ where: { id: listId } });
  await prisma.householdMember.deleteMany({ where: { householdId } });
  await prisma.household.deleteMany({ where: { id: householdId } });
  await prisma.user.deleteMany({ where: { id: { in: [aliceId, jordanId] } } });

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