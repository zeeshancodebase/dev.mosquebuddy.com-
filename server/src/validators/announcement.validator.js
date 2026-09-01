import createHttpError from "../utils/createHttpError.js";
import cleanValue from "../utils/cleanValue.js";

const VALID_SCOPES = ["venue", "area", "city", "state"];
const VALID_CATEGORIES = ["event", "eid", "urgent", "class", "general"];
const TITLE_MAX_LENGTH = 120;
const BODY_MAX_LENGTH = 1000;
const TIME_TEXT_MAX_LENGTH = 60;

export function validateAnnouncementInput(body, { isUpdate = false } = {}) {
  const errors = [];

  const scope = cleanValue(body.scope);
  const category = cleanValue(body.category) || "general";
  const title = cleanValue(body.title);
  const bodyText = cleanValue(body.body);
  const venueId = cleanValue(body.venueId);
  const areaId = cleanValue(body.areaId);
  const cityId = cleanValue(body.cityId);
  const stateId = cleanValue(body.stateId);
  const eventDate = cleanValue(body.eventDate);
  const eventTimeText = cleanValue(body.eventTimeText);

  // scope: required on create, optional-but-validated on update
  if (!isUpdate || body.scope !== undefined) {
    if (!scope) errors.push("scope is required");
    else if (!VALID_SCOPES.includes(scope)) {
      errors.push(`scope must be one of: ${VALID_SCOPES.join(", ")}`);
    }
  }

  if (category && !VALID_CATEGORIES.includes(category)) {
    errors.push(`category must be one of: ${VALID_CATEGORIES.join(", ")}`);
  }

  if (!isUpdate) {
    if (!title) errors.push("title is required");
    if (!bodyText) errors.push("body is required");
  } else {
    if (body.title !== undefined && !title) errors.push("title cannot be empty");
    if (body.body !== undefined && !bodyText) errors.push("body cannot be empty");
  }

  if (title && title.length > TITLE_MAX_LENGTH) {
    errors.push(`title must be under ${TITLE_MAX_LENGTH} characters`);
  }
  if (bodyText && bodyText.length > BODY_MAX_LENGTH) {
    errors.push(`body must be under ${BODY_MAX_LENGTH} characters`);
  }
  if (eventTimeText && eventTimeText.length > TIME_TEXT_MAX_LENGTH) {
    errors.push(`eventTimeText must be under ${TIME_TEXT_MAX_LENGTH} characters`);
  }

  // Exactly one scope FK must be set, matching `scope`. This mirrors how
  // VenueSuggestion uses nullable scoped FKs (see schema doc §12).
  if (scope) {
    const scopeFieldMap = { venue: venueId, area: areaId, city: cityId, state: stateId };
    if (!scopeFieldMap[scope]) {
      errors.push(`${scope}Id is required when scope is '${scope}'`);
    }
    const strayFields = Object.entries(scopeFieldMap).filter(
      ([key, val]) => key !== scope && !!val
    );
    if (strayFields.length > 0) {
      errors.push(`Only ${scope}Id should be set when scope is '${scope}'`);
    }
  }

  if (eventDate && isNaN(Date.parse(eventDate))) {
    errors.push("eventDate must be a valid date");
  }

  if (errors.length > 0) {
    throw createHttpError(400, errors.join("; "));
  }

  return {
    scope,
    category,
    title,
    body: bodyText,
    venueId: scope === "venue" ? venueId : null,
    areaId: scope === "area" ? areaId : null,
    cityId: scope === "city" ? cityId : null,
    stateId: scope === "state" ? stateId : null,
    eventDate: eventDate ? new Date(eventDate) : null,
    eventTimeText,
    isPinned: !!body.isPinned,
  };
}