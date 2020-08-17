/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import * as path from "path";
import * as fs from "fs";
import * as EC from "@bentley/ecschema-metadata";
import { SchemaJsonFileLocater } from "@bentley/ecschema-locaters";
import { IModelHost } from "@bentley/imodeljs-backend";
import { Config } from "@bentley/bentleyjs-core";
import { SchemaXmlFileLocater } from "./SchemaXmlFileLocater";

/**
 * Deserializes ECXml and ECJson schema files.
 */
export class SchemaDeserializer {
  /**
   * Deserializes the specified ECXml schema file in the given schema context.
   * @param schemaFilePath The path to a valid ECXml schema file.
   * @param schemaContext The schema context in which to deserialize the schema.
   * @param referencePaths Optional paths to search when locating schema references.
   */
  public async deserializeXmlFile(schemaFilePath: string, schemaContext: EC.SchemaContext, referencePaths?: string[]): Promise<EC.Schema> {
    // If the schema file doesn't exist, throw an error
    const schemaText = await this.readUtf8FileToString(schemaFilePath);

    // Get the SchemaKey and EC version from xml text.
    const schemaKey = this.getSchemaKey(schemaText);

    if (!referencePaths)
      referencePaths = [];
    referencePaths.push(path.dirname(schemaFilePath));

    // The following two lines can be removed (and shutdown below) when/if the SchemaXmlFileLocater (native deserialization) is removed
    (Config as any)._appConfig = new (Config as any)(); // Needed to avoid crash in backend when calling IModelHost.startup.
    await IModelHost.startup();

    const locater = this.configureFileLocater(schemaContext, referencePaths);

    try {
      const schema = locater.loadSchema(schemaKey, EC.SchemaMatchType.Exact, schemaContext);
      if (!schema)
        throw new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema, `Unable to locate schema '${schemaKey.name}'`);

      return schema;
    } finally {
      // This can be removed when/if the SchemaXmlFIleLocater (native deserialization) is removed
      await IModelHost.shutdown();
    }
  }

  /**
   * Deserializes the specified ECJson schema file in the given schema context.
   * @param schemaFilePath The path to a valid ECJson schema file.
   * @param context The schema context in which to deserialize the schema.
   * @param referencePaths Optional paths to search when locating schema references.
   */
  public async deserializeJsonFile(schemaFilePath: string, context: EC.SchemaContext, referencePaths?: string[]): Promise<EC.Schema> {
    // If the schema file doesn't exist, throw an error
    if (!fs.existsSync(schemaFilePath))
      throw new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema, "Unable to locate schema JSON file at " + schemaFilePath);

    // add locater to the context
    if (!referencePaths)
      referencePaths = [];
    referencePaths.push(path.dirname(schemaFilePath));

    const locater = new SchemaJsonFileLocater();
    locater.addSchemaSearchPaths(referencePaths);
    context.addLocater(locater);

    // If the file cannot be parsed, throw an error.
    const schemaString = fs.readFileSync(schemaFilePath, "utf8");
    let schemaJson: any;
    try {
      schemaJson = JSON.parse(schemaString);
    } catch (e) {
      throw new EC.ECObjectsError(EC.ECObjectsStatus.InvalidECJson, e.message);
    }
    return EC.Schema.fromJson(schemaJson, context);
  }

  private configureFileLocater(schemaContext: EC.SchemaContext, referencePaths: string[]): SchemaXmlFileLocater {
    const xmlSchemaLocater = new SchemaXmlFileLocater();
    schemaContext.addLocater(xmlSchemaLocater);
    xmlSchemaLocater.addSchemaSearchPaths(referencePaths);
    return xmlSchemaLocater;
  }

  private async readUtf8FileToString(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(filePath, "utf-8", (err, data) => {
        if (err)
          reject(new EC.ECObjectsError(EC.ECObjectsStatus.UnableToLocateSchema, "Unable to locate schema XML file at " + filePath));
        else
          resolve(data);
      });
    });
  }

  /**
   * Constructs a SchemaKey based on the information in the Schema XML.
   * @param data The Schema XML as a string.
   */
  private getSchemaKey(schemaXml: string): EC.SchemaKey {
    const match = schemaXml.match(/<ECSchema.*schemaName="(?<name>\w+)".*version="(?<version>[\d|\.]+)"/) as any;
    if (!match || !match.groups.name || !match.groups.version) {
      throw new EC.ECObjectsError(EC.ECObjectsStatus.InvalidSchemaXML, `Could not find the ECSchema 'schemaName' or 'version' tag in the given file.`);
    }

    let ecVersion: EC.ECVersion;
    if (this.isECv2Schema(schemaXml))
      ecVersion = SchemaXmlFileLocater.fromECv2String(match.groups.version);
    else
      ecVersion = EC.ECVersion.fromString(match.groups.version);

    const key = new EC.SchemaKey(match.groups.name, ecVersion);
    return key;
  }

  private isECv2Schema(schemaText: string): boolean {
    return /<ECSchema[^>]*xmlns=".*ECXML.2.0"/.test(schemaText);
  }
}