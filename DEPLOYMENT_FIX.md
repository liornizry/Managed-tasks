# תיקון בעיית ההתחברות - Fix Login Issue

## הבעיה / The Problem

כאשר הקוד מורץ על המחשב המקומי, הכל עובד מצוין. אבל כשהקוד מועלה ל-Cloudflare Workers (GitHub), פונקציית ה-LOGIN לא עובדת.

When the code runs locally, everything works great. But when the code is uploaded to Cloudflare Workers (GitHub), the LOGIN function doesn't work.

## הסיבה / The Cause

הבעיה היא שמסד הנתונים ב-Cloudflare D1 לא אותחל עם הנתונים הדמו (משתמשי הדמו).

The problem is that the Cloudflare D1 database was not initialized with the demo data (demo users).

## הפתרון / The Solution

יש להריץ את הפקודות הבאות כדי לאתחל את מסד הנתונים:

You need to run the following commands to initialize the database:

### שלב 1: הרצת המיגרציות / Step 1: Run Migrations

```bash
npx wrangler d1 migrations apply webapp-production --remote
```

### שלב 2: הזנת נתוני הדמו / Step 2: Seed Demo Data

```bash
npx wrangler d1 execute webapp-production --remote --file=./seed.sql
```

## משתמשי דמו / Demo Users

לאחר הרצת הפקודות, המשתמשים הבאים יהיו זמינים:

After running the commands, the following users will be available:

- **מנהל / Manager**: 
  - שם משתמש / Username: `manager`
  - סיסמה / Password: `123456`

- **תת-מנהל 1 / Sub-Manager 1**: 
  - שם משתמש / Username: `sub1`
  - סיסמה / Password: `123456`

- **תת-מנהל 2 / Sub-Manager 2**: 
  - שם משתמש / Username: `sub2`
  - סיסמה / Password: `123456`

- **תת-מנהל 3 / Sub-Manager 3**: 
  - שם משתמש / Username: `sub3`
  - סיסמה / Password: `123456`

## בדיקה / Testing

לאחר הרצת הפקודות, נסה להתחבר באמצעות אחד ממשתמשי הדמו.

After running the commands, try logging in with one of the demo users.

## הערות / Notes

- ודא שה-database_id ב-wrangler.jsonc תואם למסד הנתונים שלך ב-Cloudflare
- Make sure the database_id in wrangler.jsonc matches your database in Cloudflare

- אם עדיין יש בעיות, בדוק את הלוגים ב-Cloudflare Dashboard
- If there are still issues, check the logs in Cloudflare Dashboard
