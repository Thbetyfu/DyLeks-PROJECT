import sys
import os

# Add BE path to sys.path
sys.path.append(r"d:\4. Thoriq_KULIAH\1.Lomba Thoriq\SEMESTER 4\05. Samsung\DyLeks\BE")

try:
    from app.services.scoring_service import ScoringService

    print("\n=== RUNNING SPRINT 1 SCORING SERVICE TESTS ===")

    # 1. Test Match (Correct spelling)
    print("\n[Test 1] Testing exact match...")
    res = ScoringService.calculate_risk("buku", "buku")
    print("Result:", res)
    assert res["is_match"] is True
    assert res["score"] == 0
    assert len(res["errors"]) == 0
    print("Test 1 Passed.")

    # 2. Test Spatial Reversal (b/d)
    print("\n[Test 2] Testing spatial reversal b/d...")
    res = ScoringService.calculate_risk("buku", "duku")
    print("Result:", res)
    assert res["is_match"] is False
    assert res["score"] > 0
    assert any("terbalik" in err or "reversal" in err for err in res["errors"])
    assert any("b/d" in err for err in res["errors"])
    print("Test 2 Passed.")

    # 3. Test Spatial Reversal (p/q)
    print("\n[Test 3] Testing spatial reversal p/q...")
    res = ScoringService.calculate_risk("pagi", "qagi")
    print("Result:", res)
    assert res["is_match"] is False
    assert res["score"] > 0
    assert any("terbalik" in err or "reversal" in err for err in res["errors"])
    assert any("p/q" in err for err in res["errors"])
    print("Test 3 Passed.")

    # 4. Test Order Reversal (Anagram)
    print("\n[Test 4] Testing letter order reversal...")
    res = ScoringService.calculate_risk("ibu", "iub")
    print("Result:", res)
    assert res["is_match"] is False
    assert res["score"] > 0
    assert any("terbalik" in err or "reversal" in err for err in res["errors"])
    print("Test 4 Passed.")

    # 5. Test Omission (Character missing)
    print("\n[Test 5] Testing character omission...")
    res = ScoringService.calculate_risk("topi", "top")
    print("Result:", res)
    assert res["is_match"] is False
    assert res["score"] > 0
    assert any("omission" in err or "hilang" in err for err in res["errors"])
    print("Test 5 Passed.")

    # 6. Test Insertion (Extra character)
    print("\n[Test 6] Testing character insertion...")
    res = ScoringService.calculate_risk("ibu", "ibuu")
    print("Result:", res)
    assert res["is_match"] is False
    assert res["score"] > 0
    assert any("insertion" in err or "tambah" in err for err in res["errors"])
    print("Test 6 Passed.")

    print("\nALL SCORING SERVICE TESTS PASSED SUCCESSFULLY!")
    sys.exit(0)

except Exception as e:
    import traceback
    print("ERROR:")
    traceback.print_exc()
    sys.exit(1)
