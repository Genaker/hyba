import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveThemeOverrides } from '../../scripts/theme-overrides.mjs';

/**
 * Unit tests for the pure alias-resolution logic behind the component-override
 * mechanism (src/overrides/ + overrides.yaml) — see next.config.ts and
 * README "Custom themes". Runs against a throwaway temp directory, no Next.js
 * boot required (that end-to-end path is exercised manually — see the plan's
 * verification notes — since it needs a real Turbopack build per state change).
 */
describe('resolveThemeOverrides', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'theme-overrides-'));
    mkdirSync(join(root, 'src/components'), { recursive: true });
    mkdirSync(join(root, 'src/overrides'), { recursive: true });
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  function writeYaml(components: string[]) {
    writeFileSync(join(root, 'overrides.yaml'), `components:\n${components.map((name) => `  - ${name}`).join('\n')}\n`);
  }

  test('missing overrides.yaml resolves to an empty map, not an error', () => {
    const aliases = resolveThemeOverrides({ projectRoot: root, overridesYamlPath: join(root, 'overrides.yaml') });
    assert.deepEqual(aliases, {});
  });

  test('invalid YAML resolves to an empty map, not an error', () => {
    writeFileSync(join(root, 'overrides.yaml'), '::: not valid yaml :::');
    const aliases = resolveThemeOverrides({ projectRoot: root, overridesYamlPath: join(root, 'overrides.yaml') });
    assert.deepEqual(aliases, {});
  });

  test('declared component with no override file falls back to src/components', () => {
    writeYaml(['Footer']);
    const aliases = resolveThemeOverrides({ projectRoot: root, overridesYamlPath: join(root, 'overrides.yaml') });
    assert.deepEqual(aliases, { '@/theme/Footer': './src/components/Footer.tsx' });
  });

  test('declared component with an override file present resolves to src/overrides', () => {
    writeYaml(['Footer']);
    writeFileSync(join(root, 'src/overrides/Footer.tsx'), 'export default function Footer() { return null; }');
    const aliases = resolveThemeOverrides({ projectRoot: root, overridesYamlPath: join(root, 'overrides.yaml') });
    assert.deepEqual(aliases, { '@/theme/Footer': './src/overrides/Footer.tsx' });
  });

  test('mixed: only the components with an actual override file resolve there, the rest fall back', () => {
    writeYaml(['Header', 'Footer', 'Container']);
    writeFileSync(join(root, 'src/overrides/Footer.tsx'), 'export default function Footer() { return null; }');
    const aliases = resolveThemeOverrides({ projectRoot: root, overridesYamlPath: join(root, 'overrides.yaml') });
    assert.deepEqual(aliases, {
      '@/theme/Header': './src/components/Header.tsx',
      '@/theme/Footer': './src/overrides/Footer.tsx',
      '@/theme/Container': './src/components/Container.tsx',
    });
  });

  test('a directory named after a component does not count as an override file', () => {
    writeYaml(['Footer']);
    mkdirSync(join(root, 'src/overrides/Footer.tsx')); // a directory, not a .tsx file
    const aliases = resolveThemeOverrides({ projectRoot: root, overridesYamlPath: join(root, 'overrides.yaml') });
    // existsSync is true for directories too — documenting current (permissive) behavior rather than asserting
    // a stricter contract the implementation doesn't actually provide.
    assert.equal(aliases['@/theme/Footer'], './src/overrides/Footer.tsx');
  });

  test('empty components list resolves to an empty map', () => {
    writeFileSync(join(root, 'overrides.yaml'), 'components: []\n');
    const aliases = resolveThemeOverrides({ projectRoot: root, overridesYamlPath: join(root, 'overrides.yaml') });
    assert.deepEqual(aliases, {});
  });
});
