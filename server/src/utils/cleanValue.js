

/*
|--------------------------------------------------------------------------
| Helper: Clean User Input
|--------------------------------------------------------------------------
| This converts empty strings into null and trims normal text.
| Useful because email/phone are optional, but empty string should not be stored.
*/
const cleanValue = (value) => {
  if (typeof value !== "string") return value;

  const trimmedValue = value.trim();

  return trimmedValue === "" ? null : trimmedValue;
};

export default cleanValue;