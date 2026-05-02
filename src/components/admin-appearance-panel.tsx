import { saveSettingsAction, uploadBackgroundAction } from "@/app/actions";
import { FloatingField } from "@/components/floating-field";

type AppSettingsAppearance = {
  dashboardTitle: string;
  themeDefault: string;
  backgroundOverlay: number;
};

type Props = {
  settings: AppSettingsAppearance;
};

export function AdminAppearancePanel({ settings }: Props) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm dark:bg-slate-900">
      <h2 className="text-xl font-black">Appearance</h2>
      <form action={saveSettingsAction} className="mt-4 grid gap-4">
        <FloatingField label="Your Grid title" defaultFilled={settings.dashboardTitle.length > 0}>
          <input
            className="field"
            name="dashboardTitle"
            placeholder="Your Grid title"
            defaultValue={settings.dashboardTitle}
          />
        </FloatingField>
        <FloatingField label="Theme" defaultFilled>
          <select className="field" name="themeDefault" defaultValue={settings.themeDefault}>
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </FloatingField>
        <FloatingField label="Background overlay" defaultFilled>
          <input
            className="field"
            name="backgroundOverlay"
            type="number"
            min="0"
            max="0.9"
            step="0.05"
            placeholder="Background overlay"
            defaultValue={settings.backgroundOverlay}
          />
        </FloatingField>
        <button className="btn w-fit" type="submit">
          Save appearance
        </button>
      </form>

      <form
        action={uploadBackgroundAction}
        className="mt-6 grid gap-3 border-t border-slate-200 pt-6 dark:border-slate-700"
      >
        <FloatingField label="Upload background">
          <input className="field" name="background" type="file" accept="image/png,image/jpeg,image/webp" />
        </FloatingField>
        <button className="btn w-fit" type="submit">
          Upload background
        </button>
      </form>
    </div>
  );
}
