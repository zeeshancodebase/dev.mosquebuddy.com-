// server\src\db\conn.js

import prisma from "../config/prisma.js";

const connectDb = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    console.log("------ ✓ PostgreSQL Connection Successful -------");
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDb;


// import prisma from "../prisma/client.js";

// const connectDb = async () => {
//   try {
//     await prisma.$queryRaw`SELECT 1`;

//     console.log("------ ✓ PostgreSQL Connection Successful -------");
//   } catch (error) {
//     console.error("❌ PostgreSQL Connection failed!", error.message);
//     process.exit(1);
//   }
// };

// export default connectDb;