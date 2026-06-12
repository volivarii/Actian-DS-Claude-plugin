import os
import subprocess
import sys

PLUGIN_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DISPATCH = os.path.join(PLUGIN_ROOT, "scripts", "office", "render-office.py")


def test_unknown_type_errors():
    r = subprocess.run([sys.executable, DISPATCH, "--type", "bogus", "x.json", "-o", "x.pptx"],
                       capture_output=True, text=True)
    assert r.returncode != 0
    assert "unknown --type" in (r.stderr + r.stdout).lower()


def test_missing_input_errors():
    r = subprocess.run([sys.executable, DISPATCH, "--type", "presentation", "nope.json", "-o", "x.pptx"],
                       capture_output=True, text=True)
    assert r.returncode != 0
    assert "not found" in (r.stderr + r.stdout).lower()


def test_presentation_happy_path(tmp_path):
    import os
    fx = os.path.join(os.path.dirname(__file__), "fixtures", "slide-data.json")
    out = tmp_path / "deck.pptx"
    r = subprocess.run([sys.executable, DISPATCH, "--type", "presentation", fx, "-o", str(out)],
                       capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert out.exists()
    assert "ok: wrote" in r.stdout
