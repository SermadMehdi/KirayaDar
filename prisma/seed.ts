import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { addMonths, subMonths, setDate } from "date-fns"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function ref(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
}

async function main() {
  // Clear all data
  await prisma.message.deleteMany()
  await prisma.connection.deleteMany()
  await prisma.kirayaScore.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.tenancy.deleteMany()
  await prisma.rentalRequest.deleteMany()
  await prisma.property.deleteMany()
  await prisma.user.deleteMany()

  console.log("Cleared existing data")

  // Landlord
  const ahmad = await prisma.user.create({
    data: {
      phone: "03000000002",
      name: "Ahmad Raza",
      roles: "landlord",
      bio: "Professional property manager with 10+ years experience in Lahore, Karachi & Islamabad.",
      profilePicture: "https://api.dicebear.com/9.x/avataaars/svg?seed=AhmadRaza&backgroundColor=b6e3f4",
      employmentProof: "Director — Raza Properties Pvt Ltd",
      bankStatement: "Meezan Bank account ending 7741",
    },
  })

  // Tenants
  const hamza = await prisma.user.create({
    data: {
      phone: "03000000001",
      name: "Hamza Khan",
      roles: "tenant",
      bio: "Software engineer at a Lahore-based startup. Reliable, professional, loves a quiet home.",
      profilePicture: "https://api.dicebear.com/9.x/avataaars/svg?seed=HamzaKhan&backgroundColor=c0aede",
      employmentProof: "Senior Software Engineer — TechVentures Lahore",
      bankStatement: "HBL account ending 4521",
    },
  })
  const sana = await prisma.user.create({
    data: {
      phone: "03000000003",
      name: "Sana Malik",
      roles: "tenant",
      bio: "Medical student at KEMU. Responsible, non-smoker, looking for long-term accommodation.",
      profilePicture: "https://api.dicebear.com/9.x/avataaars/svg?seed=SanaMalik&backgroundColor=ffd5dc",
      employmentProof: "MBBS Student — King Edward Medical University",
      bankStatement: "UBL account ending 3309",
    },
  })
  const bilal = await prisma.user.create({
    data: {
      phone: "03000000004",
      name: "Bilal Ahmed",
      roles: "tenant",
      bio: "Freelance graphic designer. Work from home, keep the place tidy. Looking in Islamabad.",
      profilePicture: "https://api.dicebear.com/9.x/avataaars/svg?seed=BilalAhmed&backgroundColor=d1d4f9",
      employmentProof: "Freelance Designer — Upwork / Fiverr Top Rated",
      bankStatement: "Faysal Bank account ending 2287",
    },
  })

  console.log("Created users")

  // Properties
  const prop1 = await prisma.property.create({
    data: {
      landlordId: ahmad.id,
      title: "Spacious 3-Bed Villa in DHA Phase 5",
      description: "Beautiful villa with garden, servant quarter, and car porch. Gated community with 24/7 security, close to main boulevard.",
      address: "House 45, Street 7, DHA Phase 5",
      city: "Lahore",
      rentAmount: 85000,
      bedrooms: 3,
      bathrooms: 3,
      area: 2400,
      available: false,
      imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
      image2Url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    },
  })
  const prop2 = await prisma.property.create({
    data: {
      landlordId: ahmad.id,
      title: "Modern 2-Bed Apartment in Clifton",
      description: "Sea-facing apartment with lift, gym access, and rooftop terrace. Walking distance to Dolmen Mall.",
      address: "Flat 3B, Clifton Block 9",
      city: "Karachi",
      rentAmount: 55000,
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      available: false,
      imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      image2Url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    },
  })
  const prop3 = await prisma.property.create({
    data: {
      landlordId: ahmad.id,
      title: "Cozy Studio in F-7 Islamabad",
      description: "Fully furnished studio, ideal for students or young professionals. Utilities included. Walking distance to F-7 Markaz.",
      address: "Plot 22, F-7/2",
      city: "Islamabad",
      rentAmount: 30000,
      bedrooms: 1,
      bathrooms: 1,
      area: 600,
      available: false,
      imageUrl: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&q=80",
    },
  })
  const prop4 = await prisma.property.create({
    data: {
      landlordId: ahmad.id,
      title: "Luxury Penthouse in Bahria Town",
      description: "Top-floor penthouse with panoramic views, private elevator, smart home features, and rooftop access. Premium location.",
      address: "Tower A, Penthouse 1, Bahria Town Phase 8",
      city: "Rawalpindi",
      rentAmount: 120000,
      bedrooms: 4,
      bathrooms: 3,
      area: 3200,
      available: true,
      imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      image2Url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    },
  })
  await prisma.property.create({
    data: {
      landlordId: ahmad.id,
      title: "Upper Portion 3-Bed in Gulberg III",
      description: "Well-maintained upper portion in prime Gulberg location. Separate entrance, UPS included, ample parking.",
      address: "House 12, Block L, Gulberg III",
      city: "Lahore",
      rentAmount: 65000,
      bedrooms: 3,
      bathrooms: 2,
      area: 1800,
      available: true,
      imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    },
  })

  console.log("Created properties")

  // Connections
  await prisma.connection.create({ data: { tenantId: hamza.id, landlordId: ahmad.id, status: "accepted" } })
  await prisma.connection.create({ data: { tenantId: sana.id, landlordId: ahmad.id, status: "accepted" } })
  await prisma.connection.create({ data: { tenantId: bilal.id, landlordId: ahmad.id, status: "accepted" } })

  console.log("Created connections")

  const now = new Date()

  // ── Hamza: 18 months, Rs. 85k/mo, 17 on-time + 1 late ──
  const hamzaStart = subMonths(now, 18)
  const hamzaTenancy = await prisma.tenancy.create({
    data: {
      propertyId: prop1.id,
      tenantId: hamza.id,
      landlordId: ahmad.id,
      monthlyRent: 85000,
      deposit: 170000,
      startDate: hamzaStart,
      status: "active",
      landlordConfirmedAt: hamzaStart,
    },
  })

  const hamzaMethods = ["jazzcash","jazzcash","easypaisa","jazzcash","jazzcash","easypaisa","jazzcash","jazzcash","easypaisa","jazzcash","jazzcash","easypaisa","jazzcash","jazzcash","easypaisa","jazzcash","jazzcash","jazzcash"]
  const hamzaRefs: Record<string, string> = { jazzcash: "JZC", easypaisa: "EPA", bank_transfer: "TXN", raast: "RST" }

  for (let i = 0; i < 18; i++) {
    const expectedDate = setDate(addMonths(hamzaStart, i), 1)
    const isLate = i === 4
    const paidDate = isLate
      ? new Date(expectedDate.getTime() + 10 * 24 * 60 * 60 * 1000)
      : new Date(expectedDate.getTime() + 2 * 24 * 60 * 60 * 1000)
    const isPending = i >= 16
    const method = hamzaMethods[i] ?? "jazzcash"
    await prisma.payment.create({
      data: {
        tenancyId: hamzaTenancy.id,
        expectedDate,
        amount: 85000,
        paidDate,
        method,
        referenceNumber: ref(hamzaRefs[method] ?? "TXN"),
        status: isPending ? "pending" : "confirmed",
        landlordConfirmedAt: isPending ? null : new Date(paidDate.getTime() + 24 * 60 * 60 * 1000),
        weight: isPending ? 0.5 : 1.0,
      },
    })
  }

  // Hamza score history (monthly snapshots for chart)
  const hamzaScores = [642, 668, 695, 718, 738, 752, 765, 772, 778, 782]
  for (let i = 0; i < hamzaScores.length; i++) {
    await prisma.kirayaScore.create({
      data: {
        userId: hamza.id,
        score: hamzaScores[i],
        onTimeRate: 0.88 + i * 0.005,
        tenureMonths: 8 + i,
        amountConsistency: 1.0,
        verificationLevel: 0.90 + i * 0.005,
        generatedAt: subMonths(now, hamzaScores.length - 1 - i),
      },
    })
  }

  console.log("Created Hamza tenancy + 18 payments + score history")

  // ── Sana: 8 months, Rs. 55k/mo ──
  const sanaStart = subMonths(now, 8)
  const sanaTenancy = await prisma.tenancy.create({
    data: {
      propertyId: prop2.id,
      tenantId: sana.id,
      landlordId: ahmad.id,
      monthlyRent: 55000,
      deposit: 110000,
      startDate: sanaStart,
      status: "active",
      landlordConfirmedAt: sanaStart,
    },
  })

  const sanaMethods = ["easypaisa","easypaisa","easypaisa","jazzcash","easypaisa","easypaisa","easypaisa","easypaisa"]
  for (let i = 0; i < 8; i++) {
    const expectedDate = setDate(addMonths(sanaStart, i), 1)
    const isLate = i === 2 || i === 6
    const paidDate = isLate
      ? new Date(expectedDate.getTime() + 12 * 24 * 60 * 60 * 1000)
      : new Date(expectedDate.getTime() + 1 * 24 * 60 * 60 * 1000)
    const isPending = i >= 7
    const method = sanaMethods[i] ?? "easypaisa"
    await prisma.payment.create({
      data: {
        tenancyId: sanaTenancy.id,
        expectedDate,
        amount: 55000,
        paidDate,
        method,
        referenceNumber: ref("EPA"),
        status: isPending ? "pending" : "confirmed",
        landlordConfirmedAt: isPending ? null : new Date(paidDate.getTime() + 24 * 60 * 60 * 1000),
        weight: isPending ? 0.5 : 1.0,
      },
    })
  }

  // Sana score history
  const sanaScores = [598, 618, 635, 641]
  for (let i = 0; i < sanaScores.length; i++) {
    await prisma.kirayaScore.create({
      data: {
        userId: sana.id,
        score: sanaScores[i],
        onTimeRate: 0.72 + i * 0.02,
        tenureMonths: 4 + i,
        amountConsistency: 1.0,
        verificationLevel: 0.85,
        generatedAt: subMonths(now, sanaScores.length - 1 - i),
      },
    })
  }

  console.log("Created Sana tenancy + 8 payments + score history")

  // ── Bilal: 4 months, Rs. 30k/mo ──
  const bilalStart = subMonths(now, 4)
  const bilalTenancy = await prisma.tenancy.create({
    data: {
      propertyId: prop3.id,
      tenantId: bilal.id,
      landlordId: ahmad.id,
      monthlyRent: 30000,
      deposit: 60000,
      startDate: bilalStart,
      status: "active",
      landlordConfirmedAt: bilalStart,
    },
  })

  const bilalMethods = ["bank_transfer","raast","bank_transfer","jazzcash"]
  for (let i = 0; i < 4; i++) {
    const expectedDate = setDate(addMonths(bilalStart, i), 1)
    const paidDate = new Date(expectedDate.getTime() + 1 * 24 * 60 * 60 * 1000)
    const method = bilalMethods[i] ?? "bank_transfer"
    await prisma.payment.create({
      data: {
        tenancyId: bilalTenancy.id,
        expectedDate,
        amount: 30000,
        paidDate,
        method,
        referenceNumber: method === "bank_transfer" ? ref("TXN") : ref("RST"),
        status: "confirmed",
        landlordConfirmedAt: new Date(paidDate.getTime() + 24 * 60 * 60 * 1000),
        weight: 1.0,
      },
    })
  }

  // Bilal score history
  await prisma.kirayaScore.create({
    data: {
      userId: bilal.id,
      score: 578,
      onTimeRate: 1.0,
      tenureMonths: 4,
      amountConsistency: 1.0,
      verificationLevel: 1.0,
      generatedAt: subMonths(now, 0),
    },
  })

  console.log("Created Bilal tenancy + 4 payments + score")

  // ── Pending rental request (Hamza → prop4 penthouse) ──
  await prisma.rentalRequest.create({
    data: {
      tenantId: hamza.id,
      landlordId: ahmad.id,
      propertyId: prop4.id,
      quotedRent: 115000,
      quotedDeposit: 230000,
      preferredStart: addMonths(now, 2),
      tenantMessage: "Assalamualaikum Ahmad bhai! I've been renting from you for 18 months and my Kirayadar Score is now 782. I'd love to upgrade to the Bahria penthouse. Can we discuss?",
      status: "pending",
    },
  })

  console.log("Created pending rental request")

  // Messages
  await prisma.message.create({
    data: { senderId: hamza.id, receiverId: ahmad.id, content: "Assalamualaikum Ahmad bhai! Just sent this month's rent via JazzCash. Please confirm when you see it." },
  })
  await prisma.message.create({
    data: { senderId: ahmad.id, receiverId: hamza.id, content: "Walaikumassalam Hamza! Received and confirmed. JazakAllah. You're one of my most reliable tenants!" },
  })
  await prisma.message.create({
    data: { senderId: hamza.id, receiverId: ahmad.id, content: "Shukria! I also submitted a request for the Bahria penthouse — would love to move there next year." },
  })
  await prisma.message.create({
    data: { senderId: sana.id, receiverId: ahmad.id, content: "Hi Ahmad sahib, is the parking spot included in the Clifton apartment? I have a bike." },
  })
  await prisma.message.create({
    data: { senderId: ahmad.id, receiverId: sana.id, content: "Yes Sana ji, one dedicated covered parking is included. No extra charge." },
  })
  await prisma.message.create({
    data: { senderId: bilal.id, receiverId: ahmad.id, content: "Ahmad bhai, everything is great in the F-7 studio. Sent this month's rent via bank transfer. Reference: TXN-2024-APR-001" },
  })

  console.log("Created messages")

  console.log("\n✅ Seed complete!")
  console.log("\nDemo accounts (OTP: 0000 for all):")
  console.log("  Tenant   Hamza Khan   → 03000000001  Score: ~782 (Excellent)")
  console.log("  Landlord Ahmad Raza   → 03000000002")
  console.log("  Tenant   Sana Malik   → 03000000003  Score: ~641 (Fair)")
  console.log("  Tenant   Bilal Ahmed  → 03000000004  Score: ~578 (Building)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
