import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 12);

  // Create users
  const admin = await prisma.user.create({
    data: { name: 'Nitin Admin', email: 'nitin@taskforge.com', password, role: 'ADMIN' },
  });
  const alice = await prisma.user.create({
    data: { name: 'Alice Johnson', email: 'alice@taskforge.com', password, role: 'MEMBER' },
  });
  const bob = await prisma.user.create({
    data: { name: 'Bob Williams', email: 'bob@taskforge.com', password, role: 'MEMBER' },
  });
  const carol = await prisma.user.create({
    data: { name: 'Carol Davis', email: 'carol@taskforge.com', password, role: 'MEMBER' },
  });

  console.log('✅ Created 4 users');

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: 'E-Commerce Redesign', description: 'Complete redesign of the e-commerce platform with modern UI/UX',
      ownerId: admin.id,
      members: { create: [
        { userId: admin.id, role: 'ADMIN' },
        { userId: alice.id, role: 'MEMBER' },
        { userId: bob.id, role: 'MEMBER' },
      ]},
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App v2', description: 'React Native mobile application for iOS and Android',
      ownerId: admin.id,
      members: { create: [
        { userId: admin.id, role: 'ADMIN' },
        { userId: carol.id, role: 'ADMIN' },
        { userId: alice.id, role: 'MEMBER' },
      ]},
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'API Gateway', description: 'Centralized API gateway with rate limiting and auth',
      ownerId: admin.id,
      members: { create: [
        { userId: admin.id, role: 'ADMIN' },
        { userId: bob.id, role: 'MEMBER' },
      ]},
    },
  });

  console.log('✅ Created 3 projects');

  // Helper for past dates
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);
  const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000);

  // Tasks for Project 1
  const tasks1 = [
    { title: 'Design Homepage Mockup', description: 'Create high-fidelity mockups', status: 'DONE', priority: 'HIGH', dueDate: daysAgo(3), assigneeId: alice.id },
    { title: 'Implement Product Grid', description: 'Build responsive product listing', status: 'DONE', priority: 'HIGH', dueDate: daysAgo(1), assigneeId: bob.id },
    { title: 'Setup Stripe Payments', description: 'Integrate Stripe checkout flow', status: 'IN_PROGRESS', priority: 'CRITICAL', dueDate: daysFromNow(3), assigneeId: admin.id },
    { title: 'Cart & Checkout Flow', description: 'Shopping cart with multi-step checkout', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: daysFromNow(5), assigneeId: alice.id },
    { title: 'Search & Filters', description: 'Implement product search with faceted filters', status: 'TODO', priority: 'MEDIUM', dueDate: daysFromNow(10), assigneeId: bob.id },
    { title: 'User Reviews System', description: 'Star ratings and text reviews', status: 'TODO', priority: 'LOW', dueDate: daysFromNow(14), assigneeId: null },
    { title: 'Order Tracking Page', description: 'Real-time order status tracking', status: 'IN_REVIEW', priority: 'MEDIUM', dueDate: daysFromNow(2), assigneeId: admin.id },
    { title: 'Write API Tests', description: 'Integration tests for all endpoints', status: 'TODO', priority: 'MEDIUM', dueDate: daysAgo(2), assigneeId: bob.id },
  ];

  // Tasks for Project 2
  const tasks2 = [
    { title: 'App Architecture Setup', description: 'Project structure and navigation', status: 'DONE', priority: 'HIGH', dueDate: daysAgo(7), assigneeId: carol.id },
    { title: 'Auth Screens', description: 'Login, signup, forgot password', status: 'DONE', priority: 'HIGH', dueDate: daysAgo(5), assigneeId: alice.id },
    { title: 'Push Notifications', description: 'Firebase cloud messaging integration', status: 'IN_PROGRESS', priority: 'CRITICAL', dueDate: daysFromNow(1), assigneeId: carol.id },
    { title: 'Offline Mode', description: 'Local storage sync for offline usage', status: 'TODO', priority: 'HIGH', dueDate: daysFromNow(7), assigneeId: alice.id },
    { title: 'Dark Mode Support', description: 'Theme switching with system preference', status: 'IN_REVIEW', priority: 'MEDIUM', dueDate: daysFromNow(4), assigneeId: carol.id },
    { title: 'App Store Submission', description: 'Prepare assets and submit to stores', status: 'TODO', priority: 'LOW', dueDate: daysFromNow(21), assigneeId: null },
  ];

  // Tasks for Project 3
  const tasks3 = [
    { title: 'Rate Limiting Middleware', description: 'Token bucket algorithm implementation', status: 'DONE', priority: 'CRITICAL', dueDate: daysAgo(4), assigneeId: bob.id },
    { title: 'JWT Validation', description: 'Centralized JWT verification', status: 'DONE', priority: 'HIGH', dueDate: daysAgo(6), assigneeId: admin.id },
    { title: 'Request Logging', description: 'Structured logging with correlation IDs', status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: daysFromNow(3), assigneeId: bob.id },
    { title: 'API Documentation', description: 'OpenAPI/Swagger spec generation', status: 'TODO', priority: 'MEDIUM', dueDate: daysAgo(1), assigneeId: admin.id },
    { title: 'Load Testing', description: 'Performance testing with k6', status: 'TODO', priority: 'HIGH', dueDate: daysFromNow(6), assigneeId: null },
  ];

  const allTaskData = [
    ...tasks1.map(t => ({ ...t, projectId: project1.id, creatorId: admin.id })),
    ...tasks2.map(t => ({ ...t, projectId: project2.id, creatorId: admin.id })),
    ...tasks3.map(t => ({ ...t, projectId: project3.id, creatorId: admin.id })),
  ];

  for (const t of allTaskData) {
    await prisma.task.create({ data: t });
  }

  console.log(`✅ Created ${allTaskData.length} tasks`);

  // Activity logs spread across 14 days
  const actions = [
    { action: 'PROJECT_CREATED', details: 'Created project "E-Commerce Redesign"', projectId: project1.id, day: 12 },
    { action: 'PROJECT_CREATED', details: 'Created project "Mobile App v2"', projectId: project2.id, day: 11 },
    { action: 'PROJECT_CREATED', details: 'Created project "API Gateway"', projectId: project3.id, day: 10 },
    { action: 'MEMBER_ADDED', details: 'Added Alice Johnson to project', projectId: project1.id, day: 12 },
    { action: 'MEMBER_ADDED', details: 'Added Bob Williams to project', projectId: project1.id, day: 12 },
    { action: 'MEMBER_ADDED', details: 'Added Carol Davis to project', projectId: project2.id, day: 11 },
    { action: 'TASK_CREATED', details: 'Created task "Design Homepage Mockup"', projectId: project1.id, day: 10 },
    { action: 'TASK_CREATED', details: 'Created task "Implement Product Grid"', projectId: project1.id, day: 10 },
    { action: 'TASK_CREATED', details: 'Created task "App Architecture Setup"', projectId: project2.id, day: 9 },
    { action: 'TASK_CREATED', details: 'Created task "Rate Limiting Middleware"', projectId: project3.id, day: 9 },
    { action: 'TASK_UPDATED', details: 'Updated task "Design Homepage Mockup": status → DONE', projectId: project1.id, day: 7 },
    { action: 'TASK_CREATED', details: 'Created task "Setup Stripe Payments"', projectId: project1.id, day: 7 },
    { action: 'TASK_CREATED', details: 'Created task "Push Notifications"', projectId: project2.id, day: 6 },
    { action: 'TASK_UPDATED', details: 'Updated task "App Architecture Setup": status → DONE', projectId: project2.id, day: 5 },
    { action: 'TASK_UPDATED', details: 'Updated task "Auth Screens": status → DONE', projectId: project2.id, day: 4 },
    { action: 'TASK_UPDATED', details: 'Updated task "Rate Limiting Middleware": status → DONE', projectId: project3.id, day: 4 },
    { action: 'TASK_CREATED', details: 'Created task "Cart & Checkout Flow"', projectId: project1.id, day: 3 },
    { action: 'TASK_UPDATED', details: 'Updated task "Implement Product Grid": status → DONE', projectId: project1.id, day: 3 },
    { action: 'TASK_CREATED', details: 'Created task "Request Logging"', projectId: project3.id, day: 2 },
    { action: 'TASK_UPDATED', details: 'Updated task "JWT Validation": status → DONE', projectId: project3.id, day: 2 },
    { action: 'TASK_CREATED', details: 'Created task "Dark Mode Support"', projectId: project2.id, day: 1 },
    { action: 'TASK_UPDATED', details: 'Updated task "Order Tracking Page": status → IN_REVIEW', projectId: project1.id, day: 1 },
    { action: 'TASK_CREATED', details: 'Created task "Load Testing"', projectId: project3.id, day: 0 },
    { action: 'TASK_UPDATED', details: 'Updated task "Dark Mode Support": status → IN_REVIEW', projectId: project2.id, day: 0 },
    { action: 'MEMBER_ADDED', details: 'Added Alice Johnson to Mobile App v2', projectId: project2.id, day: 0 },
  ];

  for (const a of actions) {
    await prisma.activityLog.create({
      data: {
        action: a.action, details: a.details,
        userId: admin.id, projectId: a.projectId,
        createdAt: daysAgo(a.day),
      },
    });
  }

  console.log(`✅ Created ${actions.length} activity logs`);
  console.log('\n🎉 Seed complete! Login with:');
  console.log('   Admin: nitin@taskforge.com / password123');
  console.log('   Member: alice@taskforge.com / password123');
  console.log('   Member: bob@taskforge.com / password123');
  console.log('   Member: carol@taskforge.com / password123');
}

seed()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
