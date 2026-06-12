import os
import sys

import pytest

pytest.importorskip("pptx")  # all office tests skip if python-pptx absent

PLUGIN_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, PLUGIN_ROOT)
sys.path.insert(0, os.path.join(PLUGIN_ROOT, "scripts", "office"))


@pytest.fixture
def fixture_slide_data():
    import json
    path = os.path.join(os.path.dirname(__file__), "fixtures", "slide-data.json")
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)
