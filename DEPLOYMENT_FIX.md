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


---

## עדכון הקוד לאחר שינויים / Updating After Code Changes

אם שינית את הקוד ב-GitHub (למשל עדכנת את seed.sql או app.js), עקוב אחר השלבים הבאים:

If you changed the code in GitHub (e.g., updated seed.sql or app.js), follow these steps:

### שלב 1: משוך את השינויים מ-GitHub / Step 1: Pull Changes from GitHub

```bash
cd path/to/Managed-tasks
git pull origin main
```

### שלב 2: עדכן את מסד הנתונים (רק אם שינית את seed.sql) / Step 2: Update Database (only if you changed seed.sql)

#### אם יש משתמשים ישנים והנתונים שונים - מחק והתחל מחדש:
#### If there are old users and the data is different - delete and start fresh:

```bash
# מחק את כל הנתונים הקיימים במסד הנתונים / Delete all existing data
npx wrangler d1 execute webapp-production --remote --command="DELETE FROM task_updates"
npx wrangler d1 execute webapp-production --remote --command="DELETE FROM tasks"
npx wrangler d1 execute webapp-production --remote --command="DELETE FROM users"

# הזן את הנתונים המעודכנים / Insert the updated data
npx wrangler d1 execute webapp-production --remote --file=./seed.sql
```

### שלב 3: פרסם את הקוד המעודכן ל-Cloudflare / Step 3: Deploy Updated Code to Cloudflare

```bash
npx wrangler deploy
```

### שלב 4: בדיקה / Step 4: Testing

אחרי ה-deploy, גש לאתר ונסה להתחבר עם המשתמשים המעודכנים.

After deploying, go to your site and try logging in with the updated users.

---

## משתמשים נוכחיים / Current Users

על פי הגדרות ה-seed.sql העדכני:

According to the current seed.sql settings:

- **מנהל / Manager**: 
  - שם משתמש / Username: `ADMIN`
  - סיסמה / Password: `ADMIN`

- **תת-מנהל 1 / Sub-Manager 1**: 
  - שם משתמש / Username: `A1`
  - סיסמה / Password: `123456`

- **תת-מנהל 2 / Sub-Manager 2**: 
  - שם משתמש / Username: `A2`
  - סיסמה / Password: `123456`

- **תת-מנהל 3 / Sub-Manager 3**: 
  - שם משתמש / Username: `A3`
  - סיסמה / Password: `123456`

- **תת-מנהל 4 / Sub-Manager 4**: 
  - שם משתמש / Username: `A4`
  - סיסמה / Password: `123456`
