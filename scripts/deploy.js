#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Ensure project settings are properly set
console.log("Verifying project settings before deployment...");

// Check vercel.json
const vercelJsonPath = path.join(__dirname, "..", "vercel.json");
let vercelConfig;

try {
  vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, "utf8"));

  // Ensure projectSettings exists
  if (!vercelConfig.projectSettings) {
    console.log("Adding projectSettings to vercel.json...");
    vercelConfig.projectSettings = {
      framework: "nextjs",
      buildCommand: "next build",
      devCommand: "next dev",
      outputDirectory: ".next",
    };

    fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2));
    console.log("Updated vercel.json with projectSettings");
  }
} catch (error) {
  console.error("Error processing vercel.json:", error);
  process.exit(1);
}

// Check .vercel/project.json
const projectJsonDir = path.join(__dirname, "..", ".vercel");
const projectJsonPath = path.join(projectJsonDir, "project.json");

try {
  if (!fs.existsSync(projectJsonDir)) {
    fs.mkdirSync(projectJsonDir, { recursive: true });
  }

  let projectJson = {};
  if (fs.existsSync(projectJsonPath)) {
    projectJson = JSON.parse(fs.readFileSync(projectJsonPath, "utf8"));
  }

  // Ensure settings exists
  if (!projectJson.settings) {
    console.log("Adding settings to .vercel/project.json...");
    projectJson.settings = {
      framework: "nextjs",
      buildCommand: "next build",
      devCommand: "next dev",
      outputDirectory: ".next",
      installCommand: "npm install",
    };

    fs.writeFileSync(projectJsonPath, JSON.stringify(projectJson, null, 2));
    console.log("Updated .vercel/project.json with settings");
  }
} catch (error) {
  console.error("Error processing .vercel/project.json:", error);
  // Continue anyway
}

// Run deployment command
console.log("Running Vercel deployment...");
try {
  execSync("vercel deploy --prod", { stdio: "inherit" });
  console.log("Deployment completed successfully");
} catch (error) {
  console.error("Deployment failed:", error);
  process.exit(1);
}
