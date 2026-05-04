import 'server-only';

import { prisma } from '@/lib/db';
import type { AppSettings, DashboardItem, HealthCheckResult } from '@prisma/client';
import { HealthStatus } from '@prisma/client';
import nodemailer from 'nodemailer';

const webhookTimeoutMs = Number(process.env.HEALTH_NOTIFY_WEBHOOK_TIMEOUT_MS ?? 8000);

export type HealthNotifyEvent = 'health_failure' | 'health_recovery';

function buildPayload(args: { event: HealthNotifyEvent; item: Pick<DashboardItem, 'id' | 'title' | 'url' | 'healthCheckUrl'>; created: HealthCheckResult; dashboardTitle: string }) {
  return {
    event: args.event,
    itemId: args.item.id,
    title: args.item.title,
    serviceUrl: args.item.url,
    healthCheckUrl: args.item.healthCheckUrl,
    checkedAt: args.created.checkedAt.toISOString(),
    status: args.created.status,
    statusCode: args.created.statusCode,
    errorMessage: args.created.errorMessage,
    dashboardTitle: args.dashboardTitle,
  } as const;
}

function isAllowedWebhookUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

async function postWebhook(url: string, body: unknown) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), webhookTimeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error('[health-notify] webhook returned', res.status, res.statusText);
    }
  } finally {
    clearTimeout(t);
  }
}

function readSmtpFromEnv(): { host: string; port: number; secure: boolean; user?: string; pass?: string; from: string; fromName: string } | null {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!host || !from) {
    return null;
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!Number.isFinite(port)) {
    return null;
  }
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const fromName = process.env.MAIL_FROM_NAME?.trim() || 'Grid';
  const user = process.env.SMTP_USER?.trim() || undefined;
  const pass = process.env.SMTP_PASSWORD?.trim() || undefined;
  return { host, port, secure, user, pass, from, fromName };
}

function resolveEmailTo(settings: AppSettings): string | null {
  const fromSettings = settings.healthNotifyEmailTo?.trim();
  if (fromSettings) {
    return fromSettings;
  }
  const envTo = process.env.HEALTH_NOTIFY_EMAIL_TO?.trim();
  return envTo || null;
}

function emailBody(payload: ReturnType<typeof buildPayload>): string {
  const lines = [
    `Grid health alert (${payload.event})`,
    '',
    `Dashboard: ${payload.dashboardTitle}`,
    `Item: ${payload.title}`,
    `Service URL: ${payload.serviceUrl}`,
    payload.healthCheckUrl ? `Health check URL: ${payload.healthCheckUrl}` : null,
    `Status: ${payload.status}`,
    payload.statusCode != null ? `HTTP status: ${payload.statusCode}` : null,
    payload.errorMessage ? `Detail: ${payload.errorMessage}` : null,
    `Checked at: ${payload.checkedAt}`,
  ];
  return lines.filter((l): l is string => typeof l === 'string' && l.length > 0).join('\n');
}

async function sendEmail(args: { settings: AppSettings; payload: ReturnType<typeof buildPayload>; subject: string }) {
  const smtp = readSmtpFromEnv();
  const to = resolveEmailTo(args.settings);
  if (!smtp) {
    console.warn('[health-notify] Email enabled but SMTP_HOST / MAIL_FROM missing');
    return;
  }
  if (!to) {
    console.warn('[health-notify] Email enabled but no recipient (healthNotifyEmailTo or HEALTH_NOTIFY_EMAIL_TO)');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user && smtp.pass ? { user: smtp.user, pass: smtp.pass } : undefined,
  });

  await transporter.sendMail({
    from: smtp.fromName ? `${smtp.fromName} <${smtp.from}>` : smtp.from,
    to,
    subject: args.subject,
    text: emailBody(args.payload),
  });
}

function classifyTransition(previous: HealthCheckResult | null, created: HealthCheckResult, settings: AppSettings): HealthNotifyEvent | null {
  const wasOffline = previous?.status === HealthStatus.OFFLINE;
  const isOffline = created.status === HealthStatus.OFFLINE;

  if (isOffline && previous?.status !== HealthStatus.OFFLINE) {
    return 'health_failure';
  }
  if (settings.healthNotifyOnRecovery && !isOffline && wasOffline) {
    return 'health_recovery';
  }
  return null;
}

export async function dispatchHealthAlertsIfNeeded(args: { item: DashboardItem; previous: HealthCheckResult | null; created: HealthCheckResult }): Promise<void> {
  if (!args.item.healthFailureNotify) {
    console.log('[health-notify] Health failure notification disabled for item', args.item.id);
    return;
  }

  let settings: AppSettings;
  try {
    const loaded = await prisma.appSettings.findUnique({ where: { id: 'default' } });
    if (!loaded) {
      console.log('[health-notify] No settings found');
      return;
    }
    settings = loaded;
  } catch (e) {
    console.error('[health-notify] failed to load settings', e);
    return;
  }

  const event = classifyTransition(args.previous, args.created, settings);
  if (!event) {
    console.log('[health-notify] No event found for item', args.item.id);
    return;
  }

  const payload = buildPayload({
    event,
    item: args.item,
    created: args.created,
    dashboardTitle: settings.dashboardTitle,
  });

  console.log('[health-notify] Payload', payload);

  const subjectPrefix = payload.dashboardTitle || 'Grid';
  const subject = event === 'health_failure' ? `${subjectPrefix}: ${payload.title} is offline` : `${subjectPrefix}: ${payload.title} recovered`;

  try {
    if (settings.healthNotifyWebhookEnabled) {
      const url = settings.healthNotifyWebhookUrl?.trim();
      if (url && isAllowedWebhookUrl(url)) {
        await postWebhook(url, payload);
      } else if (settings.healthNotifyWebhookEnabled) {
        console.warn('[health-notify] Webhook enabled but URL missing or invalid');
      }
    }

    if (settings.healthNotifyEmailEnabled) {
      console.log('[health-notify] Sending email for item', args.item.id);
      await sendEmail({ settings, payload, subject });
    }
  } catch (e) {
    console.error('[health-notify] delivery failed', e);
  }
}
