'use server';

import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkItem } from '@/lib/health';
import { backgroundUploadRoot, iconUploadRoot, publicUploadPath } from '@/lib/paths';
import { saveToDisk } from '@/lib/saveToDisk';
import { normalizeUrl } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import crypto from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  icon: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

const itemSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  url: z.string().trim().min(1),
  healthCheckUrl: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().default(0),
  checkIntervalSeconds: z.coerce.number().int().min(15).default(60),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

async function saveUpload(file: File, directory: string, kind: 'icons' | 'backgrounds') {
  const allowed = new Set(kind === 'icons' ? ['image/svg+xml', 'image/png', 'image/webp', 'image/jpeg'] : ['image/png', 'image/webp', 'image/jpeg']);

  if (!file.size || !allowed.has(file.type)) {
    throw new Error('Unsupported or empty file upload.');
  }

  const extension = path.extname(file.name).toLowerCase() || '.bin';
  const filename = `${crypto.randomUUID()}${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  await saveToDisk(buffer, directory, filename);

  return {
    filename,
    publicPath: publicUploadPath(kind, filename),
  };
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: {
      dashboardTitle: getString(formData, 'dashboardTitle') || 'Grid',
      themeDefault: getString(formData, 'themeDefault') || 'system',
      backgroundOverlay: Number(getString(formData, 'backgroundOverlay') || 0.45),
    },
    create: {
      id: 'default',
      dashboardTitle: getString(formData, 'dashboardTitle') || 'Grid',
      themeDefault: getString(formData, 'themeDefault') || 'system',
      backgroundOverlay: Number(getString(formData, 'backgroundOverlay') || 0.45),
      firstRunComplete: true,
    },
  });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function uploadBackgroundAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get('background');
  if (!(file instanceof File)) {
    redirect('/admin?error=background');
  }

  const upload = await saveUpload(file, backgroundUploadRoot, 'backgrounds');
  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: { backgroundImagePath: upload.publicPath },
    create: { id: 'default', backgroundImagePath: upload.publicPath, firstRunComplete: true },
  });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function uploadIconAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get('icon');
  if (!(file instanceof File)) {
    redirect('/admin?error=icon');
  }

  const upload = await saveUpload(file, iconUploadRoot, 'icons');
  await prisma.iconAsset.create({
    data: {
      name: getString(formData, 'name') || file.name,
      source: 'uploaded',
      path: upload.publicPath,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });
  revalidatePath('/admin');
}

export async function deleteIconAction(formData: FormData) {
  await requireAdmin();
  const id = getString(formData, 'id');
  const icon = await prisma.iconAsset.findUnique({ where: { id } });
  if (icon?.source === 'uploaded') {
    await prisma.iconAsset.delete({ where: { id } });
  }
  revalidatePath('/admin');
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();
  const input = categorySchema.parse({
    id: getString(formData, 'id') || undefined,
    name: getString(formData, 'name'),
    icon: getString(formData, 'icon') || undefined,
    sortOrder: getString(formData, 'sortOrder') || '0',
  });

  const { id, ...data } = input;
  if (id) {
    await prisma.category.update({ where: { id }, data });
  } else {
    await prisma.category.create({ data });
  }

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteCategoryAction(id: string) {
  await requireAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function saveItemAction(formData: FormData) {
  await requireAdmin();
  const input = itemSchema.parse({
    id: getString(formData, 'id') || undefined,
    categoryId: getString(formData, 'categoryId'),
    title: getString(formData, 'title'),
    description: getString(formData, 'description') || undefined,
    icon: getString(formData, 'icon') || undefined,
    url: normalizeUrl(getString(formData, 'url')),
    healthCheckUrl: getString(formData, 'healthCheckUrl') ? normalizeUrl(getString(formData, 'healthCheckUrl')) : undefined,
    sortOrder: getString(formData, 'sortOrder') || '0',
    checkIntervalSeconds: getString(formData, 'checkIntervalSeconds') || '60',
  });

  const { id, ...data } = input;
  if (id) {
    await prisma.dashboardItem.update({ where: { id }, data });
  } else {
    await prisma.dashboardItem.create({ data });
  }

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteItemAction(id: string) {
  await requireAdmin();
  await prisma.dashboardItem.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function runCheckAction(id: string) {
  await requireAdmin();
  const result = await checkItem(id);
  if (!result) {
    return null;
  }
  return {
    checkedAt: result.checkedAt,
    status: result.status,
    latencyMs: result.latencyMs,
  };
}

const idListSchema = z.array(z.string().min(1));

export async function reorderCategoriesAction(ids: string[]) {
  await requireAdmin();
  const parsed = idListSchema.parse(ids);

  await prisma.$transaction(parsed.map((id, index) => prisma.category.update({ where: { id }, data: { sortOrder: index } })));

  revalidatePath('/');
  revalidatePath('/admin');
}

export async function reorderItemsAction(categoryId: string, ids: string[]) {
  await requireAdmin();
  const parsed = idListSchema.parse(ids);

  const existing = await prisma.dashboardItem.findMany({
    where: { categoryId },
    select: { id: true },
  });
  const valid = new Set(existing.map((row) => row.id));
  if (parsed.length !== valid.size) {
    throw new Error('Item list length does not match category.');
  }
  for (const id of parsed) {
    if (!valid.has(id)) {
      throw new Error('Invalid item id for category.');
    }
  }

  await prisma.$transaction(parsed.map((id, index) => prisma.dashboardItem.update({ where: { id }, data: { sortOrder: index } })));

  revalidatePath('/');
  revalidatePath('/admin');
}
