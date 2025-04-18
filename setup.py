from setuptools import setup, find_packages

setup(
    name='bug_report_agent',
    version='0.1.0',
    description='Read-only Bug Report Agent CLI tool',
    author='Your Name',
    license='MIT',
    packages=find_packages(),
    install_requires=[
        'click',
        'openai',
    ],
    extras_require={
        'dev': ['pytest'],
    },
    entry_points={
        'console_scripts': [
            'bug-report-agent=bug_report_agent.cli:main',
        ],
    },
)