import importlib.util
import os
import sys

import pytest

pytest.importorskip("pptx")  # skip whole module if python-pptx absent

PLUGIN_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, PLUGIN_ROOT)


def test_template_opens_with_54_layouts():
    from pptx import Presentation
    from scripts.office.engine.pptx_helpers import WORKING_TEMPLATE, open_template
    assert os.path.exists(WORKING_TEMPLATE)
    prs = Presentation(open_template())
    assert len(prs.slide_layouts) == 54
    assert len(prs.slides) == 0  # working template ships with zero slides


def test_brand_tokens_present():
    from scripts.office.engine.pptx_helpers import BLUE, TEAL
    assert str(BLUE) == "0E5FDB"
    assert str(TEAL) == "03C2CD"
