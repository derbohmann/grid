-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "themeDefault" TEXT NOT NULL DEFAULT 'system',
    "backgroundImagePath" TEXT,
    "backgroundOverlay" REAL NOT NULL DEFAULT 0.45,
    "dashboardTitle" TEXT NOT NULL DEFAULT 'Grid',
    "healthNotifyWebhookEnabled" BOOLEAN NOT NULL DEFAULT false,
    "healthNotifyWebhookUrl" TEXT,
    "healthNotifyEmailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "healthNotifyEmailTo" TEXT,
    "healthNotifyOnRecovery" BOOLEAN NOT NULL DEFAULT false,
    "firstRunComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSettings" ("backgroundImagePath", "backgroundOverlay", "createdAt", "dashboardTitle", "firstRunComplete", "id", "themeDefault", "updatedAt") SELECT "backgroundImagePath", "backgroundOverlay", "createdAt", "dashboardTitle", "firstRunComplete", "id", "themeDefault", "updatedAt" FROM "AppSettings";
DROP TABLE "AppSettings";
ALTER TABLE "new_AppSettings" RENAME TO "AppSettings";
CREATE TABLE "new_DashboardItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "url" TEXT NOT NULL,
    "healthCheckUrl" TEXT,
    "healthFailureNotify" BOOLEAN NOT NULL DEFAULT false,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "checkIntervalSeconds" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DashboardItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DashboardItem" ("categoryId", "checkIntervalSeconds", "createdAt", "description", "healthCheckUrl", "icon", "id", "openInNewTab", "sortOrder", "title", "updatedAt", "url") SELECT "categoryId", "checkIntervalSeconds", "createdAt", "description", "healthCheckUrl", "icon", "id", "openInNewTab", "sortOrder", "title", "updatedAt", "url" FROM "DashboardItem";
DROP TABLE "DashboardItem";
ALTER TABLE "new_DashboardItem" RENAME TO "DashboardItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
