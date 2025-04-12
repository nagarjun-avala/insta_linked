import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      name: "Jane Doe",
      email: "jane@example.com",
      image: "https://i.pravatar.cc/150?img=10",
      bio: "Building things one bug at a time.",
      headline: "Full Stack Developer",
      experiences: [
        { title: "Dev", company: "Google", startDate: "2020", endDate: "2022" },
        { title: "Lead Dev", company: "Meta", startDate: "2022" }
      ],
      settings: {
        publicProfile: true,
        showEmail: false,
        newPostNotifications: true
      }
    }
  });

  await prisma.post.create({
    data: {
      content: "Hello world! 👋",
      type: "social",
      authorId: user.id,
      authorName: user.name,
      authorImage: user.image
    }
  });
}

main().then(() => {
  console.log("Seeded 🌱");
  prisma.$disconnect();
}).catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
