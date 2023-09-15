import fetch from 'node-fetch';
import dotenv from "dotenv";
dotenv.config();
const ms_to_sec: number = 1000;
const sec_to_hour: number = 3600;
const hours_to_days: number = 24;

//Changes date ticket to an actual data object to calc the difference in terms of milliseconds between created date and closed date
function parseDate(dateString: any){
    return new Date(dateString);
}
//Grabs the 50 most recent closed issues from GitHub API
async function fetchIssues(owner: string, repo: string): Promise<any[]> {
    const perPage = 50; // Number of pull requests per page (maximum allowed by GitHub)
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=closed&page=1&per_page=${perPage}`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    });
  
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }
  
    const closedIssues = await response.json();
    return closedIssues;
  }
  //Fetches issue data of a specified issue number
  async function fetchIssueData(owner: string, repo: string, issueNumber: number): Promise<any> {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    });
  
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }
  
    const issueData = await response.json();
  
    return issueData;
  }
  //Finds the median of the time taken to close an issue, over 50 samples
  function findMedian(numbers: any) {
    // Step 1: Sort the list
    const sortedNumbers = numbers.slice().sort((a: any, b: any) => a - b);
  
    const middleIndex = Math.floor(sortedNumbers.length / 2);
  
    if (sortedNumbers.length % 2 === 0) {
      // Even number of elements, so take the average of the two middle elements
      const middle1 = sortedNumbers[middleIndex - 1];
      const middle2 = sortedNumbers[middleIndex];
      return (middle1 + middle2) / 2;
    } else {
      // Odd number of elements, so the middle element is the median
      return sortedNumbers[middleIndex];
    }
  }
  //
  async function responsive(url: string): Promise<number> {
    const urlParts = url.split("/");
    const repo: string = urlParts.pop()!;
    const owner: string = urlParts.pop()!;
    const score_list: number[] = [];

    try {
        const issues = await fetchIssues(owner, repo);

        for (const issue of issues) {
            const issueData = await fetchIssueData(owner, repo, issue.number);
            const created = parseDate(issue.created_at);
            const closed = parseDate(issueData.closed_at);
            const diff = (closed.valueOf() - created.valueOf()) / (ms_to_sec * sec_to_hour * hours_to_days); // diff measured in days
            score_list.push(diff);
        }
        const median = findMedian(score_list);
        if (median < 1) {
          return 1;
        } else if (median > 7) {
          return 0;
        } else {
          // linear interpolation here.
          return 1 - (median - 1) / 6;
        }
      }
       catch (error) {
        console.error('Error:', error);
        throw error; // Re-throw the error to be caught by the caller
    }
  }
  export { responsive };
  
  