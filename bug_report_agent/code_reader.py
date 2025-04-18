from .code_search import Match


class Snippet:
    """Container for a code snippet with context."""
    def __init__(self, file, start_line, end_line, snippet):
        self.file = file
        self.start_line = start_line
        self.end_line = end_line
        self.snippet = snippet


class CodeReader:
    """Reads code snippets around matched lines."""

    def __init__(self, repo_path):
        self.repo_path = repo_path

    def read_snippets(self, matches, context=3):
        snippets = []
        for m in matches:
            try:
                with open(m.file, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                start = max(1, m.line_num - context)
                end = min(len(lines), m.line_num + context)
                text = ''.join(lines[start-1:end])
                snippets.append(Snippet(m.file, start, end, text))
            except Exception:
                continue
        return snippets