import { ActivityAction, Priority, Role, TaskStatus } from "@prisma/client";
import { prisma } from "../src/db/prisma";
import { hashPassword } from "../src/utils/password";
import {
  buildCreatedMessage,
  buildStatusChangeMessage,
  recordActivity,
} from "../src/modules/activity/activity.service";

const DEMO_PASSWORD = "Password123!";

function daysFromNow(offset: number): Date {
  return new Date(Date.now() + offset * 86_400_000);
}

// Order matters: the previous status a task "came from" for the one
// synthetic history entry we log per non-TODO task.
const PREVIOUS_STATUS: Record<TaskStatus, TaskStatus | null> = {
  TODO: null,
  IN_PROGRESS: TaskStatus.TODO,
  IN_REVIEW: TaskStatus.IN_PROGRESS,
  DONE: TaskStatus.IN_REVIEW,
};

interface TaskSeed {
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDateOffsetDays: number;
  assignedToIndex: number; // index into the `developers` array
}

interface ProjectSeed {
  name: string;
  description: string;
  clientIndex: number; // index into the `clients` array
  pmIndex: number; // index into the `pms` array
  tasks: TaskSeed[];
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating users...");
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  const admin = await prisma.user.create({
    data: { name: "Aayush Arya", email: "admin@agency.dev", passwordHash, role: Role.ADMIN },
  });

  const pms = await Promise.all(
    [
      { name: "Priya Nair", email: "pm1@agency.dev" },
      { name: "Marcus Chen", email: "pm2@agency.dev" },
    ].map((u) => prisma.user.create({ data: { ...u, passwordHash, role: Role.PM } }))
  );

  const developers = await Promise.all(
    [
      { name: "Ravi Shankar", email: "dev1@agency.dev" },
      { name: "Elena Petrova", email: "dev2@agency.dev" },
      { name: "Jamal Okafor", email: "dev3@agency.dev" },
      { name: "Sofia Alvarez", email: "dev4@agency.dev" },
    ].map((u) => prisma.user.create({ data: { ...u, passwordHash, role: Role.DEVELOPER } }))
  );

  console.log("Creating clients...");
  const clients = await Promise.all(
    [{ name: "Northwind Retail", contact: "ops@northwind-retail.example" }, { name: "Vertex Health", contact: "it@vertexhealth.example" }].map(
      (c) => prisma.client.create({ data: c })
    )
  );

  const projectSeeds: ProjectSeed[] = [
    {
      name: "Northwind Website Revamp",
      description: "Full redesign and rebuild of the Northwind Retail storefront.",
      clientIndex: 0,
      pmIndex: 0,
      tasks: [
        { title: "Set up design system tokens", description: "Colors, type scale, spacing tokens in Figma + code.", status: TaskStatus.DONE, priority: Priority.LOW, dueDateOffsetDays: -10, assignedToIndex: 0 },
        { title: "Build homepage hero section", description: "Responsive hero with campaign banner slots.", status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, dueDateOffsetDays: 3, assignedToIndex: 0 },
        { title: "Integrate CMS for blog", description: "Headless CMS wiring for the content team.", status: TaskStatus.TODO, priority: Priority.MEDIUM, dueDateOffsetDays: 10, assignedToIndex: 1 },
        { title: "Fix mobile nav overlap bug", description: "Nav drawer overlaps the search bar on iOS Safari.", status: TaskStatus.IN_REVIEW, priority: Priority.CRITICAL, dueDateOffsetDays: 1, assignedToIndex: 1 },
        { title: "Write checkout flow tests", description: "E2E coverage for cart -> payment -> confirmation.", status: TaskStatus.TODO, priority: Priority.MEDIUM, dueDateOffsetDays: -2, assignedToIndex: 0 },
        { title: "Optimize image loading", description: "Lazy-load + responsive srcset for product images.", status: TaskStatus.IN_PROGRESS, priority: Priority.LOW, dueDateOffsetDays: 14, assignedToIndex: 1 },
      ],
    },
    {
      name: "Vertex Patient Portal",
      description: "Patient-facing appointment and messaging portal.",
      clientIndex: 1,
      pmIndex: 0,
      tasks: [
        { title: "Design patient dashboard wireframes", description: "Low-fi wireframes for the post-login dashboard.", status: TaskStatus.DONE, priority: Priority.MEDIUM, dueDateOffsetDays: -15, assignedToIndex: 2 },
        { title: "Implement appointment booking API", description: "CRUD + availability logic for bookings.", status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, dueDateOffsetDays: 5, assignedToIndex: 2 },
        { title: "HIPAA compliance review", description: "Third-party audit checklist for PHI handling.", status: TaskStatus.TODO, priority: Priority.CRITICAL, dueDateOffsetDays: 2, assignedToIndex: 3 },
        { title: "Patient messaging notifications", description: "Email + SMS delivery for new provider messages.", status: TaskStatus.IN_REVIEW, priority: Priority.HIGH, dueDateOffsetDays: 4, assignedToIndex: 2 },
        { title: "Refactor auth token refresh", description: "Consolidate silent-refresh logic on the portal frontend.", status: TaskStatus.TODO, priority: Priority.HIGH, dueDateOffsetDays: -1, assignedToIndex: 3 },
        { title: "Accessibility audit", description: "WCAG 2.1 AA pass across all patient-facing screens.", status: TaskStatus.TODO, priority: Priority.LOW, dueDateOffsetDays: 20, assignedToIndex: 2 },
      ],
    },
    {
      name: "Vertex Mobile App",
      description: "Companion mobile app for the Vertex Health patient portal.",
      clientIndex: 1,
      pmIndex: 1,
      tasks: [
        { title: "Set up React Native project scaffold", description: "Base app shell, navigation, CI build pipeline.", status: TaskStatus.DONE, priority: Priority.MEDIUM, dueDateOffsetDays: -20, assignedToIndex: 1 },
        { title: "Push notification integration", description: "APNs + FCM wiring through a shared service.", status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, dueDateOffsetDays: 6, assignedToIndex: 3 },
        { title: "Offline mode caching", description: "Cache last-viewed appointments for offline access.", status: TaskStatus.TODO, priority: Priority.HIGH, dueDateOffsetDays: 8, assignedToIndex: 0 },
        { title: "App store submission checklist", description: "Screenshots, privacy labels, review notes.", status: TaskStatus.TODO, priority: Priority.CRITICAL, dueDateOffsetDays: -3, assignedToIndex: 2 },
        { title: "Biometric login support", description: "Face ID / fingerprint unlock for returning users.", status: TaskStatus.IN_REVIEW, priority: Priority.MEDIUM, dueDateOffsetDays: 5, assignedToIndex: 3 },
        { title: "Crash reporting setup", description: "Wire up crash + ANR reporting before beta.", status: TaskStatus.TODO, priority: Priority.LOW, dueDateOffsetDays: 12, assignedToIndex: 1 },
      ],
    },
  ];

