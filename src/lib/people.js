/** Community never shows a full name: first name only when the author opted in. */
export const firstName = (name) => String(name || "").trim().split(/\s+/)[0] || "";

export const authorLabel = (post) =>
  post?.showName && post?.employeeName
    ? `${firstName(post.employeeName)} · ${post.floorCode}`
    : `${post?.floorCode || ""} colleague`;

export const avatarInitials = (name) =>
  firstName(name)
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();