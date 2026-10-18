<img width="1429" height="151" alt="RoUniverseIcon" src="https://github.com/user-attachments/assets/926454c2-5088-4332-9906-9bc594d3de80" />

# Visualise Unlisted Roblox Places

Ro-Universe is an Express.js application which allows users to view Roblox places which could not be easily accessed on the Roblox website by using publicly available Roblox API endpoints. This repo holds Ro-Universe's source code for anyone to download and host locally on their device. This tool is also built to work without cookies/being logged in on the Roblox website.
> [!WARNING]
> This tool and its creator is **not** affiliated with or endorsed by Roblox, and is meant for informational purposes only. The creator is not liable for any losses caused directly/indirectly by this tool. Take a look at this [repo's license](https://github.com/ducktowebv/ro-universe/blob/main/LICENSE) for more information on using Ro-Universe.

[Click me for the list of endpoints used! :eyes:](https://github.com/ducktowebv/ro-universe/blob/main/endpoints.md)

# Table of Content:
1. [Features](#features)
2. [Installation](#installation)
3. [Credits](#credits)

# Features
## Games
View deleted games, unlisted games or subplaces with more detail:

<img width="1888" height="859" alt="image" src="https://github.com/user-attachments/assets/ee40e094-5246-49a1-b424-03fbe8175dfc" />

## Users
View the games and groups of users (even terminated ones):

<img width="1917" height="879" alt="image" src="https://github.com/user-attachments/assets/8218735a-8014-4891-b0a0-46e510c77ab2" />

## Groups
View games, members and affiliates of a group (yes, including locked ones too):

<img width="1909" height="877" alt="image" src="https://github.com/user-attachments/assets/0e53714c-6548-4633-9afc-94777f596e1f" />


# Installation
### Prerequisites
* [node.js](https://nodejs.org/en/download) (this project was developed using V24.21.0)

Check node version:
```
node -v
```
***
### Instructions
1. Download this repo and navigate to its root folder using your favourite IDE or terminal (you should see the `package.json` file)
2. Run the command:
```
npm install
```
If you weren't able to automatically install the needed packages from the step above, run the following commands line-by-line:
```
npm install express
npm install pug
npm install path
npm install cors
```
3. Run the command:
```
npm start
```
The tool should start on http://localhost:3000. You can change the port number in `/server/index.js` (ensure you change the port number used in `/static/scripts/modules/net_utils.js` if you _do_ change the port number).
# Credits
* [Roseal](https://github.com/RoSeal-Extension/RoSeal) for most of the design ideas in this tool.
