## Description

This is a simple project to demonstrate how to use Prisma with NestJS. This project is a simple API that authenticate user for registeration using standard login(email and password) or bio-metric login(finger print). The project is built with NestJS, Prisma, and Postgres.

## Project setup

```bash 
# Clone the project
$ git clone <project-url>
```

```bash
# Change directory to the project
$ cd <project-directory>
```

```bash
# Install dependencies
$ yarn install
```

## Environment setup

```bash
# Create a new .env file by copying the .env.example file
$ cp .env.example .env
```

```bash
# Add the following environment variables to the .env file
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<database-name
```

```bash
# Add the following environment variables to the .env file
JWT_SECRET
```

## Database setup

```bash
# Generate a new database with prisma
$ npx prisma generate
```

```bash
# Create a new migration
$ npx prisma migrate dev --name init
```



## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:watch
