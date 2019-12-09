/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/

import { expect } from "chai";
import * as sinon from "sinon";

import { SchemaCompareReporter } from "../src/SchemaCompareReporter";
import {
  SchemaCompareDiagnostics, SchemaChanges, Schema, SchemaContext, EntityClass, PrimitiveProperty, Mixin,
  RelationshipClass, RelationshipConstraint, RelationshipEnd, Enumeration, AnyEnumerator, KindOfQuantity, Format,
  Unit, PropertyCategory, UnitSystem, InvertedUnit, Phenomenon, Constant,
} from "@bentley/ecschema-metadata/lib/ecschema-metadata";

class TestSchemaCompareReporter extends SchemaCompareReporter {
  public reportFormattedChange(_message: string): void {
    // tslint:disable-next-line:no-console
    // console.log(message);
  }
}

describe("SchemaCompareReporter Tests", () => {
  let schemaA: Schema;
  let schemaB: Schema;
  let reporterSpy: sinon.SinonSpy<[string]>;

  beforeEach(async () => {
    schemaA = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    schemaB = new Schema(new SchemaContext(), "TestSchema", "ts", 1, 0, 0);
    reporterSpy = sinon.spy(TestSchemaCompareReporter.prototype, "reportFormattedChange");
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("SchemaChanges", () => {
    it("Different Schemas, with property value change, correct message reported", async () => {
      schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
      const diag = new SchemaCompareDiagnostics.SchemaDelta(schemaA, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("-Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\tLabel: LabelA -> LabelB")).to.be.true;
    });

    it("Different Schemas, with schema item added, correct message reported", async () => {
      const testClass = new EntityClass(schemaB, "TestClass");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(testClass, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tClass(TestClass)")).to.be.true;
    });

    it("Property value change, correct message reported", async () => {
      const diag = new SchemaCompareDiagnostics.SchemaDelta(schemaA, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tLabel: LabelA -> LabelB")).to.be.true;
    });

    it("CustomAttribute instance removed, correct message reported", async () => {
      const ca = { className: "TestSchema.TestCustomAttribute" };
      const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(schemaA, [ca]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tCustomAttributes")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
    });

    it("CustomAttribute instance added, correct message reported", async () => {
      const ca = { className: "TestSchema.TestCustomAttribute" };
      const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(schemaB, [ca]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tCustomAttributes")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
    });

    it("CustomAttribute removed, different schemas, correct message reported", async () => {
      schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
      const ca = { className: "TestSchema.TestCustomAttribute" };
      const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(schemaA, [ca]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("-Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\tCustomAttributes")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
    });

    it("Schema reference removed, correct message reported", async () => {
      const refSchema = new Schema(new SchemaContext(), "ReferenceSchema", "ref", 1, 0, 0);
      const diag = new SchemaCompareDiagnostics.SchemaReferenceMissing(schemaA, [refSchema]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tSchemaReferences")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tSchema(ReferenceSchema)")).to.be.true;
    });

    it("Schema reference added, correct message reported", async () => {
      const refSchema = new Schema(new SchemaContext(), "ReferenceSchema", "ref", 1, 0, 0);
      const diag = new SchemaCompareDiagnostics.SchemaReferenceMissing(schemaB, [refSchema]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tSchemaReferences")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tSchema(ReferenceSchema)")).to.be.true;
    });
  });

  describe("ClassChanges", () => {
    it("Class removed, different Schemas, correct message reported", async () => {
      schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
      const classA = new EntityClass(schemaA, "TestClass");
      const diag = new SchemaCompareDiagnostics.ClassDelta(classA, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("-Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\tClasses")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tClass(TestClass)")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\t\tLabel: LabelA -> LabelB")).to.be.true;
    });

    it("Class added, different Schemas, correct message reported", async () => {
      schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
      const classA = new EntityClass(schemaB, "TestClass");
      const diag = new SchemaCompareDiagnostics.ClassDelta(classA, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaB);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("+Schema(TestSchemaB)")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\tClasses")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tClass(TestClass)")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\t\tLabel: LabelA -> LabelB")).to.be.true;
    });

    it("Base Class different, correct message reported", async () => {
      const classA = new EntityClass(schemaA, "TestClass");
      const baseClassA = new EntityClass(schemaA, "BaseClassA");
      const baseClassB = new EntityClass(schemaB, "BaseClassB");
      const diag = new SchemaCompareDiagnostics.BaseClassDelta(classA, [baseClassA, baseClassB]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tBaseClass: TestSchema.BaseClassA -> TestSchema.BaseClassB")).to.be.true;
    });

    it("Property value change, correct message reported", async () => {
      const classA = new EntityClass(schemaA, "TestClass");
      const diag = new SchemaCompareDiagnostics.ClassDelta(classA, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tLabel: LabelA -> LabelB")).to.be.true;
    });

    it("CustomAttribute instance removed, correct message reported", async () => {
      const classA = new EntityClass(schemaA, "TestClass");
      const ca = { className: "TestSchema.TestCustomAttribute" };
      const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(classA, [ca]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tCustomAttributes")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
    });

    it("CustomAttribute instance added, correct message reported", async () => {
      const classA = new EntityClass(schemaB, "TestClass");
      const ca = { className: "TestSchema.TestCustomAttribute" };
      const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(classA, [ca]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tCustomAttributes")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
    });

    it("EntityClass Mixin removed, correct message reported", async () => {
      const classA = new EntityClass(schemaA, "TestClass");
      const testMixin = new Mixin(schemaA, "TestMixin");
      const diag = new SchemaCompareDiagnostics.EntityMixinMissing(classA, [testMixin]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tMixins")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\t\t\tMixin: TestSchema.TestMixin")).to.be.true;
    });

    it("EntityClass Mixin added, correct message reported", async () => {
      const classA = new EntityClass(schemaB, "TestClass");
      const testMixin = new Mixin(schemaB, "TestMixin");
      const diag = new SchemaCompareDiagnostics.EntityMixinMissing(classA, [testMixin]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tMixins")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\t\t\tMixin: TestSchema.TestMixin")).to.be.true;
    });

    describe("RelationshipConstraint changes", () => {
      it("Relationship source constraint property value change, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Source);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintDelta(constraint, ["polymorphic", true, false]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tSource")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tPolymorphic: true -> false")).to.be.true;
      });

      it("Relationship source constraint class removed, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraintClass = new EntityClass(schemaA, "TestConstraintClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Source);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintClassMissing(constraint, [constraintClass]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tSource")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tConstraintClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("-\t\t\t\t\tConstraintClass: TestSchema.TestConstraintClass")).to.be.true;
      });

      it("Relationship source constraint class added, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaB, "TestClass");
        const constraintClass = new EntityClass(schemaA, "TestConstraintClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Source);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintClassMissing(constraint, [constraintClass]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tSource")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tConstraintClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\tConstraintClass: TestSchema.TestConstraintClass")).to.be.true;
      });

      it("Relationship source constraint CustomAttributeInstance removed, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Source);
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(constraint, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tSource")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tCustomAttributes")).to.be.true;
        expect(reporterSpy.calledWithExactly("-\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
      });

      it("Relationship source constraint CustomAttributeInstance added, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaB, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Source);
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(constraint, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tSource")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tCustomAttributes")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
      });

      it("Relationship target constraint property value change, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Target);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintDelta(constraint, ["polymorphic", true, false]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tTarget")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tPolymorphic: true -> false")).to.be.true;
      });

      it("Relationship target constraint class removed, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraintClass = new EntityClass(schemaA, "TestConstraintClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Target);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintClassMissing(constraint, [constraintClass]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tTarget")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tConstraintClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("-\t\t\t\t\tConstraintClass: TestSchema.TestConstraintClass")).to.be.true;
      });

      it("Relationship target constraint class added, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaB, "TestClass");
        const constraintClass = new EntityClass(schemaB, "TestConstraintClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Target);
        const diag = new SchemaCompareDiagnostics.RelationshipConstraintClassMissing(constraint, [constraintClass]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tTarget")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tConstraintClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\tConstraintClass: TestSchema.TestConstraintClass")).to.be.true;
      });

      it("Relationship target constraint CustomAttributeInstance removed, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaA, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Target);
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(constraint, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tTarget")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tCustomAttributes")).to.be.true;
        expect(reporterSpy.calledWithExactly("-\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
      });

      it("Relationship target constraint CustomAttributeInstance added, correct message reported", async () => {
        const testClass = new RelationshipClass(schemaB, "TestClass");
        const constraint = new RelationshipConstraint(testClass, RelationshipEnd.Target);
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(constraint, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tTarget")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tCustomAttributes")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
      });
    });

    describe("PropertyChanges", () => {
      it("Property removed, correct message reported", async () => {
        const classA = new EntityClass(schemaA, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const diag = new SchemaCompareDiagnostics.PropertyMissing(property);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tProperties")).to.be.true;
        expect(reporterSpy.calledWithExactly("-\t\t\t\tProperty(TestProperty)")).to.be.true;
      });

      it("Property added, correct message reported", async () => {
        const classA = new EntityClass(schemaB, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const diag = new SchemaCompareDiagnostics.PropertyMissing(property);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tProperties")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\tProperty(TestProperty)")).to.be.true;
      });

      it("Property value change, correct message reported", async () => {
        const classA = new EntityClass(schemaA, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const diag = new SchemaCompareDiagnostics.PropertyDelta(property, ["label", "LabelA", "LabelB"]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tProperties")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tProperty(TestProperty)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\t\tLabel: LabelA -> LabelB")).to.be.true;
      });

      it("CustomAttribute instance removed, correct message reported", async () => {
        const classA = new EntityClass(schemaA, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(property, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tProperties")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tProperty(TestProperty)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\t\tCustomAttributes")).to.be.true;
        expect(reporterSpy.calledWithExactly("-\t\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
      });

      it("CustomAttribute instance added, correct message reported", async () => {
        const classA = new EntityClass(schemaB, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(property, [ca]);
        const changes = new SchemaChanges(schemaA);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\tProperties")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\tProperty(TestProperty)")).to.be.true;
        expect(reporterSpy.calledWithExactly("!\t\t\t\t\tCustomAttributes")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
      });

      it("CustomAttribute instance added, different schemas, correct message reported", async () => {
        schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
        const classA = new EntityClass(schemaB, "TestClass");
        const property = new PrimitiveProperty(classA, "TestProperty");
        const ca = { className: "TestSchema.TestCustomAttribute" };
        const diag = new SchemaCompareDiagnostics.CustomAttributeInstanceClassMissing(property, [ca]);
        const changes = new SchemaChanges(schemaB);
        changes.addDiagnostic(diag);
        const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

        reporter.report(changes);

        expect(reporterSpy.calledWithExactly("+Schema(TestSchemaB)")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\tClasses")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\tClass(TestClass)")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\tProperties")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\tProperty(TestProperty)")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\tCustomAttributes")).to.be.true;
        expect(reporterSpy.calledWithExactly("+\t\t\t\t\t\tCustomAttribute: TestSchema.TestCustomAttribute")).to.be.true;
      });
    });
  });

  describe("EnumerationChanges", () => {
    it("Enumeration property change, different Schemas, correct message reported", async () => {
      schemaB = new Schema(new SchemaContext(), "TestSchemaB", "b", 1, 0, 0);
      const schemaItem = new Enumeration(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.EnumerationDelta(schemaItem, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("-Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\tEnumerations")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tEnumeration(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\t\tLabel: LabelA -> LabelB")).to.be.true;
    });

    it("Enumeration removed, correct message reported", async () => {
      const schemaItem = new Enumeration(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tEnumeration(TestItem)")).to.be.true;
    });

    it("Enumeration added, correct message reported", async () => {
      const schemaItem = new Enumeration(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tEnumeration(TestItem)")).to.be.true;
    });

    it("Enumeration property value change, correct message reported", async () => {
      const schemaItem = new Enumeration(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.EnumerationDelta(schemaItem, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tEnumeration(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tLabel: LabelA -> LabelB")).to.be.true;
    });

    it("Enumerator removed, correct message reported", async () => {
      const enumerator: AnyEnumerator = {
        name: "A",
        value: 1,
        label: "LabelA",
      };
      const schemaItem = new Enumeration(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.EnumeratorMissing(schemaItem, [enumerator]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tEnumeration(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tEnumerators")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\t\t\tEnumerator(A)")).to.be.true;
    });

    it("Enumerator added, correct message reported", async () => {
      const enumerator: AnyEnumerator = {
        name: "A",
        value: 1,
        label: "LabelA",
      };
      const schemaItem = new Enumeration(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.EnumeratorMissing(schemaItem, [enumerator]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tEnumeration(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tEnumerators")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\t\t\tEnumerator(A)")).to.be.true;
    });

    it("Enumerator property value change, correct message reported", async () => {
      const enumerator: AnyEnumerator = {
        name: "A",
        value: 1,
        label: "LabelA",
      };
      const schemaItem = new Enumeration(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.EnumeratorDelta(schemaItem, [enumerator, "label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tEnumerations")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tEnumeration(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tEnumerators")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\t\tEnumerator(A)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\t\t\tLabel: LabelA -> LabelB")).to.be.true;
    });
  });

  describe("KindOfQuantityChanges", () => {
    it("KindOfQuantity removed, correct message reported", async () => {
      const schemaItem = new KindOfQuantity(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tKindOfQuantities")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tKindOfQuantity(TestItem)")).to.be.true;
    });

    it("KindOfQuantity added, correct message reported", async () => {
      const schemaItem = new KindOfQuantity(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tKindOfQuantities")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tKindOfQuantity(TestItem)")).to.be.true;
    });

    it("KindOfQuantity property value change, correct message reported", async () => {
      const schemaItem = new KindOfQuantity(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.KoqDelta(schemaItem, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tKindOfQuantities")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tKindOfQuantity(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tLabel: LabelA -> LabelB")).to.be.true;
    });

    it("KindOfQuantity presentation unit removed, correct message reported", async () => {
      const schemaItem = new KindOfQuantity(schemaA, "TestItem");
      const format = new Format(schemaA, "TestFormat");
      const diag = new SchemaCompareDiagnostics.PresentationUnitMissing(schemaItem, [format]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tKindOfQuantities")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tKindOfQuantity(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tPresentationUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\t\t\tUnit: TestSchema.TestFormat")).to.be.true;
    });

    it("KindOfQuantity presentation unit added, correct message reported", async () => {
      const schemaItem = new KindOfQuantity(schemaB, "TestItem");
      const format = new Format(schemaB, "TestFormat");
      const diag = new SchemaCompareDiagnostics.PresentationUnitMissing(schemaItem, [format]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tKindOfQuantities")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tKindOfQuantity(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tPresentationUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\t\t\tUnit: TestSchema.TestFormat")).to.be.true;
    });
  });

  describe("FormatChanges", () => {
    it("Format removed, correct message reported", async () => {
      const schemaItem = new Format(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tFormat(TestItem)")).to.be.true;
    });

    it("Format added, correct message reported", async () => {
      const schemaItem = new Format(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tFormat(TestItem)")).to.be.true;
    });

    it("Format property value change, correct message reported", async () => {
      const schemaItem = new Format(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.FormatDelta(schemaItem, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tFormat(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tLabel: LabelA -> LabelB")).to.be.true;
    });

    it("Format unit removed, correct message reported", async () => {
      const schemaItem = new Format(schemaA, "TestItem");
      const unit = new Unit(schemaA, "TestUnit");
      const diag = new SchemaCompareDiagnostics.FormatUnitMissing(schemaItem, [unit]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tFormat(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\t\t\tUnit: TestSchema.TestUnit")).to.be.true;
    });

    it("Format unit added, correct message reported", async () => {
      const schemaItem = new Format(schemaB, "TestItem");
      const unit = new Unit(schemaB, "TestUnit");
      const diag = new SchemaCompareDiagnostics.FormatUnitMissing(schemaItem, [unit]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tFormat(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\t\t\tUnit: TestSchema.TestUnit")).to.be.true;
    });

    it("Format unit label override property value change, correct message reported", async () => {
      const schemaItem = new Format(schemaA, "TestItem");
      const unit = new Unit(schemaA, "TestUnit");
      const diag = new SchemaCompareDiagnostics.UnitLabelOverrideDelta(schemaItem, [unit, "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tFormats")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tFormat(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\t\tUnit(TestSchema.TestUnit)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\t\t\tLabel: LabelA -> LabelB")).to.be.true;
    });
  });

  describe("PropertyCategoryChanges", () => {
    it("PropertyCategory removed, correct message reported", async () => {
      const schemaItem = new PropertyCategory(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPropertyCategories")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tPropertyCategory(TestItem)")).to.be.true;
    });

    it("PropertyCategory added, correct message reported", async () => {
      const schemaItem = new PropertyCategory(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPropertyCategories")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tPropertyCategory(TestItem)")).to.be.true;
    });

    it("PropertyCategory property value change, correct message reported", async () => {
      const schemaItem = new PropertyCategory(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.PropertyCategoryDelta(schemaItem, ["label", "LabelA", "LabelB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPropertyCategories")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tPropertyCategory(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tLabel: LabelA -> LabelB")).to.be.true;
    });
  });

  describe("UnitChanges", () => {
    it("Unit removed, correct message reported", async () => {
      const schemaItem = new Unit(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tUnit(TestItem)")).to.be.true;
    });

    it("Unit added, correct message reported", async () => {
      const schemaItem = new Unit(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tUnit(TestItem)")).to.be.true;
    });

    it("Unit property value change, correct message reported", async () => {
      const schemaItem = new Unit(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.UnitDelta(schemaItem, ["unitSystem", "TestSchema.UnitSystemA", "TestSchema.UnitSystemB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tUnit(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tUnitSystem: TestSchema.UnitSystemA -> TestSchema.UnitSystemB")).to.be.true;
    });
  });

  describe("UnitSystemChanges", () => {
    it("UnitSystem removed, correct message reported", async () => {
      const schemaItem = new UnitSystem(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tUnitSystems")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tUnitSystem(TestItem)")).to.be.true;
    });

    it("UnitSystem added, correct message reported", async () => {
      const schemaItem = new UnitSystem(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tUnitSystems")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tUnitSystem(TestItem)")).to.be.true;
    });
  });

  describe("InvertedUnitChanges", () => {
    it("InvertedUnit removed, correct message reported", async () => {
      const schemaItem = new InvertedUnit(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tInvertedUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tInvertedUnit(TestItem)")).to.be.true;
    });

    it("InvertedUnit added, correct message reported", async () => {
      const schemaItem = new InvertedUnit(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tInvertedUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tInvertedUnit(TestItem)")).to.be.true;
    });

    it("InvertedUnit property value change, correct message reported", async () => {
      const schemaItem = new InvertedUnit(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.InvertedUnitDelta(schemaItem, ["InvertedUnitSystem", "TestSchema.InvertedUnitSystemA", "TestSchema.InvertedUnitSystemB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tInvertedUnits")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tInvertedUnit(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tInvertedUnitSystem: TestSchema.InvertedUnitSystemA -> TestSchema.InvertedUnitSystemB")).to.be.true;
    });
  });

  describe("PhenomenonChanges", () => {
    it("Phenomenon removed, correct message reported", async () => {
      const schemaItem = new Phenomenon(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPhenomenons")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tPhenomenon(TestItem)")).to.be.true;
    });

    it("Phenomenon added, correct message reported", async () => {
      const schemaItem = new Phenomenon(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPhenomenons")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tPhenomenon(TestItem)")).to.be.true;
    });

    it("Phenomenon property value change, correct message reported", async () => {
      const schemaItem = new Phenomenon(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.PhenomenonDelta(schemaItem, ["definition", "DefinitionA", "DefinitionB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tPhenomenons")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tPhenomenon(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tDefinition: DefinitionA -> DefinitionB")).to.be.true;
    });
  });

  describe("ConstantChanges", () => {
    it("Constant removed, correct message reported", async () => {
      const schemaItem = new Constant(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tConstants")).to.be.true;
      expect(reporterSpy.calledWithExactly("-\t\tConstant(TestItem)")).to.be.true;
    });

    it("Constant added, correct message reported", async () => {
      const schemaItem = new Constant(schemaB, "TestItem");
      const diag = new SchemaCompareDiagnostics.SchemaItemMissing(schemaItem, []);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tConstants")).to.be.true;
      expect(reporterSpy.calledWithExactly("+\t\tConstant(TestItem)")).to.be.true;
    });

    it("Constant property value change, correct message reported", async () => {
      const schemaItem = new Constant(schemaA, "TestItem");
      const diag = new SchemaCompareDiagnostics.ConstantDelta(schemaItem, ["phenomenon", "TestSchema.PhenomenonA", "TestSchema.PhenomenonB"]);
      const changes = new SchemaChanges(schemaA);
      changes.addDiagnostic(diag);
      const reporter = new TestSchemaCompareReporter(schemaA, schemaB);

      reporter.report(changes);

      expect(reporterSpy.calledWithExactly("!Schema(TestSchema)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\tConstants")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\tConstant(TestItem)")).to.be.true;
      expect(reporterSpy.calledWithExactly("!\t\t\tPhenomenon: TestSchema.PhenomenonA -> TestSchema.PhenomenonB")).to.be.true;
    });
  });
});