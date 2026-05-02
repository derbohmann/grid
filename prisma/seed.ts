import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import prismaClientPkg from '@prisma/client';

const { PrismaClient } = prismaClientPkg;

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? 'file:./data/app.db',
  }),
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

const bundledIcons = [
  'adguard-home',
  'affine',
  'bitwarden',
  'home-assistant',
  'jellyfin',
  'jellyseerr',
  'nextcloud',
  'nginx-proxy-manager',
  'portainer-alt',
  'portainer-dark',
  'radarr',
  'sonarr',
  'prowlarr',
  'sabnzbd',
  'outline',
  'truenas-scale',
  'vaultwarden',
];

async function main() {
  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      dashboardTitle: 'Home Lab',
      themeDefault: 'system',
      backgroundOverlay: 0.45,
    },
  });

  for (const icon of bundledIcons) {
    await prisma.iconAsset.upsert({
      where: { source_path: { source: 'bundled', path: `/icons/bundled/${icon}.svg` } },
      update: { name: icon },
      create: {
        name: icon,
        source: 'bundled',
        path: `/icons/bundled/${icon}.svg`,
        mimeType: 'image/svg+xml',
        sizeBytes: 0,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
