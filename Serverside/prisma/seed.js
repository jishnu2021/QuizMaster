const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN'
    }
  });
  
  console.log('Admin user created:', admin);
  
  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      role: 'USER'
    }
  });
  
  console.log('Regular user created:', user);
  
  // Create a sample quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: 'Sample JavaScript Quiz',
      topic: 'JavaScript',
      questions: {
        create: [
          {
            text: 'What is JavaScript?',
            answerIdx: 2,
            options: {
              create: [
                { text: 'A coffee brand' },
                { text: 'A type of computer' },
                { text: 'A programming language' },
                { text: 'An operating system' }
              ]
            }
          },
          {
            text: 'Which symbol is used for comments in JavaScript?',
            answerIdx: 0,
            options: {
              create: [
                { text: '//' },
                { text: '<!-- -->' },
                { text: '#' },
                { text: '%%' }
              ]
            }
          }
        ]
      }
    }
  });
  
  console.log('Sample quiz created:', quiz);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });