import fs from "node:fs";

// Node.js 24 Windows 이슈 패치: 비-심볼릭 링크 파일에 대해 fs.readlink가 EISDIR을 던지는 문제 우회
const originalReadlink = fs.readlink;
const originalReadlinkSync = fs.readlinkSync;

fs.readlink = function (path, options, callback) {
  const cb = typeof options === "function" ? options : callback;
  const opts = typeof options === "function" ? null : options;
  return originalReadlink.call(fs, path, opts, (err, linkString) => {
    if (err && err.code === "EISDIR") {
      const customErr = new Error(`EINVAL: invalid argument, readlink '${path}'`);
      customErr.code = "EINVAL";
      return cb(customErr);
    }
    cb(err, linkString);
  });
};

fs.readlinkSync = function (path, options) {
  try {
    return originalReadlinkSync.call(fs, path, options);
  } catch (err) {
    if (err.code === "EISDIR") {
      const customErr = new Error(`EINVAL: invalid argument, readlink '${path}'`);
      customErr.code = "EINVAL";
      throw customErr;
    }
    throw err;
  }
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
