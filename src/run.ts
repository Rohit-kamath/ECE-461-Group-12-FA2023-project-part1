#!/usr/bin/env node

import { readFileSync } from 'fs';
import { exec } from 'child_process';

let fetch: any; // Placeholder for the dynamic import
let createModuleLogger: any; // Placeholder for the dynamic import
let logger: any;

async function loadDependencies() {
    if (!fetch) {
        const fetchModule = await import('node-fetch');
        fetch = fetchModule.default || fetchModule;
    }

    if (!createModuleLogger) {
        const loggerModule = await import('./logger');
        createModuleLogger = loggerModule.default || loggerModule;
        logger = createModuleLogger('run cli');
    }
}

async function getGithubUrl(npmUrl: string): Promise<string> {
    logger.debug(`Extracting GitHub URL from npm URL: ${npmUrl}`);
    const packageName = npmUrl.split('package/')[1];
    const response = await fetch(npmUrl);
    const text = await response.text();
    const githubUrl = text.split('github.com')[1].split('"')[0];
    const githubUrlWithPackageName = githubUrl.split('/')[0] + '/' + githubUrl.split('/')[1] + '/' + packageName;
    logger.debug(`Extracted GitHub URL: ${githubUrlWithPackageName}`);
    return `https://github.com${githubUrlWithPackageName}`;
}

function formatter(metric: number): string {
    const truncated = metric.toFixed(5);
    const trimmed = truncated.replace(/\.?0*$/, '');
    return trimmed;
}

const args = process.argv.slice(2);
const command = args[0];

if (command === 'install') {
    // Logic for install command
    const child = exec('npm install');

    child.on('close', (code) => {
        if (code === 0) {
            try {
                const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
                const dependencyCount = Object.keys(packageJson.dependencies || {}).length;
                console.log(`${dependencyCount} dependencies installed...`);
            } catch (err) {
                console.log('Error reading package.json:', err);
                process.exit(1);
            }
        } else {
            console.log(`npm install failed with code ${code}.`);
            process.exit(1);
        }
    });

} else if (command === 'test') {
    loadDependencies().then(() => {
        // Logic for test command
        exec('npm test', (error, stdout, stderr) => {
            if (error) {
                console.log(`Failed to run tests. Error: ${error}`);
                process.exit(1);
            }
            const testMatch = stderr.match(/Tests:\s+(\d+)\s+passed,\s+(\d+)\s+total/);
            const coverageMatch = stdout.match(/All files\s+\|[^|]+\|[^|]+\|[^|]+\|([^|]+)\|/);

            if (coverageMatch && testMatch) {
                const passed = testMatch[1];
                const total = testMatch[2];
                const coverage = Math.floor(parseFloat(coverageMatch[1].trim()));
                console.log(`${passed}/${total} test cases passed. ${coverage}% line coverage achieved.`);
                logger.debug(`${passed}/${total} test cases passed. ${coverage}% line coverage achieved.`);
            } else {
                console.log('Failed to extract test report data.');
                logger.debug('Failed to extract test report data.');
                process.exit(1);
            }
        });
    });

} else if (command && command.endsWith('.txt')) {
    const file = command

    loadDependencies().then(async () => {
        const { getBusFactor } = await import('./busFactor');
        const { license } = await import('./license');
        const { responsive } = await import('./responsive');
        const { rampUp } = await import('./rampUp');
        const { fetchCorrectnessData } = await import('./correctness');
        const fileContents = readFileSync(file, 'utf-8');
        const urls = fileContents.split('\n').filter((url) => url !== '');
        logger.info(`grabbing net score for ${urls}`);
        for (let url of urls) {
            const newUrl = url;
            if (url.includes('npmjs.com')) {
                url = await getGithubUrl(url);
            }
            const busFactor = await getBusFactor(url);
            const licenseScore = await license(url);
            const responsiveScore = await responsive(url);
            const rampUpScore = await rampUp(url);
            const correctnessScore = await fetchCorrectnessData(url);
            const netScore = licenseScore * (responsiveScore * 0.3 + busFactor * 0.4 + correctnessScore * 0.15 + rampUpScore * 0.15);
            logger.debug(`Calculated scores for URL ${newUrl}: NET_SCORE: ${netScore}, RAMP_UP_SCORE: ${rampUpScore}, CORRECTNESS_SCORE: ${correctnessScore}, BUS_FACTOR_SCORE: ${busFactor}, RESPONSIVE_MAINTAINER_SCORE: ${responsiveScore}, LICENSE_SCORE: ${licenseScore}`);
            console.log(`{"URL":"${newUrl}", "NET_SCORE":${formatter(netScore)}, "RAMP_UP_SCORE":${formatter(rampUpScore)}, "CORRECTNESS_SCORE":${formatter(correctnessScore)}, "BUS_FACTOR_SCORE":${formatter(busFactor)}, "RESPONSIVE_MAINTAINER_SCORE":${formatter(responsiveScore)}, "LICENSE_SCORE":${formatter(licenseScore)}}`);
            
        }
    });

} else {
    console.error(`Unknown command or invalid arguments: ${args.join(' ')}`);
    process.exit(1);
}