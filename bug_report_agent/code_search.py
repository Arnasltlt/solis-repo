import os
import re
from collections import Counter, namedtuple

Match = namedtuple('Match', ['file', 'line_num'])


class CodeSearch:
    """Simple grep-based keyword search over a codebase."""

    def __init__(self, repo_path):
        self.repo_path = repo_path

    def extract_keywords(self, text):
        tokens = re.findall(r'\w+', text)
        keywords = [t.lower() for t in tokens if len(t) > 3]
        # Deduplicate while preserving order
        seen = set()
        result = []
        for k in keywords:
            if k not in seen:
                seen.add(k)
                result.append(k)
        return result

    def search(self, feedback_text, top_n=5):
        keywords = self.extract_keywords(feedback_text)
        scores = Counter()
        # Walk files
        for root, dirs, files in os.walk(self.repo_path):
            # Skip VCS directories
            dirs[:] = [d for d in dirs if d not in ('.git', '.hg', '.svn')]
            for fname in files:
                if fname.endswith(('.py', '.js', '.ts', '.java', '.go', '.rb')):
                    path = os.path.join(root, fname)
                    try:
                        text = open(path, 'r', encoding='utf-8', errors='ignore').read().lower()
                    except Exception:
                        continue
                    # Score by sum of keyword counts
                    score = sum(text.count(k) for k in keywords)
                    if score > 0:
                        scores[path] = score
        top_files = [f for f, _ in scores.most_common(top_n)]
        matches = []
        # Collect line matches
        for fpath in top_files:
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                    for idx, line in enumerate(f, start=1):
                        low = line.lower()
                        if any(k in low for k in keywords):
                            matches.append(Match(file=fpath, line_num=idx))
            except Exception:
                continue
        # Return up to top_n matches
        return matches[:top_n]