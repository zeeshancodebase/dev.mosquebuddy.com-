// server\src\config\prisma.js

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  // log: process.env.NODE_ENV === "development"
  //   ? ["error", "warn"]
  //   : ["error"],

  // for logging queries 
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

export default prisma;


// above This gives you helpful Prisma logs in development. Below is also correct

// import pkg from "@prisma/client";

// const { PrismaClient } = pkg;

// const prisma = new PrismaClient();

// export default prisma;