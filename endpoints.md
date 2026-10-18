This file contains a list of Roblox API endpoints used to make this tool possible. They require no cookies to work (though you should expect stricter ratelimits if you don't provide a cookie).

# Table of Contents
1. [Resources](#resources)
2. [URI (Uniform Resource Identifier)](uri-uniform-resource-identifier)
    1. [roblox://](#roblox)
    2. [roblox-studio://](#roblox-studio)
3. [Games](#games)
     1. [Getting Universe ID](#getting-universe-id)
     2. [Getting media](#getting-media)
     3. [General Info](#general-info)
     4. [Upvotes/Downvotes](#upvotesdownvotes)
     5. [Favourites](#favourites)
     6. [Avatar Settings](#avatar-settings)
     7. [Servers](#servers)
     8. [Badges](#badges)
     9. [Gamepasses & Dev Products](gamepasses--dev-products)
4. [Groups](#groups)
     1. [General Info](#general-info-1)
     2. [Group Icon](#group-icon)
     3. [Games](#games-1)
     4. [Affiliates](#affiliates)
     5. [Group Roles](#group-roles)
5. [Users](#users)
     1. [General Info](#general-info-2)
     2. [Headshot](#headshot)
     3. [Games](#games-2)
     4. [Groups](#groups-1)

# Resources
* BTRoblox README: https://github.com/AntiBoomz/BTRoblox/blob/master/README.md
* Roblox Open Cloud Docs: https://create.roblox.com/docs/cloud/reference/domains/apis

# URI (Uniform Resource Identifier)
### roblox://
Joining a specific server: roblox://experiences/start?placeId={placeId}&gameInstanceId={instanceId} 

See [Bootstrap's README](https://github.com/bloxstraplabs/bloxstrap/wiki/A-deep-dive-on-how-the-Roblox-bootstrapper-works) for more info and possible parameters.
### roblox-studio://
Editing an uncopylocked place: roblox-studio:1+launchmode:edit+task:EditPlace+placeId:{placeId}+universeId:{universeId}

# Games
### Getting Universe ID
https://apis.roblox.com/universes/v1/places/{placeId}/universe
* Also doubles as being able to validate a given place ID
### Getting media
|Link|Use|
|---|---|
|https://thumbnails.roblox.com/v1/places/gameicons?placeIds={placeId}&returnPolicy=PlaceHolder&size={size}&format={format}&isCircular={bool}|Retrieves thumbnails (ID and URL) <br> **NOTE:** API does not return icons containing a mix of placeholder & custom game icons in order. |
|https://games.roblox.com/v1/games/{universeId}/media?fetchAllExperienceRelatedMedia=true|Mainly used to retrieve alt text of thumbnails|
|https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds={universeId}&countPerUniverse={limit}&defaults=true&size={size}&format={format}&isCircular={bool}|Retrieves thumbnail IDs + URLs.  <br> **NOTE:** API does not return icons containing a mix of placeholder & custom game thumbnails in order. |
### General Info
|Link|Use|
|---|---|
|https://games.roblox.com/v1/games?universeIds={universeId}|Gets information on universe. Does not work if checking for a private/content deleted game.
|https://economy.roblox.com/v2/assets/{placeId}/details|Gets information on place.
|https://develop.roblox.com/v2/universes/{universeId}/places?extendedSettings=true&limit={limit}|Gets subplaces + last saved version of universe.|

* (Side note: the thumbnail API for getting universe icons (https://thumbnails.roblox.com/v1/games/icons) returns an empty string if the icon was content deleted, but getting its icon from the game's root place ID doesn't)

### Upvotes/Downvotes
https://games.roblox.com/v1/games/votes?universeIds={universeId}

### Favourites
https://games.roblox.com/v1/games/{universeId}/favorites/count

### Avatar Settings
https://avatar.roblox.com/v1/game-start-info?universeId={universeId}

### Servers
https://games.roblox.com/v1/games/{placeId}/servers/Public?sortOrder={sortOrderUsed}&excludeFullGames={bool}&limit={limit}&cursor={cursor}

If you are interested in converting PlayerTokens to player icon URLs, see https://devforum.roblox.com/t/roblox-api-to-access-player-thumbnails/3433713/3 (converting PlayerTokens requires an authentication cookie)

### Badges
|Link|Use|
|---|---|
|https://badges.roblox.com/v1/universes/{universeId}/badges?sortBy={Rank|DateCreated}&limit={limit}&sortOrder={Asc/Desc}&cursor={cursor} |Retrieves badges under given universe. Deactivated badges will not be returned by the API.|
|https://thumbnails.roblox.com/v1/badges/icons?badgeIds={listOfIds}&size={size}&format={format}&isCircular={bool}|Retrieves badge icon for given badge ID.

### Gamepasses & Dev Products
|Link|Use|
|---|---|
|https://apis.roblox.com/game-passes/v1/universes/{universeId}/game-passes?pageSize={size}&pageToken={cursor}|Retrieves gamepasses under given universe.|
|https://apis.roblox.com/game-passes/v1/game-passes/${gamepassId}/product-info|Retrieves more detailed information for given gamepass ID.|
|https://thumbnails.roblox.com/v1/game-passes?gamePassIds={gamepassIds}&size={size}&format={format}&isCircular={bool}|Retrieves icon URLs and icon IDs for each given gamepass ID.<br> **NOTE:** API does not return icons containing a mix of placeholder & custom gamepass icons in order. |
|https://apis.roblox.com/developer-products/v2/universes/{universeId}/developerproducts?limit={limit}&cursor={cursor}|Retrieves a list of developer products under given universe.|
|https://thumbnails.roblox.com/v1/developer-products/icons?developerProductIds={listOfIds}&size={size}&format={format}&isCircular={bool}|Retrieves a list of developer products' icons.

# Groups
### General Info
|Version|URL|
|---|---|
|V2|https://groups.roblox.com/v2/groups?groupIds={groupId}|
|V1|https://groups.roblox.com/v1/groups/{groupId}|

Both versions return slightly different information. This tool uses both versions to get the group's info.
### Group Icon
https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size={size}&format={format}&isCircular={bool}
### Games
https://games.roblox.com/v2/groups/{groupId}/gamesV2?limit={limit}&sortOrder={Asc/Desc}&cursor={cursor}
### Affiliates
https://groups.roblox.com/v1/groups/{groupId}/relationships/{enemies|allies}?StartRowIndex={cursor}&MaxRows={limit}
### Group Roles
|Link|Use|
|---|---|
|https://groups.roblox.com/v1/groups/{groupId}/roles?includePrivate=true|Get rank ID and member count of each role.|
|https://groups.roblox.com/v1/groups/{groupId}/roles/{rankId}/users?limit={limit}&sortOrder={Asc/Desc}|Get users from given rank and group ID|

# Users
### General Info
https://users.roblox.com/v1/users/{userId}
### Headshot
https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds={userId}&includeBackground={bool}&includeProfileFrame={bool}&size={size}&format={format}&isCircular={bool}

### Games
|Link|Use|
|---|---|
|https://games.roblox.com/v2/users/{userId}/games?limit={limit}&sortOrder={Asc/Desc}&cursor={cursor}|Retrieves a list of the user's public games|
|https://inventory.roblox.com/v1/users/{userId}/places/inventory?placesTab=3&itemsPerPage={limit}&cursor={cursor}|Retrieves a list of places from the user's inventory (does not work if inventory is private)|
|https://games.roblox.com/v2/users/{userId}/favorite/games?limit={limit}&sortOrder={Asc/Desc}&cursor={cursor}|Retrieves a list of games favourited by the user

### Groups
|Link|Use|
|---|---|
|https://groups.roblox.com/v1/users/{userId}/groups/roles?includeLocked={bool}|Retrieves a list of groups the user is in.|
|https://groups.roblox.com/v1/users/{userId}/groups/primary/role|Retrieves the primary group of the user.|
