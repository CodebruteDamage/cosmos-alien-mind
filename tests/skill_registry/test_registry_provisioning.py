import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCHEMA = ROOT / "schemas" / "skill-manifest.v1.schema.json"
CERTIFICATION_SCHEMA = ROOT / "schemas" / "skill-certification.v1.schema.json"
REGISTRY = ROOT / "registry" / "skills" / "registry.seed.v1.json"

class SkillRegistryProvisioningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
        cls.registry = json.loads(REGISTRY.read_text(encoding="utf-8"))

    def test_certification_schema_is_closed_and_requires_all_gates(self):
        certification = json.loads(CERTIFICATION_SCHEMA.read_text(encoding="utf-8"))
        self.assertFalse(certification["additionalProperties"])
        self.assertIn("gates", certification["required"])
        self.assertIn("decision", certification["required"])
        self.assertEqual(certification["properties"]["decision"]["properties"]["execution_eligible"]["const"], False)

    def test_schema_is_closed_and_requires_provenance(self):
        self.assertFalse(self.schema["additionalProperties"])
        self.assertIn("source", self.schema["required"])
        self.assertIn("license", self.schema["required"])
        self.assertIn("capabilities", self.schema["required"])

    def test_execution_is_disabled(self):
        self.assertIs(self.registry["execution_enabled"], False)
        self.assertEqual(self.registry["policy_enforcement"], "WARP_GATE_REQUIRED")

    def test_exact_three_pilot_candidates_are_present(self):
        ids = {entry["skill_id"] for entry in self.registry["entries"]}
        self.assertEqual(ids, {"systematic-debugging", "webapp-testing", "skill-creator"})

    def test_all_pilots_remain_proposed_and_unprivileged(self):
        for entry in self.registry["entries"]:
            with self.subTest(skill=entry["skill_id"]):
                self.assertEqual(entry["lifecycle"], "proposed")
                self.assertEqual(entry["source_verification"], "pending")
                self.assertEqual(entry["license_review"], "pending")
                self.assertEqual(entry["requested_capabilities"], [])

    def test_no_registry_entry_can_self_enable(self):
        for entry in self.registry["entries"]:
            self.assertNotIn("execution_enabled", entry)
            self.assertNotIn("approved", entry)

if __name__ == "__main__":
    unittest.main(verbosity=2)
