"""
Validate GitHub Actions workflow files
Run this before pushing to ensure workflows are properly formatted
"""

import os
import yaml
from pathlib import Path


def _check_required_fields(workflow):
    """Check for required fields in workflow."""
    # YAML 1.1 parsers often convert 'on' to True
    has_on = 'on' in workflow or True in workflow

    if not has_on:
        print("  ❌ Missing 'on' field")
        return False

    if 'name' not in workflow:
        print("  ❌ Missing 'name' field")
        return False

    if 'jobs' not in workflow:
        print("  ❌ Missing 'jobs' field")
        return False

    return True


def _check_jobs_structure(workflow):
    """Check the structure of jobs in the workflow."""
    for job_name, job_config in workflow['jobs'].items():
        if 'runs-on' not in job_config:
            print(f"  ❌ Job '{job_name}' missing 'runs-on'")
            return False

        if 'steps' not in job_config:
            print(f"  ⚠️  Job '{job_name}' has no steps")
    return True


def validate_workflow_file(filepath):
    """Validate a single workflow file"""
    print(f"\n🔍 Validating: {filepath.name}")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            workflow = yaml.safe_load(f)

        if not isinstance(workflow, dict):
            print("  ❌ Invalid workflow format (not a dictionary)")
            return False

        if not _check_required_fields(workflow):
            return False

        if not _check_jobs_structure(workflow):
            return False

        print("  ✅ Valid workflow")
        return True

    except yaml.YAMLError as e:
        print(f"  ❌ YAML parsing error: {e}")
        return False
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def check_env_file():
    """Check if .env file has required variables"""
    print("\n🔍 Checking .env file")

    if not os.path.exists('.env'):
        print("  ⚠️  No .env file found (this is OK for CI/CD)")
        return True

    try:
        with open('.env', 'r', encoding='utf-8') as f:
            content = f.read()

        required_vars = ['PINECONE_API_KEY', 'TMDB_API_KEY']
        missing = []

        for var in required_vars:
            if var not in content:
                missing.append(var)

        if missing:
            print(f"  ⚠️  Missing variables: {', '.join(missing)}")
        else:
            print("  ✅ All required variables present")

        return True

    except Exception as e:
        print(f"  ❌ Error reading .env: {e}")
        return False


def main():
    print("=" * 50)
    print("  GitHub Actions Workflow Validator")
    print("=" * 50)

    # Find all workflow files
    workflows_dir = Path('.github/workflows')

    if not workflows_dir.exists():
        print(f"\n❌ Workflows directory not found: {workflows_dir}")
        return 1

    workflow_files = list(workflows_dir.glob('*.yml')) + list(workflows_dir.glob('*.yaml'))

    if not workflow_files:
        print(f"\n❌ No workflow files found in {workflows_dir}")
        return 1

    print(f"\nFound {len(workflow_files)} workflow file(s)")

    # Validate each file
    results = {}
    for filepath in workflow_files:
        results[filepath.name] = validate_workflow_file(filepath)

    # Check environment
    check_env_file()

    # Summary
    print("\n" + "=" * 50)
    print("  Summary")
    print("=" * 50)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for filename, valid in results.items():
        status = "✅" if valid else "❌"
        print(f"{status} {filename}")

    print(f"\nPassed: {passed}/{total}")

    if passed == total:
        print("\n🎉 All workflows are valid!")
        return 0
    else:
        print(f"\n❌ {total - passed} workflow(s) failed validation")
        return 1


if __name__ == '__main__':
    exit(main())
