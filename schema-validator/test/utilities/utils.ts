/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs-extra";
import * as path from "path";

declare const __dirname: string;

export function getAssetsDir(): string {
  return path.normalize(__dirname + "/../assets/");
}

export function getKOQAssetDir(): string {
  return path.normalize(__dirname + "/../assets/koqSuppressions/");
}

export function getRelationshipAssetDir(): string {
  return path.normalize(__dirname + "/../assets/relationshipSuppressions/");
}

export function getXmlDeserializationDir(): string {
  return path.normalize(__dirname + "/../assets/xml-deserialization/");
}

export function getReferencesDir(): string {
  return path.normalize(__dirname + "/../assets/references/");
}

export function getOutDir(): string {
  const outputDir = path.normalize(__dirname + "/../../lib/test/output/");
  fs.ensureDirSync(outputDir);
  return outputDir;
}

export function normalizeLineEnds(s: string): string {
  return s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
