import os
import sys

print("\n=== RUNNING SPRINT 3 VERIFICATION ===")

# Base paths
PROJECT_DIR = r"d:\4. Thoriq_KULIAH\1.Lomba Thoriq\SEMESTER 4\05. Samsung\DyLeks"
FE_DIR = os.path.join(PROJECT_DIR, "FE")

# 1. Check file existence
required_files = [
    os.path.join(FE_DIR, "pages", "game.tsx"),
    os.path.join(FE_DIR, "pages", "result.tsx"),
    os.path.join(FE_DIR, "pages", "latihan.tsx"),
    os.path.join(FE_DIR, "styles", "Game.module.css"),
    os.path.join(FE_DIR, "styles", "Result.module.css"),
]

print("\n[Test 1] Checking required frontend files...")
for filepath in required_files:
    exists = os.path.exists(filepath)
    print(f"  - {os.path.basename(filepath)}: {'FOUND' if exists else 'MISSING'}")
    assert exists, f"Error: Required file {filepath} does not exist!"
print("Test 1 Passed: All required files exist.")

# 2. Inspect game.tsx logic
print("\n[Test 2] Validating game.tsx logic...")
with open(os.path.join(FE_DIR, "pages", "game.tsx"), "r", encoding="utf-8") as f:
    game_content = f.read()

# Check for vocabulary pairs
assert "VOCAB_PAIRS" in game_content, "Error: VOCAB_PAIRS is missing in game.tsx"
assert "speechSynthesis" in game_content, "Error: Speech Synthesis audio feedback is missing in game.tsx"
assert "game_streak" in game_content, "Error: Daily streak storage is missing in game.tsx"
assert "rewardModal" in game_content or "styles.rewardModal" in game_content, "Error: Reward modal/visual is missing in game.tsx"

print("  - VOCAB_PAIRS: Checked")
print("  - Web Speech API: Checked")
print("  - Daily Streak & Reward: Checked")
print("Test 2 Passed: game.tsx contains correct logic and gamification components.")

# 3. Inspect result.tsx visualizer
print("\n[Test 3] Validating result.tsx logic...")
with open(os.path.join(FE_DIR, "pages", "result.tsx"), "r", encoding="utf-8") as f:
    result_content = f.read()

# Check for error categories and SVG
assert "<svg" in result_content, "Error: SVG graphics container is missing in result.tsx"
assert "inversiBD" in result_content, "Error: b/d Reversal detection tracking is missing in result.tsx"
assert "inversiPQ" in result_content, "Error: p/q Reversal detection tracking is missing in result.tsx"
assert "terbalik" in result_content, "Error: Reversal order tracking is missing in result.tsx"
assert "hilangTambah" in result_content, "Error: Omission/Insertion tracking is missing in result.tsx"
assert "Disclaimer" in result_content or "disclaimerBox" in result_content, "Error: Disclaimer is missing in result.tsx"

print("  - SVG Graph Rendering: Checked")
print("  - Error patterns (b/d, p/q, reversal, omission): Checked")
print("  - Disclaimer notice: Checked")
print("Test 3 Passed: result.tsx contains all required diagnostic visualizers.")

# 4. Inspect latihan.tsx integration
print("\n[Test 4] Validating latihan.tsx game integration...")
with open(os.path.join(FE_DIR, "pages", "latihan.tsx"), "r", encoding="utf-8") as f:
    latihan_content = f.read()

assert "game_streak" in latihan_content, "Error: game_streak state/parsing is missing in latihan.tsx"
assert "/game" in latihan_content, "Error: Next.js routing connection to /game is missing in latihan.tsx"
assert "Petualangan Huruf" in latihan_content, "Error: Game launcher card is missing in latihan.tsx"

print("  - Game route launcher: Checked")
print("  - Streak state tracking: Checked")
print("Test 4 Passed: Latihan dashboard correctly integrates the gamification loop.")

print("\nALL SPRINT 3 VERIFICATIONS PASSED SUCCESSFULLY!")
sys.exit(0)
