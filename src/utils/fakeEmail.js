export function fakeEmail(username) {
  return `${encodeURIComponent(username.toLowerCase().replace(/\s+/g, "_"))}@delete.theearth`;
}