  console.log("Creating projects and tasks...");
  let overdueCount = 0;
  let activityCount = 0;
  let notificationCount = 0;

  for (const projectSeed of projectSeeds) {
    const pm = pms[projectSeed.pmIndex];
    const project = await prisma.project.create({
      data: {
        name: projectSeed.name,
        description: projectSeed.description,
        clientId: clients[projectSeed.clientIndex].id,
        createdById: pm.id,
      },
    });

    for (const taskSeed of projectSeed.tasks) {
      const dueDate = daysFromNow(taskSeed.dueDateOffsetDays);
      const assignee = developers[taskSeed.assignedToIndex];
      const isOverdue = dueDate < new Date() && taskSeed.status !== TaskStatus.DONE;
      if (isOverdue) overdueCount++;

      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          title: taskSeed.title,
          description: taskSeed.description,
          status: taskSeed.status,
          priority: taskSeed.priority,
          dueDate,
          isOverdue,
          assignedToId: assignee.id,
          createdById: pm.id,
        },
      });

      await recordActivity({
        taskId: task.id,
        projectId: project.id,
        userId: pm.id,
        action: ActivityAction.TASK_CREATED,
        message: buildCreatedMessage(pm.name, task.number, task.title),
      });
      activityCount++;

      // One synthetic "how it got here" history entry for anything not
      // still sitting in To Do, so the feed reads as a real project in
      // progress rather than a pile of just-created tasks.
      const previousStatus = PREVIOUS_STATUS[taskSeed.status];
      if (previousStatus) {
        const actor = taskSeed.status === TaskStatus.DONE ? pm : assignee;
        await recordActivity({
          taskId: task.id,
          projectId: project.id,
          userId: actor.id,
          action: ActivityAction.STATUS_CHANGED,
          fromStatus: previousStatus,
          toStatus: taskSeed.status,
          message: buildStatusChangeMessage(actor.name, task.number, task.title, previousStatus, taskSeed.status),
        });
        activityCount++;
      }

      // Assignment notification - unread for tasks still needing attention
      // (To Do / In Review), already-seen for ones the developer has clearly
      // acted on (In Progress / Done). Keeps the seeded badge counts realistic.
      await prisma.notification.create({
        data: {
          userId: assignee.id,
          type: "TASK_ASSIGNED",
          message: `You were assigned to Task #${task.number}: "${task.title}"`,
          relatedTaskId: task.id,
          isRead: taskSeed.status === TaskStatus.IN_PROGRESS || taskSeed.status === TaskStatus.DONE,
        },
      });
      notificationCount++;

      if (taskSeed.status === TaskStatus.IN_REVIEW) {
        await prisma.notification.create({
          data: {
            userId: pm.id,
            type: "TASK_IN_REVIEW",
            message: `Task #${task.number}: "${task.title}" was moved to In Review by ${assignee.name}`,
            relatedTaskId: task.id,
            isRead: false,
          },
        });
        notificationCount++;
      }

      if (isOverdue) {
        for (const recipientId of new Set([pm.id, assignee.id])) {
          await prisma.notification.create({
            data: {
              userId: recipientId,
              type: "TASK_OVERDUE",
              message: `Task #${task.number}: "${task.title}" is now overdue`,
              relatedTaskId: task.id,
              isRead: false,
            },
          });
          notificationCount++;
        }
      }
    }
  }

  console.log("\nSeed complete:");
  console.log(`  Users:          1 admin, ${pms.length} PMs, ${developers.length} developers`);
  console.log(`  Clients:        ${clients.length}`);
  console.log(`  Projects:       ${projectSeeds.length}`);
  console.log(`  Tasks:          ${projectSeeds.reduce((n, p) => n + p.tasks.length, 0)} (${overdueCount} already overdue)`);
  console.log(`  Activity log:   ${activityCount} entries`);
  console.log(`  Notifications:  ${notificationCount} entries`);
  console.log(`\nDemo login password for every seeded account: ${DEMO_PASSWORD}`);
  console.log(`  Admin:      ${admin.email}`);
  console.log(`  PMs:        ${pms.map((p) => p.email).join(", ")}`);
  console.log(`  Developers: ${developers.map((d) => d.email).join(", ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
