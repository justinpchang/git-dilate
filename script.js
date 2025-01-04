const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// Configuration
const [, , sourceRepo, targetRepo, startDateStr, endDateStr] = process.argv;
const startDate = new Date(startDateStr);
const endDate = new Date(endDateStr);

// Validate required arguments
if (
  !sourceRepo ||
  !targetRepo ||
  !startDate ||
  !endDate ||
  isNaN(startDate) ||
  isNaN(endDate)
) {
  console.error(
    "Usage: node script.js <source-repo> <target-repo> <start-date> <end-date>\n" +
      "Dates should be in ISO format (YYYY-MM-DD)"
  );
  process.exit(1);
}

function generateSequentialDates(start, end, count) {
  // Validate input
  if (
    !(
      start instanceof Date &&
      end instanceof Date &&
      !isNaN(start) &&
      !isNaN(end)
    )
  ) {
    throw new Error("Invalid date input");
  }
  if (!Number.isInteger(count) || count < 2) {
    throw new Error("Count must be an integer >= 2");
  }
  if (end <= start) {
    throw new Error("End date must be after start date");
  }

  const timeSpan = end.getTime() - start.getTime();

  // Generate completely random timestamps within the range
  return Array.from({ length: count }, () => {
    // Get random timestamp between start and end
    const randomTime = start.getTime() + Math.random() * timeSpan;
    const date = new Date(randomTime);

    // Randomize time more broadly (5 AM - 11 PM)
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      5 + Math.floor(Math.random() * 18), // Hours between 5 AM and 11 PM
      Math.floor(Math.random() * 60),
      Math.floor(Math.random() * 60),
      Math.floor(Math.random() * 1000) // Add milliseconds for more randomness
    );
  }).sort((a, b) => a - b); // Still sort to maintain chronological order
}

function initializeTargetRepo() {
  if (fs.existsSync(targetRepo)) {
    fs.rmSync(targetRepo, { recursive: true, force: true });
  }
  fs.mkdirSync(targetRepo);
  execSync("git init", { cwd: targetRepo });
}

function getCommits() {
  try {
    const output = execSync('git log --reverse --pretty=format:"%H"', {
      cwd: sourceRepo,
    });
    const commits = output.toString().trim().split("\n");
    if (!commits.length) {
      throw new Error("No commits found in source repository");
    }
    return commits;
  } catch (error) {
    throw new Error(`Failed to get commits: ${error.message}`);
  }
}

function applyCommit(commit, newDate) {
  try {
    // Get commit details
    const patch = execSync(`git format-patch -1 --stdout ${commit}`, {
      cwd: sourceRepo,
    }).toString();

    // Apply patch to new repo
    const patchFile = path.join(targetRepo, "commit.patch");
    fs.writeFileSync(patchFile, patch);

    try {
      execSync("git am commit.patch", { cwd: targetRepo });

      // Set new date
      const dateStr = newDate.toISOString();
      execSync(`git commit --amend --no-edit --date="${dateStr}"`, {
        cwd: targetRepo,
      });
    } finally {
      // Clean up patch file
      if (fs.existsSync(patchFile)) {
        fs.unlinkSync(patchFile);
      }
    }
  } catch (error) {
    throw new Error(`Failed to apply commit ${commit}: ${error.message}`);
  }
}

async function main() {
  try {
    console.log("Initializing target repository...");
    initializeTargetRepo();

    console.log("Getting commit history...");
    const commits = getCommits();
    console.log(`Found ${commits.length} commits`);

    console.log("Generating sequential dates...");
    const dates = generateSequentialDates(startDate, endDate, commits.length);

    console.log("Applying commits with sequential dates...");
    commits.forEach((commit, index) => {
      applyCommit(commit, dates[index]);
      console.log(`Processed commit ${index + 1}/${commits.length}`);
    });

    console.log("Complete! Repository copied with sequential dates.");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
