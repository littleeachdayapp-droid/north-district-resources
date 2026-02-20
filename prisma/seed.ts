import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.loan.deleteMany();
  await prisma.loanRequest.deleteMany();
  await prisma.resourceTag.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
  await prisma.church.deleteMany();

  // === Churches ===
  const churches = await Promise.all([
    prisma.church.create({
      data: {
        name: "First UMC Austin",
        nameEs: "Primera IMU Austin",
        address: "1300 Lavaca St",
        city: "Austin",
        state: "TX",
        zip: "78701",
        phone: "(512) 555-0101",
        email: "office@firstumcaustin.org",
        pastor: "Rev. Sarah Mitchell",
      },
    }),
    prisma.church.create({
      data: {
        name: "Covenant UMC",
        nameEs: "IMU del Pacto",
        address: "4410 Duval Rd",
        city: "Austin",
        state: "TX",
        zip: "78727",
        phone: "(512) 555-0102",
        email: "office@covenantumc.org",
        pastor: "Rev. David Chen",
      },
    }),
    prisma.church.create({
      data: {
        name: "St. John's UMC Georgetown",
        nameEs: "IMU San Juan Georgetown",
        address: "311 E University Ave",
        city: "Georgetown",
        state: "TX",
        zip: "78626",
        phone: "(512) 555-0103",
        email: "office@stjohnsgtown.org",
        pastor: "Rev. Maria Rodriguez",
      },
    }),
    prisma.church.create({
      data: {
        name: "Grace UMC Round Rock",
        nameEs: "IMU de Gracia Round Rock",
        address: "1200 E Palm Valley Blvd",
        city: "Round Rock",
        state: "TX",
        zip: "78664",
        phone: "(512) 555-0104",
        email: "office@graceumcrr.org",
        pastor: "Rev. James Walker",
      },
    }),
  ]);

  const [firstUMC, covenant, stJohns, grace] = churches;

  // === Tags ===
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: "Advent", nameEs: "Adviento", category: "BOTH" },
    }),
    prisma.tag.create({
      data: { name: "Lent", nameEs: "Cuaresma", category: "BOTH" },
    }),
    prisma.tag.create({
      data: {
        name: "Easter",
        nameEs: "Pascua de Resurrección",
        category: "BOTH",
      },
    }),
    prisma.tag.create({
      data: {
        name: "Contemporary",
        nameEs: "Contemporáneo",
        category: "MUSIC",
      },
    }),
    prisma.tag.create({
      data: { name: "Traditional", nameEs: "Tradicional", category: "MUSIC" },
    }),
    prisma.tag.create({
      data: { name: "Bilingual", nameEs: "Bilingüe", category: "BOTH" },
    }),
    prisma.tag.create({
      data: {
        name: "Short-term",
        nameEs: "Corto plazo",
        category: "STUDY",
      },
    }),
    prisma.tag.create({
      data: { name: "Youth", nameEs: "Jóvenes", category: "BOTH" },
    }),
    prisma.tag.create({
      data: { name: "Adult", nameEs: "Adultos", category: "STUDY" },
    }),
    prisma.tag.create({
      data: { name: "Wesleyan", nameEs: "Wesleyano", category: "BOTH" },
    }),
  ]);

  const [
    advent,
    lent,
    easter,
    contemporary,
    traditional,
    bilingual,
    shortTerm,
    youth,
    adult,
    wesleyan,
  ] = tags;

  // === Resources ===
  const resources = await Promise.all([
    // Music resources
    prisma.resource.create({
      data: {
        churchId: firstUMC.id,
        category: "MUSIC",
        title: "The United Methodist Hymnal",
        titleEs: "El Himnario Metodista Unido",
        authorComposer: "The United Methodist Publishing House",
        publisher: "Abingdon Press",
        description:
          "Standard UMC hymnal, 1989 edition. 20 copies in good condition.",
        subcategory: "HYMNAL",
        format: "BOOK",
        quantity: 20,
        maxLoanWeeks: 12,
        tags: {
          create: [
            { tagId: traditional.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: firstUMC.id,
        category: "MUSIC",
        title: "The Faith We Sing",
        titleEs: "La Fe Que Cantamos",
        authorComposer: "Various",
        publisher: "Abingdon Press",
        description:
          "Supplemental hymnal with contemporary and global songs. 15 copies.",
        subcategory: "HYMNAL",
        format: "BOOK",
        quantity: 15,
        maxLoanWeeks: 12,
        tags: {
          create: [
            { tagId: contemporary.id },
            { tagId: bilingual.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: covenant.id,
        category: "MUSIC",
        title: "Night of the Father's Love",
        authorComposer: "Pepper Choplin",
        publisher: "Lorenz Publishing",
        description:
          "Christmas cantata for SATB choir with optional narration. Includes accompaniment CD.",
        subcategory: "CANTATA",
        format: "KIT",
        quantity: 1,
        maxLoanWeeks: 8,
        tags: {
          create: [
            { tagId: advent.id },
            { tagId: traditional.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: covenant.id,
        category: "MUSIC",
        title: "Ring Praise! — Handbell Collection Vol. 3",
        authorComposer: "Various",
        publisher: "Agape",
        description:
          "Collection of handbell arrangements for 3-5 octave choirs. Intermediate level.",
        subcategory: "HANDBELL",
        format: "SHEET",
        quantity: 1,
        maxLoanWeeks: 6,
        tags: {
          create: [{ tagId: traditional.id }],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: stJohns.id,
        category: "MUSIC",
        title: "Festival of Lessons and Carols",
        authorComposer: "arr. John Rutter",
        publisher: "Oxford University Press",
        description:
          "Complete service of nine lessons and carols for choir and congregation.",
        subcategory: "CHOIR_ANTHEM",
        format: "SHEET",
        quantity: 30,
        maxLoanWeeks: 4,
        tags: {
          create: [
            { tagId: advent.id },
            { tagId: traditional.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: stJohns.id,
        category: "MUSIC",
        title: "Canción Nueva — Bilingual Worship Songs",
        titleEs: "Canción Nueva — Cantos Bilingües de Adoración",
        authorComposer: "Various Latin American composers",
        publisher: "GIA Publications",
        description:
          "Collection of bilingual worship songs from across Latin America and the US Hispanic community.",
        subcategory: "SHEET_MUSIC",
        format: "BOOK",
        quantity: 10,
        maxLoanWeeks: 8,
        tags: {
          create: [
            { tagId: contemporary.id },
            { tagId: bilingual.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: grace.id,
        category: "MUSIC",
        title: "Were You There — Lenten Anthem Set",
        authorComposer: "arr. Moses Hogan",
        publisher: "Hal Leonard",
        description:
          "Set of 6 Lenten anthems for SATB choir. Spirituals and traditional hymn arrangements.",
        subcategory: "CHOIR_ANTHEM",
        format: "SHEET",
        quantity: 25,
        maxLoanWeeks: 6,
        tags: {
          create: [
            { tagId: lent.id },
            { tagId: traditional.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: grace.id,
        category: "MUSIC",
        title: "Resurrection Day — Easter Cantata",
        authorComposer: "Lloyd Larson",
        publisher: "Lorenz Publishing",
        description:
          "Easter cantata celebrating the resurrection. SATB with piano and optional brass.",
        subcategory: "CANTATA",
        format: "KIT",
        quantity: 1,
        maxLoanWeeks: 6,
        tags: {
          create: [
            { tagId: easter.id },
            { tagId: traditional.id },
          ],
        },
      },
    }),

    // Study resources
    prisma.resource.create({
      data: {
        churchId: firstUMC.id,
        category: "STUDY",
        title: "Disciple I: Becoming Disciples Through Bible Study",
        titleEs: "Discípulo I: Formando Discípulos a Través del Estudio Bíblico",
        authorComposer: "Richard B. Wilke",
        publisher: "Abingdon Press",
        description:
          "34-week overview of the entire Bible. Includes leader guide and participant materials for 12.",
        subcategory: "BIBLE_STUDY",
        format: "KIT",
        quantity: 1,
        maxLoanWeeks: 40,
        tags: {
          create: [
            { tagId: adult.id },
            { tagId: wesleyan.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: firstUMC.id,
        category: "STUDY",
        title: "The Walk: Five Essential Practices of the Christian Life",
        authorComposer: "Adam Hamilton",
        publisher: "Abingdon Press",
        description:
          "5-week study on worship, study, serve, give, and share. DVD + leader guide + 8 participant books.",
        subcategory: "CURRICULUM_KIT",
        format: "KIT",
        quantity: 1,
        maxLoanWeeks: 8,
        tags: {
          create: [
            { tagId: adult.id },
            { tagId: shortTerm.id },
            { tagId: wesleyan.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: covenant.id,
        category: "STUDY",
        title: "24 Hours That Changed the World",
        authorComposer: "Adam Hamilton",
        publisher: "Abingdon Press",
        description:
          "Lenten study retracing the final 24 hours of Jesus' life. DVD + leader guide + 10 books.",
        subcategory: "CURRICULUM_KIT",
        format: "KIT",
        quantity: 1,
        maxLoanWeeks: 8,
        tags: {
          create: [
            { tagId: lent.id },
            { tagId: adult.id },
            { tagId: shortTerm.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: covenant.id,
        category: "STUDY",
        title: "Three Simple Rules: A Wesleyan Way of Living",
        authorComposer: "Rueben P. Job",
        publisher: "Abingdon Press",
        description:
          "Short study based on John Wesley's General Rules. Great for new member classes.",
        subcategory: "BOOK",
        format: "BOOK",
        quantity: 12,
        maxLoanWeeks: 6,
        tags: {
          create: [
            { tagId: shortTerm.id },
            { tagId: wesleyan.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: stJohns.id,
        category: "STUDY",
        title: "Faithful: Christmas Through the Eyes of Joseph",
        authorComposer: "Adam Hamilton",
        publisher: "Abingdon Press",
        description:
          "4-week Advent study. DVD + leader guide + 6 participant books.",
        subcategory: "CURRICULUM_KIT",
        format: "KIT",
        quantity: 1,
        maxLoanWeeks: 6,
        tags: {
          create: [
            { tagId: advent.id },
            { tagId: adult.id },
            { tagId: shortTerm.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: stJohns.id,
        category: "STUDY",
        title: "Youth Alpha",
        authorComposer: "Alpha International",
        publisher: "Alpha International",
        description:
          "10-session youth program exploring life and faith. Includes video series and leader materials.",
        subcategory: "YOUTH_CURRICULUM",
        format: "KIT",
        quantity: 1,
        maxLoanWeeks: 12,
        tags: {
          create: [{ tagId: youth.id }],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: grace.id,
        category: "STUDY",
        title: "Disciple II: Into the Word, Into the World",
        authorComposer: "Richard B. Wilke & Julia Kitchens Wilke",
        publisher: "Abingdon Press",
        description:
          "32-week study focusing on Genesis, Exodus, Luke, and Acts. Materials for 12.",
        subcategory: "BIBLE_STUDY",
        format: "KIT",
        quantity: 1,
        maxLoanWeeks: 36,
        tags: {
          create: [
            { tagId: adult.id },
            { tagId: wesleyan.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: grace.id,
        category: "STUDY",
        title: "Vida Nueva — New Life in Christ (Bilingual)",
        titleEs: "Vida Nueva en Cristo (Bilingüe)",
        authorComposer: "GBOD",
        publisher: "Discipleship Resources",
        description:
          "Bilingual new member study for Hispanic/multicultural congregations. 8 sessions.",
        subcategory: "CURRICULUM_KIT",
        format: "KIT",
        quantity: 1,
        maxLoanWeeks: 10,
        tags: {
          create: [
            { tagId: bilingual.id },
            { tagId: shortTerm.id },
            { tagId: wesleyan.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: firstUMC.id,
        category: "STUDY",
        title: "The Wesley Challenge",
        authorComposer: "Chris Folmsbee",
        publisher: "Abingdon Press",
        description:
          "21-day devotional based on questions John Wesley asked himself and his accountability groups.",
        subcategory: "DEVOTIONAL",
        format: "BOOK",
        quantity: 8,
        maxLoanWeeks: 4,
        tags: {
          create: [
            { tagId: shortTerm.id },
            { tagId: wesleyan.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: covenant.id,
        category: "MUSIC",
        title: "Worship & Song — Pew Edition",
        titleEs: "Adoración y Canción",
        authorComposer: "Various",
        publisher: "Abingdon Press",
        description:
          "Newer supplemental hymnal/songbook for UMC congregations. 12 copies.",
        subcategory: "HYMNAL",
        format: "BOOK",
        quantity: 12,
        maxLoanWeeks: 12,
        tags: {
          create: [
            { tagId: contemporary.id },
          ],
        },
      },
    }),
    prisma.resource.create({
      data: {
        churchId: grace.id,
        category: "STUDY",
        title: "Deep Blue Kids Bible",
        authorComposer: "Common English Bible",
        publisher: "Abingdon Press",
        description:
          "CEB translation designed for children ages 7-12. 6 copies for Sunday school.",
        subcategory: "CHILDREN_CURRICULUM",
        format: "BOOK",
        quantity: 6,
        maxLoanWeeks: 8,
        tags: {
          create: [{ tagId: youth.id }],
        },
      },
    }),
  ]);

  // === Users ===
  const passwordHash = hashSync("password123", 10);
  const adminHash = hashSync("admin123", 10);

  await Promise.all([
    prisma.user.create({
      data: {
        churchId: firstUMC.id,
        username: "editor_first",
        passwordHash,
        displayName: "Sarah's Editor",
        role: "EDITOR",
      },
    }),
    prisma.user.create({
      data: {
        churchId: covenant.id,
        username: "editor_covenant",
        passwordHash,
        displayName: "David's Editor",
        role: "EDITOR",
      },
    }),
    prisma.user.create({
      data: {
        churchId: stJohns.id,
        username: "editor_stjohns",
        passwordHash,
        displayName: "Maria's Editor",
        role: "EDITOR",
      },
    }),
    prisma.user.create({
      data: {
        churchId: grace.id,
        username: "editor_grace",
        passwordHash,
        displayName: "James's Editor",
        role: "EDITOR",
      },
    }),
    prisma.user.create({
      data: {
        username: "admin",
        passwordHash: adminHash,
        displayName: "District Admin",
        role: "ADMIN",
      },
    }),
  ]);

  // === Sample Loans and Requests ===
  // Active loan: Grace borrows Disciple I from First UMC
  const activeRequest = await prisma.loanRequest.create({
    data: {
      resourceId: resources[8].id, // Disciple I
      requestingChurchId: grace.id,
      status: "APPROVED",
      message: "We'd like to start a Disciple I group this fall.",
      responseMessage: "Happy to share! Please return by end of semester.",
    },
  });

  await prisma.loan.create({
    data: {
      resourceId: resources[8].id,
      loanRequestId: activeRequest.id,
      borrowingChurchId: grace.id,
      lendingChurchId: firstUMC.id,
      startDate: new Date("2025-09-01"),
      dueDate: new Date("2026-05-15"),
      status: "ACTIVE",
    },
  });

  // Mark resource as on loan
  await prisma.resource.update({
    where: { id: resources[8].id },
    data: { availabilityStatus: "ON_LOAN" },
  });

  // Overdue loan: St. John's borrows Christmas cantata from Covenant
  await prisma.loan.create({
    data: {
      resourceId: resources[2].id, // Night of the Father's Love
      borrowingChurchId: stJohns.id,
      lendingChurchId: covenant.id,
      startDate: new Date("2025-11-01"),
      dueDate: new Date("2025-12-30"),
      status: "OVERDUE",
    },
  });

  await prisma.resource.update({
    where: { id: resources[2].id },
    data: { availabilityStatus: "ON_LOAN" },
  });

  // Returned loan
  await prisma.loan.create({
    data: {
      resourceId: resources[6].id, // Were You There
      borrowingChurchId: covenant.id,
      lendingChurchId: grace.id,
      startDate: new Date("2025-02-15"),
      dueDate: new Date("2025-04-15"),
      returnDate: new Date("2025-04-10"),
      status: "RETURNED",
    },
  });

  // Pending request: First UMC wants to borrow Youth Alpha from St. John's
  await prisma.loanRequest.create({
    data: {
      resourceId: resources[13].id, // Youth Alpha
      requestingChurchId: firstUMC.id,
      status: "PENDING",
      message:
        "We're starting a youth program and would love to try the Alpha series.",
    },
  });

  console.log("Seed complete!");
  console.log(`  ${churches.length} churches`);
  console.log(`  ${tags.length} tags`);
  console.log(`  ${resources.length} resources`);
  console.log("  5 users");
  console.log("  3 loans + 2 loan requests");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
