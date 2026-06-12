import os
import subprocess
import sys

PLUGIN_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DISPATCH = os.path.join(PLUGIN_ROOT, "scripts", "office", "render-office.py")


def test_missing_pptx_exits_friendly(tmp_path):
    # Simulate python-pptx absent by shadowing the import with a stub on PYTHONPATH.
    env = dict(os.environ)
    stub = tmp_path / "stub"
    stub.mkdir()
    (stub / "pptx.py").write_text("raise ImportError('simulated missing python-pptx')\n")
    env["PYTHONPATH"] = str(stub) + os.pathsep + env.get("PYTHONPATH", "")
    fx = os.path.join(os.path.dirname(__file__), "fixtures", "slide-data.json")
    r = subprocess.run([sys.executable, DISPATCH, "--type", "presentation", fx, "-o", str(tmp_path / "x.pptx")],
                       capture_output=True, text=True, env=env)
    assert r.returncode == 3
    assert "pip install python-pptx" in (r.stderr + r.stdout)
