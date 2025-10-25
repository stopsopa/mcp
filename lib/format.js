export function format(data) {
  if (Array.isArray(data)) {
    return data.map(format);
  }

  if (isObject(data)) {
    const formattedObject = {};

    for (const [key, value] of Object.entries(data)) {
      formattedObject[key] = format(value);
    }

    return formattedObject;
  }

  if (typeof data === "string" && data.includes("\n")) {
    return data.split("\n");
  }

  return data;
}

function isObject(o) {
  return Object.prototype.toString.call(o) === "[object Object]";
}
