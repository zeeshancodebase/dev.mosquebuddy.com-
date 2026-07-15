// server/src/middlewares/errorMiddleware.js

import { mapPrismaError } from "../utils/prismaErrorMapper.js";

/*
Every error is classified into exactly one bucket before it touches the response:
1. Operational (createHttpError, isOperational=true) -> message was written by us, safe to expose.
2. Prisma error -> mapped to a generic safe message; real detail goes to the server log only.
3. Anything else (unexpected/programming error) -> generic 500, never expose err.message.
Raw error.message from Prisma / unknown errors NEVER reaches res.json().
*/
const errorMiddleware = (err, req, res, next) => {
  const prismaMapped = mapPrismaError(err);

  let statusCode;
  let clientMessage;
  let extraDetails;

  if (err.isOperational) {
    statusCode = err.statusCode || 500;
    clientMessage = err.message || "Something went wrong.";
    extraDetails = err.extraDetails || undefined;
  } else if (prismaMapped) {
    statusCode = prismaMapped.statusCode;
    clientMessage = prismaMapped.message;
  } else {
    statusCode = err.statusCode && err.statusCode < 500 ? err.statusCode : 500;
    clientMessage = statusCode < 500 ? err.message : "Something went wrong. Please try again.";
  }

  // Full detail — server console only, never sent to the client.
  console.error("─────────────────────────────────────────");
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error(`User: ${req.user?.id || "anonymous"}`);
  console.error(`${err.name || "Error"}: ${err.message}`);
  if (prismaMapped?.logMeta) console.error("Prisma meta:", prismaMapped.logMeta);
  console.error(err.stack);
  console.error("─────────────────────────────────────────");

  return res.status(statusCode).json({
    success: false,
    message: clientMessage,
    ...(extraDetails ? { extraDetails } : {}),
  });
};

export default errorMiddleware;

// const errorMiddleware = (err, req, res, next) => {

//     const status = err.statusCode || err.status || 500;

//     const message = err.message || "BACKEND ERROR";

//     const extraDetails = err.extraDetails || "Error from Backend";

//     return res.status(status).json({ message, extraDetails });

// };

// export default errorMiddleware;