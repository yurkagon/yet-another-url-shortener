import { hash } from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const LINKS = [
  { code: 'gh-home1', originalUrl: 'https://github.com' },
  { code: 'wiki-js1', originalUrl: 'https://en.wikipedia.org/wiki/JavaScript' },
  { code: 'yt-nstjs', originalUrl: 'https://www.youtube.com/watch?v=F_BYg2QGsC0' },
  { code: 'mdn-prom', originalUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise' },
  { code: 'nx-docs1', originalUrl: 'https://nextjs.org/docs' },
  { code: 'nest-dcs', originalUrl: 'https://docs.nestjs.com' },
  { code: 'prsm-doc', originalUrl: 'https://www.prisma.io/docs' },
  { code: 'ts-hbook', originalUrl: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
  { code: 'rdx-home', originalUrl: 'https://redux-toolkit.js.org' },
  { code: 'tlwnd-ui', originalUrl: 'https://tailwindcss.com/docs/installation' },
  { code: 'react-dcs', originalUrl: 'https://react.dev/learn' },
  { code: 'vite-doc', originalUrl: 'https://vitejs.dev/guide/' },
  { code: 'drizzle1', originalUrl: 'https://orm.drizzle.team/docs/overview' },
  { code: 'bun-docs', originalUrl: 'https://bun.sh/docs' },
  { code: 'deno-std', originalUrl: 'https://docs.deno.com' },
  { code: 'rust-bk1', originalUrl: 'https://doc.rust-lang.org/book/' },
  { code: 'go-tour1', originalUrl: 'https://go.dev/tour/welcome/1' },
  { code: 'docker-h', originalUrl: 'https://docs.docker.com/get-started/' },
  { code: 'k8s-doc1', originalUrl: 'https://kubernetes.io/docs/home/' },
  { code: 'linuxcmd', originalUrl: 'https://man7.org/linux/man-pages/man1/ls.1.html' },
  { code: 'gh-coplt', originalUrl: 'https://github.com/features/copilot' },
  { code: 'openai-p', originalUrl: 'https://platform.openai.com/docs/overview' },
  { code: 'hf-model', originalUrl: 'https://huggingface.co/models' },
  { code: 'vercel-d', originalUrl: 'https://vercel.com/docs' },
  { code: 'cf-pages', originalUrl: 'https://developers.cloudflare.com/pages/' },
  { code: 'supabase', originalUrl: 'https://supabase.com/docs' },
  { code: 'planetsc', originalUrl: 'https://planetscale.com/docs' },
  { code: 'stripe-d', originalUrl: 'https://stripe.com/docs/api' },
  { code: 'gh-actns', originalUrl: 'https://docs.github.com/en/actions' },
  { code: 'graphql1', originalUrl: 'https://graphql.org/learn/' },
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
];

const IP_ADDRESSES = [
  '8.8.8.8',    // US
  '77.88.8.8',  // RU
  '185.220.101.1', // DE
  '1.1.1.1',    // AU
  '103.28.54.1', // SG
  '156.200.0.1', // EG
  '200.105.0.1', // BR
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): Date {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Upsert dev user
  const password = await hash('password123');
  const user = await prisma.user.upsert({
    where: { email: 'dev@example.com' },
    update: { password },
    create: {
      email: 'dev@example.com',
      name: 'Dev User',
      password,
    },
  });

  console.log(`👤 Dev user: ${user.email} (id: ${user.id})`);

  // Create links (skip if code already exists)
  const createdLinks: Array<{ id: string; code: string }> = [];

  for (const { code, originalUrl } of LINKS) {
    const existing = await prisma.link.findUnique({ where: { code } });
    if (existing) {
      createdLinks.push({ id: existing.id, code: existing.code });
      console.log(`  ⏭  Link ${code} already exists, skipping`);
      continue;
    }
    const link = await prisma.link.create({
      data: { code, originalUrl, userId: user.id },
    });
    createdLinks.push({ id: link.id, code: link.code });
    console.log(`  🔗 Created link ${link.code} → ${link.originalUrl}`);
  }

  // Delete existing clicks for these links so we can re-seed cleanly
  await prisma.click.deleteMany({
    where: { linkId: { in: createdLinks.map((l) => l.id) } },
  });

  // Create 150 clicks spread across links
  let clickCount = 0;
  for (let i = 0; i < 150; i++) {
    const link = randomItem(createdLinks);
    await prisma.click.create({
      data: {
        linkId: link.id,
        ipAddress: randomItem(IP_ADDRESSES),
        userAgent: randomItem(USER_AGENTS),
        createdAt: randomDate(30),
      },
    });
    clickCount++;
  }

  console.log(`  🖱️  Created ${clickCount} clicks (spread across ${createdLinks.length} links)`);
  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
