import os
import sys
import json
import click

from .code_search import CodeSearch
from .code_reader import CodeReader
from .report_generator import ReportGenerator


@click.command()
@click.option('--repo-path', '-r', default='.', type=click.Path(exists=True, file_okay=False),
              help='Path to codebase (local git repo or directory, defaults to current directory)')
@click.option('--feedback', '-f', required=True, type=str,
              help='User feedback text or path to feedback file')
@click.option('--top-n', default=5, type=int,
              help='Number of top code snippets to retrieve')
@click.option('--create-linear', '-l', is_flag=True, default=False,
              help='Create a Linear issue (requires LINEAR_API_KEY & LINEAR_TEAM_ID)')
def main(repo_path, feedback, top_n, create_linear):
    """Read-only Bug Report Agent CLI."""
    # Load feedback from file if path exists, else treat as literal text
    if os.path.isfile(feedback):
        with open(feedback, 'r', encoding='utf-8') as f:
            feedback_text = f.read()
    else:
        feedback_text = feedback

    try:
        search = CodeSearch(repo_path)
        matches = search.search(feedback_text, top_n=top_n)
        reader = CodeReader(repo_path)
        snippets = reader.read_snippets(matches)
        generator = ReportGenerator()
        report_json, report_md = generator.generate_report(feedback_text, snippets)
        # Write outputs
        with open('report.json', 'w', encoding='utf-8') as f:
            json.dump(report_json, f, indent=2)
        with open('report.md', 'w', encoding='utf-8') as f:
            f.write(report_md)
        click.echo('Generated report.json and report.md')
        # Optionally create a Linear issue
        if create_linear:
            linear_key = os.environ.get('LINEAR_API_KEY')
            if not linear_key:
                click.echo('Error: LINEAR_API_KEY must be set to create a Linear issue', err=True)
            else:
                # Determine team ID: use env if provided, else fetch first available
                linear_team = os.environ.get('LINEAR_TEAM_ID')
                if not linear_team:
                    try:
                        import urllib.request, json
                        team_query = '''
query {
  viewer {
    teams {
      nodes { id name }
    }
  }
}
'''
                        team_payload = json.dumps({'query': team_query}).encode('utf-8')
                        team_req = urllib.request.Request(
                            'https://api.linear.app/graphql',
                            data=team_payload,
                            headers={
                                'Content-Type': 'application/json',
                                'Authorization': f'Bearer {linear_key}'
                            }
                        )
                        with urllib.request.urlopen(team_req) as team_resp:
                            team_data = json.load(team_resp)
                        teams = team_data.get('data', {}).get('viewer', {}).get('teams', {}).get('nodes', [])
                        if teams:
                            linear_team = teams[0].get('id')
                            click.echo(f"Info: using Linear team '{teams[0].get('name')}' (ID: {linear_team})")
                        else:
                            click.echo('Error: no Linear teams found for the authenticated user', err=True)
                            return
                    except Exception as e:
                        click.echo(f'Warning: unable to fetch Linear teams: {e}', err=True)
                        return
                # Now perform issue creation
                try:
                    # Prepare title and description
                    title = feedback_text.strip().splitlines()[0]
                    if len(title) > 80:
                        title = title[:77] + '...'
                    title = f"Bug: {title}"
                    description = report_md
                    import urllib.request, json
                    issue_query = '''
mutation IssueCreate($input: IssueCreateInput!) {
  issueCreate(input: $input) {
    success
    issue { id url }
  }
}
'''
                    variables = {'input': {'teamId': linear_team, 'title': title, 'description': description}}
                    issue_payload = json.dumps({'query': issue_query, 'variables': variables}).encode('utf-8')
                    issue_req = urllib.request.Request(
                        'https://api.linear.app/graphql',
                        data=issue_payload,
                        headers={
                            'Content-Type': 'application/json',
                            'Authorization': f'Bearer {linear_key}'
                        }
                    )
                    with urllib.request.urlopen(issue_req) as issue_resp:
                        issue_data = json.load(issue_resp)
                    issue = issue_data.get('data', {}).get('issueCreate', {}).get('issue')
                    if issue and issue.get('url'):
                        click.echo(f"Created Linear issue: {issue['url']}")
                    else:
                        click.echo('Warning: Linear API response did not include issue URL', err=True)
                except Exception as e:
                    click.echo(f'Warning: failed to create Linear issue: {e}', err=True)
    except Exception as e:
        click.echo(f'Error: {e}', err=True)
        sys.exit(1)


if __name__ == '__main__':
    main()