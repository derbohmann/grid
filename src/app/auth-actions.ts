'use server';

import { createSession, destroySession, hashPassword, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export async function setupAdminAction(formData: FormData) {
  const email = getString(formData, 'email').trim().toLowerCase();
  const password = getString(formData, 'password');
  const existing = await prisma.adminUser.count();

  if (existing > 0) {
    redirect('/login');
  }

  if (!email || password.length < 8) {
    redirect('/setup?error=invalid');
  }

  const admin = await prisma.adminUser.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
    },
  });

  await prisma.appSettings.upsert({
    where: { id: 'default' },
    update: { firstRunComplete: true },
    create: { id: 'default', firstRunComplete: true },
  });

  await createSession(admin.id);
  redirect('/admin');
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, 'email').trim().toLowerCase();
  const password = getString(formData, 'password');

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !(await verifyPassword(password, admin.passwordHash))) {
    redirect('/login?error=invalid');
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });
  await createSession(admin.id);
  redirect('/admin');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}
