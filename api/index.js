const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === "production";
const frontendOrigin = process.env.APP_URL || "http://localhost:5173";

app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));

const userPublicSelect = {
  id: true,
  name: true,
  email: true,
  college: true,
  course: true,
  year: true,
  bio: true,
  skills: true,
  avatarUrl: true,
  createdAt: true
};

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function setAuthCookie(res, userId) {
  res.cookie("studenthub_token", signToken(userId), {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });
}

function clearAuthCookie(res) {
  res.clearCookie("studenthub_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/"
  });
}

async function auth(req, res, next) {
  try {
    const token = req.cookies.studenthub_token;
    if (!token) return res.status(401).json({ message: "Authentication required." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: userPublicSelect
    });
    if (!user) return res.status(401).json({ message: "User not found." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(160),
  password: z.string().min(8).max(100),
  college: z.string().max(160).optional().default(""),
  course: z.string().max(120).optional().default(""),
  year: z.string().max(30).optional().default("")
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const listingSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(3000),
  type: z.enum(["BOOK", "NOTES", "ELECTRONICS", "HOSTEL", "OTHER"]),
  price: z.number().int().min(0).max(100000).nullable().optional(),
  location: z.string().max(160).optional().default(""),
  imageUrl: z.string().url().max(1000).optional().or(z.literal(""))
});

const collaborationSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(3000),
  type: z.enum(["PROJECT", "HACKATHON", "STUDY", "OPEN_SOURCE", "STARTUP", "OTHER"]),
  skills: z.array(z.string().min(1).max(50)).max(20).default([]),
  location: z.string().max(160).optional().default(""),
  remote: z.boolean().default(true)
});

const jobSchema = z.object({
  title: z.string().min(3).max(120),
  company: z.string().min(2).max(120),
  description: z.string().min(5).max(3000),
  skills: z.array(z.string().min(1).max(50)).max(20).default([]),
  location: z.string().max(160).optional().default(""),
  applyUrl: z.string().url().max(1000).optional().or(z.literal(""))
});

app.get("/api/health", (req, res) => res.json({ ok: true, service: "StudentHub API" }));

app.post("/api/auth/signup", asyncRoute(async (req, res) => {
  const data = signupSchema.parse(req.body);
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ message: "An account with this email already exists." });

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      passwordHash,
      college: data.college?.trim() || null,
      course: data.course?.trim() || null,
      year: data.year?.trim() || null
    },
    select: userPublicSelect
  });

  setAuthCookie(res, user.id);
  res.status(201).json({ user });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase().trim() } });
  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    return res.status(401).json({ message: "Invalid email or password." });
  }
  setAuthCookie(res, user.id);
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
}));

