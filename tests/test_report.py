import os
import json
from unittest.mock import patch, MagicMock
import pytest
import openai

from bug_report_agent.code_search import CodeSearch
from bug_report_agent.code_reader import CodeReader
from bug_report_agent.report_generator import ReportGenerator


@pytest.fixture
def dummy_repo(tmp_path):
    repo = tmp_path / "repo"
    repo.mkdir()
    file_py = repo / "foo.py"
    file_py.write_text("def add(a, b):\n    return a + b\n")
    return str(repo)


def test_code_search(dummy_repo):
    cs = CodeSearch(dummy_repo)
    matches = cs.search("add function error", top_n=5)
    assert any("foo.py" in m.file for m in matches)


def test_code_reader(dummy_repo):
    cs = CodeSearch(dummy_repo)
    matches = cs.search("add", top_n=5)
    cr = CodeReader(dummy_repo)
    snippets = cr.read_snippets(matches)
    assert len(snippets) >= 1
    assert "def add" in snippets[0].snippet


@patch.dict(os.environ, {'OPENAI_API_KEY': 'test'})
def test_report_generator(monkeypatch):
    dummy_response = MagicMock()
    dummy_response.choices = [MagicMock(message=MagicMock(
        content='{"summary":"Test Summary"}\n\n# Bug Report\nTest'
    ))]
    monkeypatch.setattr(openai.ChatCompletion, 'create', lambda *args, **kwargs: dummy_response)
    rg = ReportGenerator()
    report_json, report_md = rg.generate_report("feedback", [])
    assert report_json["summary"] == "Test Summary"
    assert report_md.startswith("# Bug Report")