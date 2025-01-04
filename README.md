# git-dilate

A Node.js script that copies a Git repository while redistributing commit dates across a specified time range. This tool maintains the original commit order but assigns new timestamps between your chosen start and end dates, creating a more evenly distributed commit history.

Key features:

- Preserves all commit content and messages
- Maintains chronological order of commits
- Randomizes commit times between 12 PM and 8 PM
- Works with both `main` and `master` branches
- Handles commit patches safely

## Usage

```bash
node script.js <source-repo> <target-repo> <start-date> <end-date>
```
