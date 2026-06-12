from engine.qa import check_pptx
from mappers.presentation_pptx import render_presentation


def test_clean_deck_passes_qa(tmp_path, fixture_slide_data):
    out = tmp_path / "deck.pptx"
    render_presentation(fixture_slide_data, str(out))
    issues = check_pptx(str(out))
    assert issues == [], f"unexpected QA issues: {issues}"


def test_check_pptx_detects_prompt_marker(tmp_path):
    import io, warnings, zipfile
    from engine.qa import check_pptx

    buf = io.BytesIO()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        with zipfile.ZipFile(buf, "w") as z:
            z.writestr("ppt/slides/slide1.xml", "<a:t>lorem ipsum</a:t>")
    p = tmp_path / "dirty.pptx"
    p.write_bytes(buf.getvalue())

    issues = check_pptx(str(p))
    assert any("lorem" in i for i in issues), f"expected marker detection, got: {issues}"


def test_check_pptx_detects_duplicate_entry(tmp_path):
    import io, warnings, zipfile
    from engine.qa import check_pptx

    buf = io.BytesIO()
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")  # suppress Python's UserWarning on duplicate name
        with zipfile.ZipFile(buf, "w") as z:
            z.writestr("ppt/slides/slide1.xml", "<a:t>clean</a:t>")
            z.writestr("ppt/slides/slide1.xml", "<a:t>also clean</a:t>")
    p = tmp_path / "dup.pptx"
    p.write_bytes(buf.getvalue())

    issues = check_pptx(str(p))
    assert any("duplicate" in i for i in issues), f"expected dup detection, got: {issues}"
