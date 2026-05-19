import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const locales = ["en", "ko", "zh"];
const messageDir = path.join(root, "messages");
const srcDir = path.join(root, "src");
const categoryKeys = [
  "COMEDY",
  "ROMANCE",
  "ACTION",
  "THRILLER",
  "DRAMA",
  "PERIODPLAY",
  "FANTASY",
  "HIGHTEEN",
  "ADULT",
  "HUMANE",
  "CALM",
  "VARIETYSHOW",
  "NOTIFICATION",
  "MSPOST",
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function flatten(value, prefix = "") {
  const result = {};

  for (const [key, nested] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      Object.assign(result, flatten(nested, nextKey));
    } else {
      result[nextKey] = nested;
    }
  }

  return result;
}

function hasMessage(messages, key) {
  let cursor = messages;

  for (const part of key.split(".")) {
    if (!cursor || typeof cursor !== "object" || !(part in cursor)) {
      return false;
    }

    cursor = cursor[part];
  }

  return true;
}

function walkFiles(dir) {
  const result = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...walkFiles(fullPath));
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      result.push(fullPath);
    }
  }

  return result;
}

function stringLiteral(node) {
  return node && ts.isStringLiteralLike(node) ? node.text : null;
}

function collectTranslationCalls(file) {
  const source = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") || file.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const translators = new Map();
  const calls = [];

  function collectTranslators(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      let initializer = node.initializer;

      if (ts.isAwaitExpression(initializer)) {
        initializer = initializer.expression;
      }

      if (
        ts.isCallExpression(initializer) &&
        ts.isIdentifier(initializer.expression) &&
        ["useTranslations", "getTranslations"].includes(initializer.expression.text)
      ) {
        const namespace = stringLiteral(initializer.arguments[0]);

        if (namespace) {
          translators.set(node.name.text, namespace);
        }
      }
    }

    ts.forEachChild(node, collectTranslators);
  }

  function collectCalls(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      translators.has(node.expression.text)
    ) {
      const key = stringLiteral(node.arguments[0]);
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));

      calls.push({
        file: path.relative(root, file),
        line: position.line + 1,
        namespace: translators.get(node.expression.text),
        key,
      });
    }

    ts.forEachChild(node, collectCalls);
  }

  collectTranslators(sourceFile);
  collectCalls(sourceFile);

  return calls;
}

const messages = Object.fromEntries(
  locales.map((locale) => [locale, readJson(path.join(messageDir, `${locale}.json`))]),
);
const flattened = Object.fromEntries(
  locales.map((locale) => [locale, flatten(messages[locale])]),
);
const allMessageKeys = [...new Set(Object.values(flattened).flatMap((value) => Object.keys(value)))].sort();
const errors = [];

for (const locale of locales) {
  for (const key of allMessageKeys) {
    if (!(key in flattened[locale])) {
      errors.push(`${locale} is missing message key ${key}`);
    }
  }

  for (const key of categoryKeys) {
    for (const categoryKey of [key, key.toLowerCase()]) {
      if (!hasMessage(messages[locale], `Category.${categoryKey}`)) {
        errors.push(`${locale} is missing Category.${categoryKey}`);
      }
    }
  }
}

const calls = walkFiles(srcDir).flatMap(collectTranslationCalls);

for (const call of calls) {
  if (!call.key) continue;

  for (const locale of locales) {
    const fullKey = `${call.namespace}.${call.key}`;

    if (!hasMessage(messages[locale], fullKey)) {
      errors.push(`${locale} is missing ${fullKey} used at ${call.file}:${call.line}`);
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`i18n audit passed: ${locales.length} locales, ${allMessageKeys.length} message keys, ${calls.length} translation calls.`);
