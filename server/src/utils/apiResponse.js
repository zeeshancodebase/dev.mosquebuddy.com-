// server\src\utils\apiResponse.js
export function successResponse(
  res,
  {
    statusCode = 200,
    message = "Success",
    data = null,
    meta = null,
    pagination = null,
  }
) {
  const response = {
    success: true,
    message,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
}