app.post("/api/auth/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

app.get("/api/auth/me", auth, (req, res) => {
  res.json({ user: req.user });
});

app.post("/api/auth/forgot-password", asyncRoute(async (req, res) => {
  const email = z.string().email().parse(req.body.email).toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });

  // Same response whether or not an account exists.
  if (!user) return res.json({ message: "If an account exists, reset instructions have been sent." });

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    }
  });

  const resetUrl = `${frontendOrigin}/reset-password?token=${rawToken}`;

  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [user.email],
        subject: "Reset your StudentHub password",
        html: `<p>Hi ${user.name},</p><p>Use the link below within 30 minutes to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
      })
    });
  } else if (!isProduction) {
    console.log("DEV password reset URL:", resetUrl);
  }

  res.json({ message: "If an account exists, reset instructions have been sent." });
}));

app.post("/api/auth/reset-password", asyncRoute(async (req, res) => {
  const schema = z.object({
    token: z.string().min(20),
    password: z.string().min(8).max(100)
  });
  const data = schema.parse(req.body);
  const tokenHash = crypto.createHash("sha256").update(data.token).digest("hex");

  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!reset || reset.expiresAt < new Date()) {
    return res.status(400).json({ message: "This reset link is invalid or expired." });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.update({
    where: { id: reset.userId },
    data: { passwordHash },
    select: userPublicSelect
  });

  await prisma.passwordResetToken.delete({ where: { id: reset.id } });
  setAuthCookie(res, user.id);
  res.json({ user });
}));

app.patch("/api/users/me", auth, asyncRoute(async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).max(80).optional(),
    college: z.string().max(160).nullable().optional(),
    course: z.string().max(120).nullable().optional(),
    year: z.string().max(30).nullable().optional(),
    bio: z.string().max(1000).nullable().optional(),
    skills: z.array(z.string().min(1).max(50)).max(20).optional(),
    avatarUrl: z.string().url().max(1000).nullable().optional()
  });
  const data = schema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: userPublicSelect
  });
  res.json({ user });
}));

app.get("/api/listings", asyncRoute(async (req, res) => {
  const q = String(req.query.q || "").trim();
  const type = String(req.query.type || "");
  const listings = await prisma.listing.findMany({
    where: {
      status: "AVAILABLE",
      ...(type && ["BOOK","NOTES","ELECTRONICS","HOSTEL","OTHER"].includes(type) ? { type } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } }
        ]
      } : {})
    },
    include: { owner: { select: userPublicSelect } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  res.json({ listings });
}));

app.post("/api/listings", auth, asyncRoute(async (req, res) => {
  const data = listingSchema.parse(req.body);
  const listing = await prisma.listing.create({
    data: {
      ...data,
      price: data.price ?? null,
      imageUrl: data.imageUrl || null,
      location: data.location || null,
      ownerId: req.user.id
    },
    include: { owner: { select: userPublicSelect } }
  });
  res.status(201).json({ listing });
}));

app.patch("/api/listings/:id", auth, asyncRoute(async (req, res) => {
  const data = listingSchema.partial().extend({
    status: z.enum(["AVAILABLE", "EXCHANGED", "CLOSED"]).optional()
  }).parse(req.body);

  const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Listing not found." });
  if (existing.ownerId !== req.user.id) return res.status(403).json({ message: "You can only edit your own listings." });

  const listing = await prisma.listing.update({
    where: { id: existing.id },
    data,
    include: { owner: { select: userPublicSelect } }
  });
  res.json({ listing });
}));

app.delete("/api/listings/:id", auth, asyncRoute(async (req, res) => {
  const existing = await prisma.listing.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Listing not found." });
  if (existing.ownerId !== req.user.id) return res.status(403).json({ message: "You can only delete your own listings." });
  await prisma.listing.delete({ where: { id: existing.id } });
  res.json({ ok: true });
}));

app.get("/api/collaborations", asyncRoute(async (req, res) => {
  const q = String(req.query.q || "").trim();
  const type = String(req.query.type || "");
  const collaborations = await prisma.collaboration.findMany({
    where: {
      ...(type && ["PROJECT","HACKATHON","STUDY","OPEN_SOURCE","STARTUP","OTHER"].includes(type) ? { type } : {}),
      ...(q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { skills: { has: q } }
        ]
      } : {})
    },
    include: { owner: { select: userPublicSelect } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  res.json({ collaborations });
}));

app.post("/api/collaborations", auth, asyncRoute(async (req, res) => {
  const data = collaborationSchema.parse(req.body);
  const collaboration = await prisma.collaboration.create({
    data: {
      ...data,
      location: data.location || null,
      ownerId: req.user.id
    },
    include: { owner: { select: userPublicSelect } }
  });
  res.status(201).json({ collaboration });
}));

app.delete("/api/collaborations/:id", auth, asyncRoute(async (req, res) => {
  const existing = await prisma.collaboration.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Collaboration post not found." });
  if (existing.ownerId !== req.user.id) return res.status(403).json({ message: "You can only delete your own posts." });
  await prisma.collaboration.delete({ where: { id: existing.id } });
  res.json({ ok: true });
}));

app.get("/api/jobs", asyncRoute(async (req, res) => {
  const q = String(req.query.q || "").trim();
  const jobs = await prisma.job.findMany({
    where: q ? {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { skills: { has: q } }
      ]
    } : {},
    include: { postedBy: { select: userPublicSelect } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  res.json({ jobs });
}));

app.post("/api/jobs", auth, asyncRoute(async (req, res) => {
  const data = jobSchema.parse(req.body);
  const job = await prisma.job.create({
    data: {
      ...data,
      location: data.location || null,
      applyUrl: data.applyUrl || null,
      postedById: req.user.id
    },
    include: { postedBy: { select: userPublicSelect } }
  });
  res.status(201).json({ job });
}));

app.delete("/api/jobs/:id", auth, asyncRoute(async (req, res) => {
  const existing = await prisma.job.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ message: "Job not found." });
  if (existing.postedById !== req.user.id) return res.status(403).json({ message: "You can only delete your own jobs." });
  await prisma.job.delete({ where: { id: existing.id } });
  res.json({ ok: true });
}));

app.get("/api/users", auth, asyncRoute(async (req, res) => {
  const q = String(req.query.q || "").trim();
  const users = await prisma.user.findMany({
    where: {
      id: { not: req.user.id },
      ...(q ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { college: { contains: q, mode: "insensitive" } },
          { course: { contains: q, mode: "insensitive" } },
          { skills: { has: q } }
        ]
      } : {})
    },
    select: userPublicSelect,
    orderBy: { createdAt: "desc" },
    take: 100
  });
  res.json({ users });
}));

app.get("/api/messages/:userId", auth, asyncRoute(async (req, res) => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ]
    },
    orderBy: { createdAt: "asc" },
    take: 200
  });
  res.json({ messages });
}));

app.post("/api/messages/:userId", auth, asyncRoute(async (req, res) => {
  const content = z.string().min(1).max(2000).parse(req.body.content);
  if (req.params.userId === req.user.id) return res.status(400).json({ message: "You cannot message yourself." });

  const receiver = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!receiver) return res.status(404).json({ message: "Student not found." });

  const message = await prisma.message.create({
    data: {
      content,
      senderId: req.user.id,
      receiverId: receiver.id
    }
  });
  res.status(201).json({ message });
}));

app.get("/api/dashboard", auth, asyncRoute(async (req, res) => {
  const [listings, collaborations, jobs, users] = await Promise.all([
    prisma.listing.count({ where: { ownerId: req.user.id } }),
    prisma.collaboration.count({ where: { ownerId: req.user.id } }),
    prisma.job.count({ where: { postedById: req.user.id } }),
    prisma.user.count()
  ]);
  res.json({ stats: { listings, collaborations, jobs, students: users } });
}));

app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof z.ZodError) {
    return res.status(400).json({ message: err.issues[0]?.message || "Invalid input." });
  }
  res.status(500).json({ message: "Something went wrong on the server." });
});

module.exports = app;
