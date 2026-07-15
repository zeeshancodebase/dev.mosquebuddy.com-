// server/src/utils/createHttpError.js

const createHttpError = (statusCode, message, extraDetails = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.extraDetails = extraDetails;
  error.isOperational = true; // marks this as a deliberate error you wrote — safe to show the client
  return error;
};

export default createHttpError;

// /*
// |--------------------------------------------------------------------------
// | Helper: Create HTTP Error
// |--------------------------------------------------------------------------
// | This helper creates an error object that our global error middleware can read.
// | Instead of sending response manually in every catch block, we pass errors to next().
// */

// const createHttpError = (statusCode, message, extraDetails = null) => {
//   const error = new Error(message);
//   error.statusCode = statusCode;
//   error.extraDetails = extraDetails;
//   return error;
// };

// export default createHttpError;