from engine.qa import check_pptx
from mappers.presentation_pptx import render_presentation


def test_clean_deck_passes_qa(tmp_path, fixture_slide_data):
    out = tmp_path / "deck.pptx"
    render_presentation(fixture_slide_data, str(out))
    issues = check_pptx(str(out))
    assert issues == [], f"unexpected QA issues: {issues}"
