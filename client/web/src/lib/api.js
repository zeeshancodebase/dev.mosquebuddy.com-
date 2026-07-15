// src/lib/api.js
// Central API layer — all backend communication goes through here

import toast from "react-hot-toast";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Get token from localStorage
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sabeel_token");
}

// Build headers — attaches Bearer token if available
function buildHeaders(isFormData = false) {
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// Handle response — parses JSON and throws on error
async function handleResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.message || data?.extraDetails || "Something went wrong";
    throw new Error(message);
  }

  return data;
}

// Core request function
async function request(method, endpoint, body = null, isFormData = false) {
  const config = {
    method,
    headers: buildHeaders(isFormData),
  };

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch (err) {
    // console.log("Error",err)
    // Network-level failure — server down, no internet, CORS, etc.
    const message = "Could not reach the server. Please check your connection.";
    toast.error(message);
    throw new Error(message);
  }

  try {
    return await handleResponse(response);
  } catch (err) {
    toast.error(err.message || "Something went wrong");
    throw err;
  }
}

// HTTP method helpers
export const api = {
  get: (endpoint) => request("GET", endpoint),
  post: (endpoint, body) => request("POST", endpoint, body),
  patch: (endpoint, body) => request("PATCH", endpoint, body),
  put: (endpoint, body) => request("PUT", endpoint, body),
  delete: (endpoint) => request("DELETE", endpoint),
  upload: (endpoint, formData) => request("POST", endpoint, formData, true),
};