export function getUserProfileLabel(user: { lastName: string; name: string; username: string }) {
  return `${user.name} ${user.lastName}`.trim() || user.username;
}
