import { saveHealthNotifySettingsAction } from "@/app/actions";
import { FloatingField } from "@/components/floating-field";

export type AdminHealthNotifySettings = {
  healthNotifyWebhookEnabled: boolean;
  healthNotifyWebhookUrl: string | null;
  healthNotifyEmailEnabled: boolean;
  healthNotifyEmailTo: string | null;
  healthNotifyOnRecovery: boolean;
};

type Props = {
  settings: AdminHealthNotifySettings;
};

export function AdminHealthNotifyPanel({ settings }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <h2 className="text-xl font-black">Health alerts</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Enable alerting per dashboard item. Alerts run when status changes — not on
        every failing poll. Email uses SMTP from environment variables; see README.
      </p>
      <form action={saveHealthNotifySettingsAction} className="mt-4 grid gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="healthNotifyWebhookEnabled"
            value="true"
            defaultChecked={settings.healthNotifyWebhookEnabled}
          />
          Send webhook POST on alert
        </label>
        <FloatingField label="Webhook URL (http or https)" defaultFilled={Boolean(settings.healthNotifyWebhookUrl?.trim())}>
          <input
            className="field"
            name="healthNotifyWebhookUrl"
            placeholder="https://example.com/hooks/..."
            defaultValue={settings.healthNotifyWebhookUrl ?? ""}
          />
        </FloatingField>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="healthNotifyEmailEnabled" value="true" defaultChecked={settings.healthNotifyEmailEnabled} />
          Send email on alert (requires SMTP env)
        </label>
        <FloatingField label="Email to (optional if HEALTH_NOTIFY_EMAIL_TO is set)" defaultFilled={Boolean(settings.healthNotifyEmailTo?.trim())}>
          <input
            className="field"
            name="healthNotifyEmailTo"
            type="email"
            placeholder="you@example.com"
            defaultValue={settings.healthNotifyEmailTo ?? ""}
          />
        </FloatingField>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="healthNotifyOnRecovery" value="true" defaultChecked={settings.healthNotifyOnRecovery} />
          Notify when service recovers (back online)
        </label>

        <button className="btn w-fit" type="submit">
          Save alert settings
        </button>
      </form>
    </div>
  );
}
