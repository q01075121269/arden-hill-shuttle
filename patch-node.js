const fs = require("fs");

const origSync = fs.readlinkSync;
fs.readlinkSync = function (p, o) {
  try {
    return origSync.call(fs, p, o);
  } catch (e) {
    if (e && e.code === "EISDIR") {
      const err = new Error(`EINVAL: invalid argument, readlink '${p}'`);
      err.code = "EINVAL";
      throw err;
    }
    throw e;
  }
};

const origAsync = fs.readlink;
fs.readlink = function (p, o, cb) {
  const c = typeof o === "function" ? o : cb;
  const opt = typeof o === "function" ? null : o;
  return origAsync.call(fs, p, opt, (err, res) => {
    if (err && err.code === "EISDIR") {
      const e = new Error(`EINVAL: invalid argument, readlink '${p}'`);
      e.code = "EINVAL";
      return c(e);
    }
    c(err, res);
  });
};

if (fs.promises) {
  const origPromises = fs.promises.readlink;
  fs.promises.readlink = async function (p, o) {
    try {
      return await origPromises.call(fs.promises, p, o);
    } catch (e) {
      if (e && e.code === "EISDIR") {
        const err = new Error(`EINVAL: invalid argument, readlink '${p}'`);
        err.code = "EINVAL";
        throw err;
      }
      throw e;
    }
  };
}
