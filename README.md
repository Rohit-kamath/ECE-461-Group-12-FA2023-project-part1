Rohit Kamath, Rachit Bisht, Robert Rozhanskyy, Ty Runner

This project analyzes the reputability of npm and github repositories and gives a net score summed over 5 metrics.

## Metrics
  - Correctness: Evaluates repos over the amount of people who have starred the repo and the ratio of closed pull requests to open pull requests.
  - License: Checks if the repo has a license or not.
  - Ramp Up Time: Evaluates readMe length along with keyword searching.
  - Responsive: Evaluates 100 or less closed issues in the repo and calculates the median time to close these issues.
  - Bus Factor: Sum up contributor's contribution to the repo until the contributions sum up to 50%, this is the number of important contributors on the repo.

## Installation and Running
./run install  - To install all dependencies needed for this project.
./run test     - To run test coverage and test metrics over 5 different repositories.
./run .txtfile - To run the metric scoring over all the repo links included in the text file.
