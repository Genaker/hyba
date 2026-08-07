#!/usr/bin/env node
/**
 * Resolves the Turbopack `resolveAlias` map for the component-override
 * mechanism (see overrides.yaml + README "Custom themes"). For each
 * component name declared in overrides.yaml, `@/theme/<Name>` resolves to
 * src/overrides/<Name>.tsx if that file exists, else falls back to
 * src/components/<Name>.tsx.
 *
 * `@/components/<Name>` itself is never aliased — an override file extends
 * the original by importing it through that untouched path. Aliasing the
 * same specifier both ways would create a cycle (the override importing the
 * "original" would just resolve back to itself).
 *
 * Pure function of the filesystem — no Next.js/React dependency — so it's
 * both usable from next.config.ts (plain Node, evaluated at startup) and
 * unit-testable in isolation (see tests/unit/theme-overrides.test.ts).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

/**
 * Turbopack's `resolveAlias` resolves values the same way an import
 * specifier is resolved (see its docs example: `underscore: 'lodash'`) —
 * not as raw filesystem paths. So values here are project-root-relative
 * specifiers (`./src/components/Header.tsx`), computed by checking
 * (absolute, filesystem) whether an override file exists on disk.
 *
 * @param {{ projectRoot: string, overridesYamlPath: string, overridesRelDir?: string, componentsRelDir?: string }} options
 * @returns {Record<string, string>}
 */
export function resolveThemeOverrides({ projectRoot, overridesYamlPath, overridesRelDir = 'src/overrides', componentsRelDir = 'src/components' }) {
  let names = [];
  try {
    const parsed = parseYaml(readFileSync(overridesYamlPath, 'utf8'));
    names = Array.isArray(parsed?.components) ? parsed.components : [];
  } catch {
    // missing/invalid overrides.yaml → no themeable components, not a build error
  }

  /** @type {Record<string, string>} */
  const aliases = {};
  for (const name of names) {
    const overrideExists = existsSync(join(projectRoot, overridesRelDir, `${name}.tsx`));
    const relDir = overrideExists ? overridesRelDir : componentsRelDir;
    aliases[`@/theme/${name}`] = `./${relDir}/${name}.tsx`;
  }
  return aliases;
}
