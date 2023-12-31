import fetch from 'node-fetch';
import dotenv from 'dotenv';
import createModuleLogger from './logger';

const logger = createModuleLogger('License');
dotenv.config();
async function license(url: string): Promise<number> {
	const urlParts = url.split('/');
	const repo = urlParts.pop();
	const owner = urlParts.pop();

	const apiURL = `https://api.github.com/repos/${owner}/${repo}/readme`;

	logger.info(`Constructed API URL: ${apiURL}`);

	const response = await fetch(apiURL, {
		headers: {
			Authorization: `token ${process.env.GITHUB_TOKEN}`,
		},
	});

	if (!response.ok) {
		logger.info(`Failed to fetch readme from ${apiURL}. Status: ${response.statusText}`);
		console.log(`Failed to fetch readme from ${apiURL}. Status: ${response.statusText}`);
		process.exit(1);
	}

	const { content }: { content: string } = await response.json();
	const readme = Buffer.from(content, 'base64').toString('utf-8');
	const licenseRegex = /licen[sc]e/gi;
	const hasLicense = licenseRegex.test(readme);
	logger.debug(`Checked for license keywords in README. Found: ${hasLicense}`);
	
	return hasLicense ? 1 : 0;
}

export { license };
