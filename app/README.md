This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Container startup and test data

Start the Compose stack from this directory with:

```sh
docker compose --env-file .env.local up --build
```

The `--env-file` option is important: Compose uses `.env.local` to substitute the
`DB_NAME`, `DB_USER`, and `DB_PASSWORD` values in `docker-compose.yml`. The app
container then waits for the database, applies pending migrations, and starts Next.js.
The startup script does not run the Prisma seed command. The seed contains mock
household data and refuses to run when `NODE_ENV=production`; the Docker image sets
`NODE_ENV=production`.

Run `npm run db:seed` only against a local development database.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
