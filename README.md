## Firebase → Postgres Migration

One-time migration tool to copy data from Firebase Firestore into a local PostgreSQL database using Node.js + TypeScript + Prisma.

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- A Firebase service account JSON (Firestore admin access)

### Setup

1. Clone + install
```
git clone https://github.com/dlakmalb/firebase-to-postgres-migration.git
cd firebase-to-postgres
npm install
```

2. Create Postgres database
Create a database (example name: milk) and ensure Postgres is running.

3. Add environment variables
Create a .env file in the project root:
```
DATABASE_URL="postgresql://postgres:<password>@localhost:5432/milk?schema=public"
FIREBASE_SERVICE_ACCOUNT_PATH="C:\Users\Administrator\Downloads\milk_key\milkpos-firebase-adminsdk-xxxxx.json"
FIREBASE_PROJECT_ID="milkpos"
```
### Prisma (DB schema)

4. Generate client + apply migrations
```
npx prisma generate
npx prisma migrate dev
```
To inspect DB in Prisma Studio:
```
npx prisma studio
```

### Run migrations (data import)
5. Run the migration script
```
npm run migrate:run
```

## Notes / Troubleshooting
- After editing `schema.prisma`, always run:
```
npx prisma generate
```
Otherwise you may see errors like “Unknown argument …” or missing enums.

- If migrate dev complains about drift in development DB:
```
npx prisma migrate reset
```
⚠️ This drops all data in the database.


